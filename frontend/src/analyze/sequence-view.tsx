import React from "react";
import LiteMol from "litemol";
import * as DataLoader from "./data-loader";
import {PrankPocket, PredictionEntity, Colors} from "./prediction-entity";
import {SequenceEntity, Sequence} from "./sequence-entity";
import {protaelFactory} from "./libraries/protael";

function createProtael(content: any, el: string, showControls: boolean): any {
  try {
    return protaelFactory(content, el, showControls);
  } catch(ex) {
    console.error("Can't create protael.", ex);
    throw ex;
  }
}

class CacheItem {
  constructor(query: LiteMol.Core.Structure.Query.Builder, selectionInfo: LiteMol.Bootstrap.Interactivity.Molecule.SelectionInfo) {
    this.query = query;
    this.selectionInfo = selectionInfo
  }

  query: LiteMol.Core.Structure.Query.Builder;
  selectionInfo: LiteMol.Bootstrap.Interactivity.Molecule.SelectionInfo;
}

class ProtaelFeature {
  constructor(regionType: string, color: string, start: number, end: number, label: string, properties: any) {
    this.regionType = regionType;
    this.color = color;
    this.start = start;
    this.end = end;
    this.label = label;
    this.properties = properties;
  }

  regionType: string;
  color: string;
  start: number;
  end: number;
  label: string;
  properties: any;
}

class ProtaelRegion {
  constructor(label: string, start: number, end: number, odd: boolean) {
    this.label = label;
    this.start = start;
    this.end = end;
    if (!odd) {
      this.color = "#DDD";
    } else {
      this.color = "#B0B0B0";
    }
  }

  label: string;
  start: number;
  end: number;
  color: string = "#DDD";
  regionType: string = "Chain"
}

class ProtaelContent {
  constructor(seq: string, pocketFeatures: ProtaelFeature[], chains: ProtaelRegion[], conservationScores: number[], bindingSites: ProtaelFeature[]) {
    this.sequence = seq;
    this.ftracks = [{
      label: "Pockets",
      color: "blue",
      showLine: false,
      allowOverlap: false,
      features: pocketFeatures
    }]
    this.overlayfeatures = {label: "Chains", features: chains};
    if (conservationScores != null && conservationScores.length > 0) {
      this.qtracks = [{
        label: "Evolutionary conservation",
        color: "gray",
        type: "column",
        values: conservationScores
      }]
    }
    if (bindingSites != null && bindingSites.length > 0) {
      this.ftracks.push({
        label: "Binding sites",
        color: "purple",
        showLine: false,
        allowOverlap: false,
        features: bindingSites
      });
    }
  }

  sequence: string;
  ftracks: Array<{ label: string, color: string, showLine: boolean, allowOverlap: boolean, features: Array<ProtaelFeature> }>
  overlayfeatures: { label: string, features: Array<ProtaelRegion> }
  qtracks: Array<{ label: string, color: string, type: string, values: number[] }> = []
}

export class SequenceView extends LiteMol.Plugin.Views.View<SequenceController, {}, {}> {
  indexMap: LiteMol.Core.Utils.FastMap<string, number> = LiteMol.Core.Utils.FastMap.create<string, number>();
  lastNumber: number | undefined;
  lastMouseOverFeature: any | undefined;
  protaelView: any = void 0;
  subscriptionHandle: LiteMol.Bootstrap.Rx.IDisposable | undefined;

  getResidue(seqIndex: number, model: LiteMol.Bootstrap.Entity.Molecule.Model) {
    let cacheId = `__resSelectionInfo-${seqIndex}`;
    let result = this.getCacheItem(cacheId, model);
    if (!result) {
      let pdbResIndex = this.controller.latestState.seq.indices[seqIndex];
      result = this.setCacheItem(cacheId, DataLoader.residuesBySeqNums(pdbResIndex), model)
    }
    return result;
  }

  getPocket(pocket: PrankPocket, model: LiteMol.Bootstrap.Entity.Molecule.Model) {
    let cacheId = `__resSelectionInfo-${pocket.name}-${pocket.rank}`
    let result = this.getCacheItem(cacheId, model);
    if (!result) result = this.setCacheItem(cacheId, LiteMol.Core.Structure.Query.atomsById.apply(null, pocket.surfAtomIds), model)
    return result;
  }

