namespace LiteMol.PrankWeb {

    import Plugin = LiteMol.Plugin;
    import Query = LiteMol.Core.Structure.Query;
    import Views = Plugin.Views;
    import Bootstrap = LiteMol.Bootstrap;
    import Transformer = Bootstrap.Entity.Transformer;
    import LayoutRegion = Bootstrap.Components.LayoutRegion;

    export function create(target: HTMLElement) {
        let plugin = Plugin.create({
            target,
            viewportBackground: '#e7e7e7', // white
            layoutState: {
                hideControls: true,
                isExpanded: false,
                collapsedControlsLayout: Bootstrap.Components.CollapsedControlsLayout.Landscape,
            },
            customSpecification: PrankWebSpec
        });
        plugin.context.logger.message(`LiteMol ${Plugin.VERSION.number}`);

        plugin.command(Bootstrap.Command.Layout.SetState, {
            regionStates: {
                [Bootstrap.Components.LayoutRegion.Top]: 'Sticky',
            }
        })

        return plugin;
    }

    // Div that LiteMol mounts into.
    let appNode = document.getElementById('app')!
    // Div that control panel mounts into.
    let pocketNode = document.getElementById('pocket-list')!

    // Specify what data to display.
    let inputType: string = appNode.getAttribute("data-input-type")!
    let inputId: string = appNode.getAttribute("data-input-id")!
    App.render(create(appNode), inputType, inputId, pocketNode);
}
