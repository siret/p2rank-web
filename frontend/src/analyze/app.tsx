import React from "react";
import LiteMol from "litemol";
import * as DataLoader from "./data-loader";
import {PrankPocket, Colors} from "./prediction-entity";
import {Sequence} from "./sequence-entity";
import ControlBox from "./control-buttons";
import PocketList from "./pocket-list";

export function render(
  plugin: LiteMol.Plugin.Controller,
  inputType: string,
  inputId: string,
  target: HTMLElement) {
  LiteMol.Plugin.ReactDOM.render(
    <App plugin={plugin} inputType={inputType} inputId={inputId}/>
    , target)
}

export enum PolymerViewType {
  Atoms = 0,
  Surface = 1,
  Cartoon = 2,
}

export enum PocketsViewType {
  Atoms = 0,
  Surface = 1,
}

class CacheItem {
  query: LiteMol.Core.Structure.Query.Builder;
  selectionInfo: LiteMol.Bootstrap.Interactivity.Molecule.SelectionInfo;

  constructor(
    query: LiteMol.Core.Structure.Query.Builder,
    selectionInfo: LiteMol.Bootstrap.Interactivity.Molecule.SelectionInfo) {
    this.query = query;
    this.selectionInfo = selectionInfo
  }

}

export interface PocketViewData {
  pocket: PrankPocket,
  conservation: string,
  isVisible: boolean,
  selection: any,
}