  setCacheItem(cacheId: string, query: LiteMol.Core.Structure.Query.Builder, model: LiteMol.Bootstrap.Entity.Molecule.Model) {
    let cache = this.controller.context.entityCache;
    let elements = LiteMol.Core.Structure.Query.apply(query, model.props.model).unionAtomIndices();
    let selection = LiteMol.Bootstrap.Interactivity.Info.selection(model as any, elements);
    let selectionInfo = LiteMol.Bootstrap.Interactivity.Molecule.transformInteraction(selection)!;
    let item = new CacheItem(query, selectionInfo);
    cache.set(model as any, cacheId, item);
    return item;
  }

  getCacheItem(cacheId: string, model: LiteMol.Bootstrap.Entity.Molecule.Model) {
    let cache = this.controller.context.entityCache;
    let item = cache.get<CacheItem>(model as any, cacheId);
    if (!item) return void 0;
    return item;
  }

  indicesToSequenceSegments(sortedIndices: number[]) {
    let result: { start: number, end: number }[] = [];
    // Transform indices to sequential indices and then sort them
    let lastStart = -1;
    let lastResNum = -1;
    sortedIndices.forEach((resNum, y) => {
      if (y == 0) {
        lastStart = resNum;
      } else {
        if (lastResNum + 1 < resNum) {
          result.push({start: lastStart, end: lastResNum});
          lastStart = resNum;
        }
      }
      lastResNum = resNum;
    })
    result.push({start: lastStart, end: lastResNum});
    return result;
  }

  addPocketFeatures(features: ProtaelFeature[]) {
    // Build hashmap index->sequential index one-based.
    this.controller.latestState.seq.indices.forEach((index, seqIndex) => {
      this.indexMap.set(index, seqIndex);
    });
    let pockets = this.controller.latestState.pockets;
    let pocketVisibility = this.controller.latestState.pocketVisibility;
    pockets.forEach((pocket, i) => {
      if (!pocketVisibility[i]) return; // Skip over invisible pockets.

      let sortedIndices = pocket.residueIds.map((index) => this.indexMap.get(index)!)
        .sort((a, b) => (a - b));
      let segments = this.indicesToSequenceSegments(sortedIndices);
      for (const s of segments) {
        let c = Colors.get(i % Colors.size);
        features.push(new ProtaelFeature("Pockets", `rgb(${c.r * 255}, ${c.g * 255}, ${c.b * 255})`, s.start + 1, s.end + 1, pocket.rank.toString(), {"Pocket name": pocket.name}))
      }
    });
  }

  getBindingSites() {
    let result: ProtaelFeature[] = [];
    let sites = this.controller.latestState.seq.bindingSites;
    if (sites && sites.length > 0) {
      let sortedIndices = sites.sort((a, b) => (a - b));
      let segments = this.indicesToSequenceSegments(sortedIndices);
      for (const s of segments) {
        result.push(new ProtaelFeature("Binding site", "purple", s.start + 1, s.end + 1, "", void 0));
      }
    }
    return result;
  }

  getChainRegions() {
    let result: ProtaelRegion[] = [];
    this.controller.latestState.seq.regions.forEach((region, i) => {
      result.push(new ProtaelRegion(`Chain ${region.regionName}`, region.start + 1, region.end + 1, i % 2 != 0));
    });
    return result;
  }

  componentDidMount() {
    this.subscriptionHandle = this.subscribe(this.controller.state, state => {
      this.updateProtael();
    });
    this.updateProtael();
  }

  componentWillUnmount() {
    if (this.subscriptionHandle) {
      this.unsubscribe(this.subscriptionHandle);
    }
    if (this.protaelView) {
      try {
        let el = document.getElementsByClassName("protael_resizable").item(0)
        if (el !== null) {
          el.parentNode!.removeChild(el);
        }
      } catch (err) {
        console.error(`Unable to remove Protael, ${err}`);
      }
    }
    this.fixProtaelHeight(true);
  }

  componentDidUpdate() {
    this.updateProtael();
  }

