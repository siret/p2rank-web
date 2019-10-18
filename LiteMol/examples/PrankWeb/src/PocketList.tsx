namespace LiteMol.PrankWeb {

    import Plugin = LiteMol.Plugin;
    import Query = LiteMol.Core.Structure.Query;
    import Views = Plugin.Views;
    import Bootstrap = LiteMol.Bootstrap;
    import React = LiteMol.Plugin.React; // this is to enable the HTML-like syntax

    class CacheItem {
        constructor(query: Query.Builder, selectionInfo: Bootstrap.Interactivity.Molecule.SelectionInfo) {
            this.query = query
            this.selectionInfo = selectionInfo
        }
        query: Query.Builder
        selectionInfo: Bootstrap.Interactivity.Molecule.SelectionInfo
    }

    
    export class PocketList extends React.Component<{ plugin: Plugin.Controller, data: DataLoader.PrankData }, {}> {

        calcConservationAvg() {
            let seq = this.props.data.sequence.props.seq;
            let pockets = this.props.data.prediction.props.pockets;
            if (!seq.scores || seq.scores.length <= 0) return pockets.map(() => "N/A");
            let indexMap = LiteMol.Core.Utils.FastMap.create<string, number>();
            seq.indices.forEach((element, i) => { indexMap.set(element, i); });
            return pockets.map((pocket, i) => {
                let scoreSum = pocket.residueIds.map((i) => seq.scores[indexMap.get(i)!]).reduce((acc, val) => acc + val, 0);
                // Round the score to 3 digit average.
                return (scoreSum / pocket.residueIds.length).toFixed(3);
            })
        }

        render() {
            let pockets = this.props.data.prediction.props.pockets;
            let ctx = this.props.plugin.context
            let controls: any[] = [];
            let conservationAvg: string[] = this.calcConservationAvg();
            if (pockets.length > 0) {
                controls.push(<h2 className="text-center">Pockets</h2>);
            }
            pockets.forEach((pocket, i) => {
                controls.push(
                    <Pocket plugin={this.props.plugin} model={this.props.data.model} pocket={pocket} index={i} conservationAvg={conservationAvg[i]} />
                )
            });
            return (<div className="pockets">{controls}
            </div>);
        }
    }

    export class Pocket extends React.Component<{ plugin: Plugin.Controller, model: Bootstrap.Entity.Molecule.Model, pocket: PrankPocket, index: number, conservationAvg: string },
        { isVisible: boolean }> {
        state = { isVisible: true }

        componentWillMount() {
            let ctx = this.props.plugin.context;
            Bootstrap.Event.Tree.NodeUpdated.getStream(ctx).subscribe(e => {
                let entityRef = e.data.ref; // Pocket name whose visibility just changed.
                let pocket = this.props.pocket;
                if (entityRef === pocket.name) {
                    // It should still be visible even if some children are invisible.
                    let visible = (e.data.state.visibility === Bootstrap.Entity.Visibility.Full || e.data.state.visibility === Bootstrap.Entity.Visibility.Partial);
                    if (this.state.isVisible !== visible) {
                        this.setState({ isVisible: visible });
                        this.toggleColoring(visible);
                    }
                }
            });
        }

        private toggleColoring(isVisible: boolean) {
            let atomMapping = DataLoader.getAtomColorMapping(this.props.plugin, this.props.model, false);
            let residueMapping = DataLoader.getResidueColorMapping(this.props.plugin, this.props.model);
            let pocketQuery = Query.atomsById.apply(null, this.props.pocket.surfAtomIds).compile()
            let pocketResQuery = DataLoader.residuesBySeqNums(...this.props.pocket.residueIds).compile()
            if (!atomMapping || !residueMapping) return;
            if (isVisible) {
                const colorIndex = (this.props.index % Colors.size) + 1; // Index of color that we want for the particular atom. i.e. Colors.get(i%Colors.size);
                for (const atom of pocketQuery(this.props.model.props.model.queryContext).unionAtomIndices()) {
                    atomMapping[atom] = colorIndex;
                }
                for (const atom of pocketResQuery(this.props.model.props.model.queryContext).unionAtomIndices()) {
                    residueMapping[atom] = colorIndex;
                }
            } else {
                let originalMapping = DataLoader.getAtomColorMapping(this.props.plugin, this.props.model, true);
                if (!originalMapping) return;
                for (const atom of pocketQuery(this.props.model.props.model.queryContext).unionAtomIndices()) {
                    atomMapping[atom] = originalMapping[atom];
                }
                for (const atom of pocketResQuery(this.props.model.props.model.queryContext).unionAtomIndices()) {
                    residueMapping[atom] = originalMapping[atom];
                }
            }
            DataLoader.setAtomColorMapping(this.props.plugin, this.props.model, atomMapping, false);
            DataLoader.setResidueColorMapping(this.props.plugin, this.props.model, residueMapping);
            DataLoader.colorProtein(this.props.plugin);
        }

        private getPocket() {
            let ctx = this.props.plugin.context
            let cache = ctx.entityCache;
            let pocket = this.props.pocket;
            let model = this.props.model;
            let cacheId = `__pocketSelectionInfo-${pocket.name}`
            let item = cache.get<CacheItem>(model, cacheId);
            if (!item) {
                let selectionQ = Core.Structure.Query.atomsById.apply(null, pocket.surfAtomIds)//Core.Structure.Query.chains({ authAsymId: 'A' })
                let elements = Core.Structure.Query.apply(selectionQ, model.props.model).unionAtomIndices()
                let selection = Bootstrap.Interactivity.Info.selection(model, elements)
                let selectionInfo = Bootstrap.Interactivity.Molecule.transformInteraction(selection)!;
                item = new CacheItem(selectionQ, selectionInfo)
                cache.set(model, cacheId, item)
            }
            return item
        }

        onPocketMouse(enter: boolean) {
            // Cannot focus on hidden pocket.
            if (!this.state.isVisible) return;

            let ctx = this.props.plugin.context;
            let model = this.props.model;

            // Get the sequence selection
            let pocketSel = this.getPocket()

            // Highlight in the 3D Visualization
            Bootstrap.Command.Molecule.Highlight.dispatch(ctx, { model: model, query: pocketSel.query, isOn: enter })

            if (enter) {
                // Show tooltip
                let label = Bootstrap.Interactivity.Molecule.formatInfo(pocketSel.selectionInfo)
                Bootstrap.Event.Interactivity.Highlight.dispatch(ctx, [label, `Pocket score: ${this.props.pocket.score}`])
            } else {
                // Hide tooltip
                Bootstrap.Event.Interactivity.Highlight.dispatch(ctx, [])
            }
        }

        onPocketClick() {
            // Cannot focus on hidden pocket.
            if (!this.state.isVisible) return;

            let ctx = this.props.plugin.context;
            let model = this.props.model;

            let query = this.getPocket().query
            Bootstrap.Command.Molecule.FocusQuery.dispatch(ctx, { model, query })
        }

        toggleVisibility() {
            let ctx = this.props.plugin.context;
            let pocketEntity = ctx.select(this.props.pocket.name)[0] as Bootstrap.Entity.Any;
            if (pocketEntity) {
                Bootstrap.Command.Entity.SetVisibility.dispatch(this.props.plugin.context, { entity: pocketEntity, visible: !this.state.isVisible });
            }
            this.setState({ isVisible: !this.state.isVisible });
        }

        // https://css-tricks.com/left-align-and-right-align-text-on-the-same-line/
        render() {
            let pocket = this.props.pocket;
            let focusIconDisplay = this.state.isVisible ? "inherit" : "none";
            let hideIconOpacity = this.state.isVisible ? 1 : 0.3;
            let c = Colors.get(this.props.index % Colors.size);
            return <div className={"pocket"} style={{borderColor: `rgb(${c.r * 255}, ${c.g * 255}, ${c.b * 255})`}}
            >
                <button style={{ float: 'left', display: focusIconDisplay }} title="Focus" className="pocket-btn" onClick={() => { this.onPocketClick() }} onMouseEnter={() => { this.onPocketMouse(true) }} onMouseOut={() => { this.onPocketMouse(false) }}><span className="pocket-icon focus-icon" /></button>
                <button style={{ float: 'right', opacity: hideIconOpacity }} title="Hide" className="pocket-btn" onClick={() => { this.toggleVisibility() }}><span className="pocket-icon hide-icon" /></button>
                <div style={{ clear: 'both' }} />


                <p style={{ float: 'left' }} className="pocket-feature">Pocket rank:</p><p style={{ float: 'right' }}>{pocket.rank}</p><div style={{ clear: 'both' }} />
                <p style={{ float: 'left' }} className="pocket-feature">Pocket score:</p><p style={{ float: 'right' }}>{pocket.score}</p><div style={{ clear: 'both' }} />
                <p style={{ float: 'left' }} className="pocket-feature">AA count:</p><p style={{ float: 'right' }}>{pocket.residueIds.length}</p><div style={{ clear: 'both' }} />
                <p style={{ float: 'left', textDecoration: 'overline' }} className="pocket-feature">Conservation:</p><p style={{ float: 'right' }}>{this.props.conservationAvg}</p><div style={{ clear: 'both' }} />
            </div>
        }
    }
}