export class App extends React.Component<{
  plugin: LiteMol.Plugin.Controller,
  inputId: string,
  inputType: string
}, {
  isLoading?: boolean,
  error?: string,
  data?: DataLoader.PrankData,
  polymerView: PolymerViewType,
  pocketsView: PocketsViewType,
  pockets: PocketViewData[],
}> {

  state = {
    "isLoading": true,
    "data": undefined,
    "error": undefined,
    "polymerView": PolymerViewType.Surface,
    "pocketsView": PocketsViewType.Surface,
    "pockets": [],
  };

  data = {
    /**
     * As we need to react on changes from LiteMol
     * and our components as well, we use this property
     * to mark that modifications are happening by our
     * component. As this got changed between functions
     * it can't be part of the state.
     */
    "updateInProgress": false,
  };

  constructor(props: any) {
    super(props);
    this.onNodeUpdated = this.onNodeUpdated.bind(this);
    this.onPolymerViewChange = this.onPolymerViewChange.bind(this);
    this.onPocketsViewChange = this.onPocketsViewChange.bind(this);
    this.onShowAll = this.onShowAll.bind(this);
    this.onSetPocketVisibility = this.onSetPocketVisibility.bind(this);
    this.onShowOnlyPocket = this.onShowOnlyPocket.bind(this);
    this.onFocusPocket = this.onFocusPocket.bind(this);
    this.onHighlightPocket = this.onHighlightPocket.bind(this);
  }

  componentDidMount() {
    this.loadData();
    let context = this.props.plugin.context;
    LiteMol.Bootstrap.Event.Tree.NodeUpdated
      .getStream(context)
      .subscribe(this.onNodeUpdated);
  }

  loadData() {
    this.setState({
      "isLoading": true,
      "error": undefined,
    });
    const {plugin, inputType, inputId} = this.props;
    DataLoader.loadData(plugin, inputType, inputId)
      .then((data) => DataLoader.visualizeData(plugin, data))
      .then((data) => {
        return new LiteMol.Promise<DataLoader.PrankData>((accept, reject) => {
          if (DataLoader.colorProtein(plugin)) {
            accept(data);
          } else {
            reject("Mapping or model not found!");
          }
        });
      })
      .then((data) => {
        this.setState({
          "isLoading": false,
          "data": data,
          "pockets": createPocketList(
            this.props.plugin,
            data.model,
            // These are objects from DataLoader, but they are wrapped
            // by LiteMol, so we need to use "props" to get to them.
            data.prediction.props.pockets,
            data.sequence.props.seq),
        });
      })
      .catch((e) => this.setState({"isLoading": false, "error": "" + e}));
  }

  render() {
    if (this.state.isLoading) {
      return (
        <div>
          <h1 className="text-center">Loading ...</h1>
        </div>
      );
    }
    if (this.state.data) {
      const downloadUrl = "./api/v1/task/" + this.props.inputType
        + "/" + this.props.inputId + "/public/visualizations.zip";
      return (
        <div>
          <ControlBox
            plugin={this.props.plugin}
            downloadUrl={downloadUrl}
            polymerView={this.state.polymerView}
            pocketsView={this.state.pocketsView}
            onPolymerViewChange={this.onPolymerViewChange}
            onPocketsViewChange={this.onPocketsViewChange}
          />
          <PocketList
            pockets={this.state.pockets}
            showAll={this.onShowAll}
            setPocketVisibility={this.onSetPocketVisibility}
            showOnlyPocket={this.onShowOnlyPocket}
            focusPocket={this.onFocusPocket}
            highlightPocket={this.onHighlightPocket}
          />
        </div>
      );
    }
    return (
      <div>
        <button onClick={this.loadData}>Reload data</button>
        <div style={{"color": "red", "fontSize": "18px"}}>
          Error: {this.state.error}
        </div>
      </div>
    );
  }

  /**
   * React to changes from LiteMol.
   */
  onNodeUpdated(event: any) {
    if (this.data.updateInProgress) {
      // This update does not come from LiteMol. So we break here to
      // not create a cycle.
      return;
    }
    let entityRef = event.data.ref;
    for (let index = 0; index < this.state.pockets.length; ++index) {
      const item: PocketViewData = this.state.pockets[index];
      if (item.pocket.name !== entityRef) {
        continue;
      }
      let isVisible = (
        event.data.state.visibility === LiteMol.Bootstrap.Entity.Visibility.Full
        || event.data.state.visibility === LiteMol.Bootstrap.Entity.Visibility.Partial);
      if (item.isVisible === isVisible) {
        // No change in visibility.
        return;
      }
      this.onSetPocketVisibility(index, isVisible);
    }
  }

  onPolymerViewChange(value: PolymerViewType) {
    this.setState({"polymerView": value});
    updatePolymerView(this.props.plugin, value);
  }

  onPocketsViewChange(value: PocketsViewType) {
    this.setState({"pocketsView": value});
    this.data.updateInProgress = true;
    updatePocketsView(
      this.props.plugin,
      // @ts-ignore
      this.state.data.prediction.props.pockets,
      this.state.pockets,
      value);
    this.data.updateInProgress = false;
  }

  onShowAll() {
    const pockets = this.state.pockets.map((item: PocketViewData) => ({
      ...item,
      "isVisible": true
    }));
    this.synchronizePocketsVisibility(pockets);
  }

  /**
   * Only update visibility when changed, must not be used to change
   * selected visual style. Does also update component state.
   */
  synchronizePocketsVisibility(nextPockets: PocketViewData[]) {
    const prevPockets = this.state.pockets;
    this.data.updateInProgress = true;
    // We know prevPockets.length === nextPockets.length
    for (let index = 0; index < prevPockets.length; ++index) {
      const prevPocket: PocketViewData = prevPockets[index];
      const nextPocket: PocketViewData = nextPockets[index];
      if (prevPocket.isVisible === nextPocket.isVisible) {
        // There is no change in visibility so no need to update.
        continue;
      }
      updatePocketView(
        this.props.plugin.context,
        // @ts-ignore
        this.state.data.prediction.props.pockets[index],
        nextPocket,
        this.state.pocketsView);
      updatePeptideColoringForPocket(
        this.props.plugin,
        // @ts-ignore
        this.state.data.model,
        // @ts-ignore
        this.state.data.prediction.props.pockets[index],
        nextPocket,
        index
      );

    }
    this.data.updateInProgress = false;
    this.setState({"pockets": nextPockets});
  }

  onSetPocketVisibility(index: number, isVisible: boolean) {
    const pockets = [
      ...this.state.pockets.slice(0, index),
      {
        // @ts-ignore
        ...this.state.pockets[index],
        "isVisible": isVisible
      },
      ...this.state.pockets.slice(index + 1)
    ];
    this.synchronizePocketsVisibility(pockets);
  }

  onShowOnlyPocket(index: number) {
    const pockets = this.state.pockets.map((item: PocketViewData, i) => ({
      ...item,
      "isVisible": i === index
    }));
    this.synchronizePocketsVisibility(pockets);
  }

  onFocusPocket(index: number) {
    const context = this.props.plugin.context;
    // @ts-ignore
    const model = this.state.data.model;
    // @ts-ignore
    const query = this.state.pockets[index].selection.query;
    LiteMol.Bootstrap.Command.Molecule.FocusQuery.dispatch(context, {
      model,
      query
    });
  }

  onHighlightPocket(index: number, isHighlighted: boolean) {
    const context = this.props.plugin.context;
    // @ts-ignore
    let model = this.state.data.model;
    const pocket : PocketViewData = this.state.pockets[index];
    // Get the sequence selection
    // Highlight in the 3D Visualization
    LiteMol.Bootstrap.Command.Molecule.Highlight.dispatch(
      context, {
        "model": model,
        "query": pocket.selection.query,
        "isOn": isHighlighted
      });
    if (isHighlighted) {
      // Show tooltip
      const label = LiteMol.Bootstrap.Interactivity.Molecule.formatInfo(
        pocket.selection.selectionInfo);
      LiteMol.Bootstrap.Event.Interactivity.Highlight.dispatch(
        context, [label, `Pocket score: ${pocket.conservation}`])
    } else {
      // Hide tooltip
      LiteMol.Bootstrap.Event.Interactivity.Highlight.dispatch(context, []);
    }
  }

}