  createProtelContent() {
    let seq = this.controller.latestState.seq;
    if (seq.seq.length <= 0) return void 0; // Sequence isn't loaded yet.
    let features: Array<ProtaelFeature> = []
    this.addPocketFeatures(features); // Add pocket features.
    let chainRegions = this.getChainRegions();
    let bindingSites = this.getBindingSites();

    return new ProtaelContent(seq.seq.join(""), features, chainRegions, seq.scores, bindingSites);
  }

  updateProtael() {
    let protaelContent = this.createProtelContent();
    if (!protaelContent) {
      return;
    }
    if (this.protaelView) {
      try {
        let el = document.getElementsByClassName("protael_resizable").item(0)
        if (el !== null) {
          el.parentNode!.removeChild(el);
        }
      } catch (err) {
        console.error(`Unable to remove Protael, ${err}`);
      }
    }
    let seqViewEl = document.getElementById("seqView");
    if (!seqViewEl) {
      console.error("No seqView element!");
      return;
    }
    this.protaelView = createProtael(protaelContent, "seqView", true);
    this.protaelView.draw();
    this.protaelView.onMouseOver((e: any) => {
      if (e.offsetX == 0) return;
      // We use zero-based indexing for residues.
      let seqNum = this.protaelView.toOriginalX(this.protaelView.mouseToSvgXY(e).x) - 1;
      this.onLetterMouseEnter(seqNum)
    });
    this.fixProtaelHeight();

    this.addMouseEvents();

    // Add mouse callbacks.
    /*
    pViz.FeatureDisplayer.addMouseoverCallback(pocketFeatureLabels, (feature: any) => {
        this.selectAndDisplayToastPocket(this.lastMouseOverFeature, false);
        this.lastMouseOverFeature = this.parsePocketName(feature.type);
        this.selectAndDisplayToastPocket(this.lastMouseOverFeature, true);
    }).addMouseoutCallback(pocketFeatureLabels, (feature: any) => {
        this.selectAndDisplayToastPocket(this.lastMouseOverFeature, false);
        this.lastMouseOverFeature = void 0;
    });
    */
  }

  forEachNodeInSelector(elemets: NodeListOf<Element>, fnc: (el: HTMLElement, i?: number) => void) {
    for (let i: number = 0; i < elemets.length; i++) {
      let el = elemets.item(i) as HTMLElement;
      if (!el) continue;
      fnc(el, i);
    }
  }

  addMouseEvents() {
    let protael = document.getElementById('seqView');
    if (!protael) return;
    let features = document.querySelectorAll(".pl-ftrack .pl-feature");
    this.forEachNodeInSelector(features, el => {
      if (el.parentElement!.id == "Pockets") {
        let attr = el.attributes.getNamedItem("data-d");
        if (!attr) return;
        let pocket = this.parsePocketName(attr.value);
        el.onclick = () => this.onPocketClick(pocket);
        el.onmouseover = () => this.selectAndDisplayToastPocket(pocket, true);
        el.onmouseout = () => this.selectAndDisplayToastPocket(pocket, false);
      } else if (el.parentElement!.id == "Binding sites") {
        el.onmouseover = () => this.selectAndDisplayToastBindingSites(true);
        el.onmouseout = () => this.selectAndDisplayToastBindingSites(false);
      }
    })
  }

