namespace LiteMol.PrankWeb {
    import Views = LiteMol.Plugin.Views;
    import Bootstrap = LiteMol.Bootstrap;
    import Transformer = Bootstrap.Entity.Transformer;
    import LayoutRegion = Bootstrap.Components.LayoutRegion;

    export const PrankWebSpec: Plugin.Specification = {
        settings: {},
        transforms: [
            // Molecule(model) transforms
            { transformer: Transformer.Molecule.CreateModel, view: Views.Transform.Molecule.CreateModel, initiallyCollapsed: true },
            { transformer: Transformer.Molecule.CreateSelection, view: Views.Transform.Molecule.CreateSelection, initiallyCollapsed: true },

            { transformer: Transformer.Molecule.CreateAssembly, view: Views.Transform.Molecule.CreateAssembly, initiallyCollapsed: true },
            { transformer: Transformer.Molecule.CreateSymmetryMates, view: Views.Transform.Molecule.CreateSymmetryMates, initiallyCollapsed: true },

            { transformer: Transformer.Molecule.CreateMacromoleculeVisual, view: Views.Transform.Empty },
            { transformer: Transformer.Molecule.CreateVisual, view: Views.Transform.Molecule.CreateVisual },

            { transformer: Transformer.Molecule.CreateLabels, view: Views.Transform.Molecule.CreateLabels },

            { transformer: Extensions.ParticleColoring.Apply, view: Extensions.ParticleColoring.UI.Apply, initiallyCollapsed: true },
        ],
        behaviours: [
            // you will find the source of all behaviours in the Bootstrap/Behaviour directory

            Bootstrap.Behaviour.SetEntityToCurrentWhenAdded,
            Bootstrap.Behaviour.FocusCameraOnSelect,
            Bootstrap.Behaviour.UnselectElementOnRepeatedClick,

            // this colors the visual when a selection is created on it.
            //Bootstrap.Behaviour.ApplySelectionToVisual,

            // this colors the visual when it's selected by mouse or touch
            Bootstrap.Behaviour.ApplyInteractivitySelection,

            // this shows what atom/residue is the pointer currently over
            Bootstrap.Behaviour.Molecule.HighlightElementInfo,

            // when the same element is clicked twice in a row, the selection is emptied
            Bootstrap.Behaviour.UnselectElementOnRepeatedClick,

            // distance to the last "clicked" element
            Bootstrap.Behaviour.Molecule.DistanceToLastClickedElement,

            Bootstrap.Behaviour.Molecule.HighlightElementInfo,
            Bootstrap.Behaviour.Molecule.DistanceToLastClickedElement,

            // when somethinh is selected, this will create an "overlay visual" of the selected residue and show every other residue within 5ang
            // you will not want to use this for the ligand pages, where you create the same thing this does at startup
            Bootstrap.Behaviour.Molecule.ShowInteractionOnSelect(5),                

            // this tracks what is downloaded and some basic actions. Does not send any private data etc.
            // While it is not required for any functionality, we as authors are very much interested in basic 
            // usage statistics of the application and would appriciate if this behaviour is used.
            // Bootstrap.Behaviour.GoogleAnalytics('UA-77062725-1')
        ],
        components: [
            Plugin.Components.Visualization.HighlightInfo(LayoutRegion.Main, true),
            Plugin.Components.Entity.Current('LiteMol', Plugin.VERSION.number)(LayoutRegion.Right, true),
            Plugin.Components.Transform.View(LayoutRegion.Right),
            //Plugin.Components.Context.Log(LayoutRegion.Bottom, true),
            Plugin.Components.create('PrankWeb.SequenceView', s => new PrankWeb.SequenceController(s), SequenceView)(LayoutRegion.Top, true),
            Plugin.Components.Context.Overlay(LayoutRegion.Root),
            Plugin.Components.Context.Toast(LayoutRegion.Main, true),
            Plugin.Components.Context.BackgroundTasks(LayoutRegion.Main, true)
        ],
        viewport: {
            view: Views.Visualization.Viewport,
            controlsView: Views.Visualization.ViewportControls
        },
        layoutView: Views.Layout, // nor this
        tree: { region: LayoutRegion.Left, view: Views.Entity.Tree }
    };
}