function createPocketList(
  plugin: LiteMol.Plugin.Controller, model: LiteMol.Bootstrap.Entity.Molecule.Model,
  pockets: PrankPocket[], sequence: Sequence): PocketViewData[] {
  //
  const result = [];
  const conservations = computePocketConservationAverage(pockets, sequence);
  for (let index = 0; index < pockets.length; ++index) {
    result.push({
      "pocket": pockets[index],
      "conservation": conservations[index],
      "isVisible": true,
      "selection": getPocketSelection(plugin, model, pockets[index])
    });
  }
  return result;
}

function computePocketConservationAverage(
  pockets: PrankPocket[], sequence: Sequence) {
  if (!sequence.scores || sequence.scores.length <= 0) {
    return pockets.map(() => "N/A");
  }
  const indexMap = LiteMol.Core.Utils.FastMap.create<string, number>();
  sequence.indices.forEach((element, i) => {
    indexMap.set(element, i);
  });
  return pockets.map((pocket, i) => {
    const scoreSum = pocket.residueIds
      .map((i) => sequence.scores[indexMap.get(i)!])
      .reduce((acc, val) => acc + val, 0);
    // Round the score to 3 digit average.
    return (scoreSum / pocket.residueIds.length).toFixed(3);
  })
}

function getPocketSelection(
  plugin: LiteMol.Plugin.Controller,
  model: LiteMol.Bootstrap.Entity.Molecule.Model,
  pocket: PrankPocket) {
  // TODO Consider whether we need the cache at all here?
  const cache = plugin.context.entityCache;
  const cacheId = `__pocketSelectionInfo-${pocket.name}`;
  let item = cache.get<CacheItem>(model as any, cacheId);
  if (!item) {
    const selectionQ = LiteMol.Core.Structure.Query.atomsById.apply(null, pocket.surfAtomIds);
    const elements = LiteMol.Core.Structure.Query.apply(selectionQ, model.props.model).unionAtomIndices();
    const selection = LiteMol.Bootstrap.Interactivity.Info.selection(model as any, elements);
    const selectionInfo = LiteMol.Bootstrap.Interactivity.Molecule.transformInteraction(selection)!;
    item = new CacheItem(selectionQ, selectionInfo);
    cache.set(model as any, cacheId, item)
  }
  return item
}

function updatePolymerView(
  plugin: LiteMol.Plugin.Controller, polymerView: PolymerViewType) {
  const surface = plugin.selectEntities(
    LiteMol.Bootstrap.Tree.Selection.byRef(DataLoader.TREE_REF_SURFACE)
      .subtree().ofType(LiteMol.Bootstrap.Entity.Molecule.Visual))[0];
  const cartoon = plugin.selectEntities(
    LiteMol.Bootstrap.Tree.Selection.byRef(DataLoader.TREE_REF_CARTOON)
      .subtree().ofType(LiteMol.Bootstrap.Entity.Molecule.Visual))[0];
  const atoms = plugin.selectEntities(
    LiteMol.Bootstrap.Tree.Selection.byRef(DataLoader.TREE_REF_ATOMS)
      .subtree().ofType(LiteMol.Bootstrap.Entity.Molecule.Visual))[0];
  if (!surface || !cartoon || !atoms) {
    console.error("Can't select required definitions.");
    return;
  }
  let showAtoms = false;
  let showCartoon = false;
  let showSurface = false;
  switch (polymerView) {
    case PolymerViewType.Atoms:
      showAtoms = true;
      break;
    case PolymerViewType.Cartoon:
      showCartoon = true;
      break;
    case PolymerViewType.Surface:
      showSurface = true;
      break;
  }
  // We can modify only changed here, but we do all
  // to mitigate any user interaction with LiteMol directly.
  LiteMol.Bootstrap.Command.Entity.SetVisibility.dispatch(plugin.context, {
    "entity": atoms,
    "visible": showAtoms,
  });
  LiteMol.Bootstrap.Command.Entity.SetVisibility.dispatch(plugin.context, {
    "entity": surface,
    "visible": showSurface,
  });
  LiteMol.Bootstrap.Command.Entity.SetVisibility.dispatch(plugin.context, {
    "entity": cartoon,
    "visible": showCartoon,
  });
}