  fixProtaelHeight(clear: boolean = false) {
    let protael = document.getElementById('seqView');
    if (!protael && !clear) return;
    let height = !clear ? protael!.scrollHeight.toString().concat("px") : null;
    let minusHeight = !clear ? "-".concat(protael!.scrollHeight.toString().concat("px")) : null;
    this.forEachNodeInSelector(document.querySelectorAll(".lm-plugin .lm-layout-standard-outside .lm-layout-top"),
      el => {
        el.style.height = height as string;
        el.style.top = minusHeight as string;
      });
    this.forEachNodeInSelector(document.querySelectorAll(".lm-plugin .lm-layout-standard-outside .lm-layout-bottom"),
      el => {
        el.style.height = height as string;
        el.style.top = minusHeight as string;
      });

    this.forEachNodeInSelector(document.querySelectorAll(".lm-plugin .lm-layout-standard-landscape .lm-layout-main"),
      el => {
        el.style.top = height as string;
      });
    this.forEachNodeInSelector(document.querySelectorAll(".lm-plugin .lm-layout-standard-landscape .lm-layout-top"),
      el => {
        el.style.height = height as string;
      });

    this.forEachNodeInSelector(document.querySelectorAll(".lm-plugin .lm-layout-standard-portrait .lm-layout-main"),
      el => {
        el.style.top = height as string;
      });
    this.forEachNodeInSelector(document.querySelectorAll(".lm-plugin .lm-layout-standard-portrait .lm-layout-top"),
      el => {
        el.style.height = height as string;
      });
    this.forEachNodeInSelector(document.querySelectorAll(".lm-plugin .lm-layout-standard-portrait .lm-layout-bottom"),
      el => {
        el.style.height = height as string;
      });

    this.forEachNodeInSelector(document.querySelectorAll(".lm-plugin .lm-layout-expanded .lm-layout-main"),
      el => {
        el.style.top = height as string;
      });
    this.forEachNodeInSelector(document.querySelectorAll(".lm-plugin .lm-layout-expanded .lm-layout-top"),
      el => {
        el.style.height = height as string;
      });
    this.forEachNodeInSelector(document.querySelectorAll(".lm-plugin .lm-layout-expanded .lm-layout-bottom"),
      el => {
        el.style.height = height as string;
      });

    this.controller.context.scene.scene.resized();
    this.selectAndDisplayToastLetter(this.lastNumber, false);
  }

  onLetterMouseEnter(seqNumber?: number) {
    if (!seqNumber && seqNumber != 0) return;
    if (this.lastNumber) {
      if (this.lastNumber != seqNumber) {
        this.selectAndDisplayToastLetter(this.lastNumber, false);
        this.selectAndDisplayToastLetter(seqNumber, true);
      }
    } else {
      this.selectAndDisplayToastLetter(seqNumber, true);
    }
    this.lastNumber = seqNumber;
  }

  // Displays/Hides toast for given residue. SeqNumber is ***zero-based index*** of the residue.
  selectAndDisplayToastLetter(seqNumber: number | undefined, isOn: boolean) {
    if ((!seqNumber && seqNumber != 0) || seqNumber < 0) return;
    let ctx = this.controller.context;
    let model = ctx.select('model')[0] as unknown as LiteMol.Bootstrap.Entity.Molecule.Model;
    if (!model) return;

    // Get the sequence selection
    let seqSel = this.getResidue(seqNumber, model)

    // Highlight in the 3D Visualization
    LiteMol.Bootstrap.Command.Molecule.Highlight.dispatch(ctx, {
      model: model,
      query: seqSel.query,
      isOn
    });
    if (isOn) {
      // Show tooltip
      let label = LiteMol.Bootstrap.Interactivity.Molecule.formatInfo(seqSel.selectionInfo)
      LiteMol.Bootstrap.Event.Interactivity.Highlight.dispatch(ctx, [label/*, 'some additional label'*/])
    } else {
      // Hide tooltip
      LiteMol.Bootstrap.Event.Interactivity.Highlight.dispatch(ctx, [])
    }
  }

  // Displays/Hides toast for all binding sites.
  selectAndDisplayToastBindingSites(isOn: boolean) {
    let ctx = this.controller.context;
    let model = ctx.select('model')[0] as unknown as LiteMol.Bootstrap.Entity.Molecule.Model;
    if (!model) return;

    // Get the sequence selection
    let cacheId = '__resSelectionInfo-bindingSites__';
    let sel = this.getCacheItem(cacheId, model);
    if (!sel) {
      let indices = this.controller.latestState.seq.indices;
      let bindingSites = this.controller.latestState.seq.bindingSites.map(i => indices[i]);
      sel = this.setCacheItem(cacheId, DataLoader.residuesBySeqNums(...bindingSites), model)
    }

    // Highlight in the 3D Visualization
    LiteMol.Bootstrap.Command.Molecule.Highlight.dispatch(ctx, {
      model: model,
      query: sel.query,
      isOn
    })
    if (isOn) {
      // Show tooltip
      let label = LiteMol.Bootstrap.Interactivity.Molecule.formatInfo(sel.selectionInfo);
      LiteMol.Bootstrap.Event.Interactivity.Highlight.dispatch(ctx, [label/*, 'some additional label'*/])
    } else {
      // Hide tooltip
      LiteMol.Bootstrap.Event.Interactivity.Highlight.dispatch(ctx, [])
    }
  }

