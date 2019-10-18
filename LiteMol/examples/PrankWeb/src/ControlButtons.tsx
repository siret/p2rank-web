namespace LiteMol.PrankWeb {
    import Plugin = LiteMol.Plugin;
    import Query = LiteMol.Core.Structure.Query;
    import Views = Plugin.Views;
    import Bootstrap = LiteMol.Bootstrap;
    import React = LiteMol.Plugin.React; // this is to enable the HTML-like syntax

    enum ColoredView {
        Atoms = 0, Surface, Cartoon,
    }

    export class ControlButtons extends React.Component<{  plugin: Plugin.Controller, inputType: string, inputId: string }, { coloredView: ColoredView }> {
        state = { coloredView: ColoredView.Atoms }; // So that surface is default.

        // http://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript
        copyTextToClipboard(text : string) {
            let textArea = document.createElement("textarea");

            //
            // *** This styling is an extra step which is likely not required. ***
            //
            // Why is it here? To ensure:
            // 1. the element is able to have focus and selection.
            // 2. if element was to flash render it has minimal visual impact.
            // 3. less flakyness with selection and copying which **might** occur if
            //    the textarea element is not visible.
            //
            // The likelihood is the element won't even render, not even a flash,
            // so some of these are just precautions. However in IE the element
            // is visible whilst the popup box asking the user for permission for
            // the web page to copy to the clipboard.
            //

            // Place in top-left corner of screen regardless of scroll position.
            textArea.style.position = 'fixed';
            textArea.style.top = "0";
            textArea.style.left = "0";

            // Ensure it has a small width and height. Setting to 1px / 1em
            // doesn't work as this gives a negative w/h on some browsers.
            textArea.style.width = '2em';
            textArea.style.height = '2em';

            // We don't need padding, reducing the size if it does flash render.
            textArea.style.padding = "0";

            // Clean up any borders.
            textArea.style.border = 'none';
            textArea.style.outline = 'none';
            textArea.style.boxShadow = 'none';

            // Avoid flash of white box if rendered for any reason.
            textArea.style.background = 'transparent';


            textArea.value = text;

            document.body.appendChild(textArea);

            textArea.select();

            try {
                let successful = document.execCommand('copy');
                let msg = successful ? 'successful' : 'unsuccessful';
                console.log('Copying text command was ' + msg);
            } catch (err) {
                console.log('Oops, unable to copy');
            }

            document.body.removeChild(textArea);
        }

        toggleSequenceView() {
            let regionStates = this.props.plugin.context.layout.latestState.regionStates;
            if (!regionStates) return;
            let regionState = regionStates[Bootstrap.Components.LayoutRegion.Top];
            this.props.plugin.command(Bootstrap.Command.Layout.SetState, {
                regionStates: {
                    [Bootstrap.Components.LayoutRegion.Top]: regionState == 'Sticky' ? 'Hidden' : 'Sticky'
                }
            })
        }

        toggleStructuralView() {
            let plugin = this.props.plugin
            const surface = plugin.selectEntities(Bootstrap.Tree.Selection.byRef(DataLoader.TREE_REF_SURFACE).subtree().ofType(Bootstrap.Entity.Molecule.Visual))[0];
            const cartoon = plugin.selectEntities(Bootstrap.Tree.Selection.byRef(DataLoader.TREE_REF_CARTOON).subtree().ofType(Bootstrap.Entity.Molecule.Visual))[0];
            const atoms = plugin.selectEntities(Bootstrap.Tree.Selection.byRef(DataLoader.TREE_REF_ATOMS).subtree().ofType(Bootstrap.Entity.Molecule.Visual))[0];
            if (!surface || !cartoon || !atoms) return
            let newStateView : ColoredView = (this.state.coloredView + 1) % 3;
            this.setState({coloredView: newStateView});
            switch (newStateView) {
                case ColoredView.Atoms: {
                    Bootstrap.Command.Entity.SetVisibility.dispatch(plugin.context, { entity: atoms, visible: true });
                    Bootstrap.Command.Entity.SetVisibility.dispatch(plugin.context, { entity: surface, visible: false });
                    Bootstrap.Command.Entity.SetVisibility.dispatch(plugin.context, { entity: cartoon, visible: true });
                    break;
                }
                case ColoredView.Cartoon: {
                    Bootstrap.Command.Entity.SetVisibility.dispatch(plugin.context, { entity: atoms, visible: false });
                    Bootstrap.Command.Entity.SetVisibility.dispatch(plugin.context, { entity: surface, visible: false });
                    Bootstrap.Command.Entity.SetVisibility.dispatch(plugin.context, { entity: cartoon, visible: true });
                    break;
                }
                case ColoredView.Surface: {
                    Bootstrap.Command.Entity.SetVisibility.dispatch(plugin.context, { entity: atoms, visible: false });
                    Bootstrap.Command.Entity.SetVisibility.dispatch(plugin.context, { entity: surface, visible: true });
                    Bootstrap.Command.Entity.SetVisibility.dispatch(plugin.context, { entity: cartoon, visible: true });
                    break;
                }
            }
        }

        componentDidMount() {
            this.toggleStructuralView();
        }

        render() {
            let type: string = this.props.inputType;
            let downloadUrl = `/api/${type}/all/${this.props.inputId}`;
            let mail = "mailto:?subject=PrankWeb".concat(encodeURIComponent(` - ${window.location.href}`))
            return (<div className="control-buttons">
                <h2 className="text-center">Tools</h2>
                <button className="control-btn" title="Download report" onClick={() => { window.location.href = downloadUrl; }}><span className="button-icon download-icon" /></button>
                <button className="control-btn" title="Send via e-mail" onClick={() => { window.open(mail, '_blank'); }}><span className="button-icon mail-icon" /></button>
                <button className="control-btn" title="Copy URL to clipboard" onClick={() => { this.copyTextToClipboard(window.location.href) }}><span className="button-icon clipboard-icon" /></button>
                <button className="control-btn" title="Show/hide sequence view" onClick={() => { this.toggleSequenceView() }}><span className="button-icon seq-icon" /></button>
                <button className="control-btn" title="Toogle structural view (cartoon, surface, atoms)" onClick={() => { this.toggleStructuralView() }}><span className="button-icon struct-icon" /></button>
            </div>);
        }
    }
}