function updatePocketsView(
  plugin: LiteMol.Plugin.Controller, pockets: PrankPocket[],
  pocketsView: PocketViewData[], viewType: PocketsViewType,
) {
  for (let index = 0; index < pockets.length; ++index) {
    updatePocketView(
      plugin.context, pockets[index], pocketsView[index], viewType);
  }
}

function updatePocketView(
  context: LiteMol.Bootstrap.Context, pocket: PrankPocket,
  pocketView: PocketViewData, viewType: PocketsViewType) {
  let showAtoms = false;
  let showSurface = false;
  if (pocketView.isVisible) {
    switch (viewType) {
      case PocketsViewType.Atoms:
        showAtoms = true;
        break;
      case PocketsViewType.Surface:
        showSurface = true;
        break;
    }
  }
  // We need to update pocket root entity, as other
  // parts of the application may listed to their changes
  // (SequenceView).
  const pocketEntity = context.select(pocket.name) [0] as LiteMol.Bootstrap.Entity.Any;
  LiteMol.Bootstrap.Command.Entity.SetVisibility.dispatch(context, {
    "entity": pocketEntity,
    "visible": pocketView.isVisible
  });
  // The changes are not propagated in the hierarchy, so
  // we need to update visuals as well.
  const atoms = context.select(
    DataLoader.getPocketAtomsRefVisual(pocket)
  ) [0] as LiteMol.Bootstrap.Entity.Any;
  const surface = context.select(
    DataLoader.getPocketSurfaceAtomsRefVisual(pocket)
  ) [0] as LiteMol.Bootstrap.Entity.Any;
  LiteMol.Bootstrap.Command.Entity.SetVisibility.dispatch(context, {
    "entity": atoms,
    "visible": showAtoms
  });
  LiteMol.Bootstrap.Command.Entity.SetVisibility.dispatch(context, {
    "entity": surface,
    "visible": showSurface
  });


}

function updatePeptideColoringForPocket(
  plugin: LiteMol.Plugin.Controller, model: LiteMol.Bootstrap.Entity.Molecule.Model,
  pocket: PrankPocket, pocketView: PocketViewData, index: number
) {
  let atomMapping = DataLoader.getAtomColorMapping(plugin, model);
  let residueMapping = DataLoader.getResidueColorMapping(plugin, model);
  if (!atomMapping || !residueMapping) {
    return;
  }
  let pocketQuery = LiteMol.Core.Structure.Query.atomsById.apply(null, pocket.surfAtomIds).compile();
  let pocketResQuery = DataLoader.residuesBySeqNums(...pocket.residueIds).compile();
  if (pocketView.isVisible) {
    const colorIndex = (index % Colors.size) + 1;
    for (const atom of pocketQuery(model.props.model.queryContext).unionAtomIndices()) {
      atomMapping[atom] = colorIndex;
    }
    for (const atom of pocketResQuery(model.props.model.queryContext).unionAtomIndices()) {
      residueMapping[atom] = colorIndex;
    }
  } else {
    const originalMapping = DataLoader.getConservationAtomColorMapping(plugin, model);
    if (!originalMapping) {
      return;
    }
    for (const atom of pocketQuery(model.props.model.queryContext).unionAtomIndices()) {
      atomMapping[atom] = originalMapping[atom];
    }
    for (const atom of pocketResQuery(model.props.model.queryContext).unionAtomIndices()) {
      residueMapping[atom] = originalMapping[atom];
    }
  }
  //
  DataLoader.setAtomColorMapping(plugin, model, atomMapping);
  DataLoader.setResidueColorMapping(plugin, model, residueMapping);
  DataLoader.colorProtein(plugin);
}