  parsePocketName(featureData: string | undefined) {
    // Using the fact that * is greedy, so it will match everything up to and including the last space.
    if (!featureData) return void 0;
    let featureDataParsed = JSON.parse(featureData);
    if (!featureDataParsed) return void 0;
    let pocketName = featureDataParsed['Pocket name'];
    if (!pocketName) return void 0;
    let pocketRes: PrankPocket | undefined = void 0;
    this.controller.latestState.pockets.forEach((pocket) => {
      if (pocket.name == pocketName) pocketRes = pocket;
    });
    return pocketRes;
  }

  selectAndDisplayToastPocket(pocket: PrankPocket | undefined, isOn: boolean) {
    if (!pocket) return;
    let ctx = this.controller.context;
    let model = ctx.select('model')[0] as unknown as LiteMol.Bootstrap.Entity.Molecule.Model;
    if (!model) return;

    // Get the pocket selection
    let seqSel = this.getPocket(pocket, model)

    // Highlight in the 3D Visualization
    LiteMol.Bootstrap.Command.Molecule.Highlight.dispatch(ctx, {
      model: model,
      query: seqSel.query,
      isOn
    })
    if (isOn) {
      // Show tooltip
      let label = LiteMol.Bootstrap.Interactivity.Molecule.formatInfo(seqSel.selectionInfo)
      LiteMol.Bootstrap.Event.Interactivity.Highlight.dispatch(ctx, [label/*, 'some additional label'*/])
    } else {
      // Hide tooltip
      LiteMol.Bootstrap.Event.Interactivity.Highlight.dispatch(ctx, [])
    }
  }

  onPocketClick(pocket: PrankPocket | undefined) {
    let ctx = this.controller.context;
    let model = ctx.select('model')[0] as unknown as LiteMol.Bootstrap.Entity.Molecule.Model;
    if (!model || !pocket) return;

    let query = this.getPocket(pocket, model).query;
    LiteMol.Bootstrap.Command.Molecule.FocusQuery.dispatch(ctx, {model, query})
  }

  render() {
    let seqId: number = -1;
    return <div id="seqView" className="noselect" onMouseLeave={() => {
      this.onLetterMouseEnter(void 0);
    }}/>
  }
}

export class SequenceController extends LiteMol.Bootstrap.Components.Component<{ seq: Sequence, pockets: PrankPocket[], pocketVisibility: boolean[], version: number }> {
  constructor(context: LiteMol.Bootstrap.Context) {
    super(context, {
      seq: {
        indices: [],
        seq: [],
        scores: [],
        bindingSites: [],
        regions: []
      }, pockets: [], pocketVisibility: [], version: 0
    });

    LiteMol.Bootstrap.Event.Tree.NodeAdded.getStream(context).subscribe(e => {
      if (e.data.type === SequenceEntity) {
        this.setState({seq: e.data.props.seq});
      } else if (e.data.type === PredictionEntity) {
        let pockets = e.data.props.pockets;
        this.setState({pockets, pocketVisibility: pockets.map(() => true)});
      }
    });

    // Subscribe to get updates about visibility of pockets.
    LiteMol.Bootstrap.Event.Tree.NodeUpdated.getStream(context).subscribe(e => {
      let entityRef = e.data.ref; // Pocket name whose visibility just changed.
      let pockets = this.latestState.pockets;
      let changed = false;
      let pocketVisibility = this.latestState.pocketVisibility;
      let i = 0;
      for (let pocket of pockets) {
        if (pocket.name !== entityRef) {
          i++;
          continue;
        }
        // It should still be visible even if some children are invisible.
        let visible = (e.data.state.visibility === LiteMol.Bootstrap.Entity.Visibility.Full || e.data.state.visibility === LiteMol.Bootstrap.Entity.Visibility.Partial);
        if (pocketVisibility[i] !== visible) {
          pocketVisibility[i] = visible;
          changed = true;
        }
        break;
      }
      if (changed) {
        // Keeping version field in the state, so that event about state update is fired.
        this.setState({
          pockets,
          pocketVisibility,
          version: this.latestState.version + 1
        });
      }
    });
  }
}
