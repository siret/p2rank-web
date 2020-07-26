import LiteMol from "litemol";
import {SequenceController, SequenceView} from "./sequence-view";

// LiteMol settings.
const PrankWebSpec: LiteMol.Plugin.Specification = {
  "settings": {},
  "transforms": [
    // Molecule(model) transforms
    {
      "transformer": LiteMol.Bootstrap.Entity.Transformer.Molecule.CreateModel,
      "view": LiteMol.Plugin.Views.Transform.Molecule.CreateModel,
      "initiallyCollapsed": true
    }, {
      "transformer": LiteMol.Bootstrap.Entity.Transformer.Molecule.CreateSelection,
      "view": LiteMol.Plugin.Views.Transform.Molecule.CreateSelection,
      "initiallyCollapsed": true
    }, {
      "transformer": LiteMol.Bootstrap.Entity.Transformer.Molecule.CreateAssembly,
      "view": LiteMol.Plugin.Views.Transform.Molecule.CreateAssembly,
      "initiallyCollapsed": true
    }, {
      "transformer": LiteMol.Bootstrap.Entity.Transformer.Molecule.CreateSymmetryMates,
      "view": LiteMol.Plugin.Views.Transform.Molecule.CreateSymmetryMates,
      "initiallyCollapsed": true
    }, {
      "transformer": LiteMol.Bootstrap.Entity.Transformer.Molecule.CreateMacromoleculeVisual,
      "view": LiteMol.Plugin.Views.Transform.Empty
    }, {
      "transformer": LiteMol.Bootstrap.Entity.Transformer.Molecule.CreateVisual,
      "view": LiteMol.Plugin.Views.Transform.Molecule.CreateVisual
    }, {
      "transformer": LiteMol.Bootstrap.Entity.Transformer.Molecule.CreateLabels,
      "view": LiteMol.Plugin.Views.Transform.Molecule.CreateLabels
      // TODO Why was this here?
    // }, {
    //   "transformer": LiteMol.Extensions.ParticleColoring.Apply,
    //   "view": LiteMol.Extensions.ParticleColoring.UI.Apply,
    //   "initiallyCollapsed": true
    },
  ],
  "behaviours": [
    // You will find the source of all behaviours in the Bootstrap/Behaviour directory
    LiteMol.Bootstrap.Behaviour.SetEntityToCurrentWhenAdded,
    LiteMol.Bootstrap.Behaviour.FocusCameraOnSelect,
    LiteMol.Bootstrap.Behaviour.UnselectElementOnRepeatedClick,
    // Colors the visual when it's selected by mouse or touch
    LiteMol.Bootstrap.Behaviour.ApplyInteractivitySelection,
    // This shows what atom/residue is the pointer currently over
    LiteMol.Bootstrap.Behaviour.Molecule.HighlightElementInfo,
    // When the same element is clicked twice in a row, the selection is emptied
    LiteMol.Bootstrap.Behaviour.UnselectElementOnRepeatedClick,
    // Distance to the last "clicked" element
    LiteMol.Bootstrap.Behaviour.Molecule.DistanceToLastClickedElement,
    LiteMol.Bootstrap.Behaviour.Molecule.HighlightElementInfo,
    LiteMol.Bootstrap.Behaviour.Molecule.DistanceToLastClickedElement,
    // When something is selected, this will create an "overlay visual" of
    // the selected residue and show every other residue within 5ang
    // you will not want to use this for the ligand pages, where you create
    // the same thing this does at startup
    LiteMol.Bootstrap.Behaviour.Molecule.ShowInteractionOnSelect(5),
  ],
  "components": [
    LiteMol.Plugin.Components.Visualization.HighlightInfo(LiteMol.Bootstrap.Components.LayoutRegion.Main, true),
    LiteMol.Plugin.Components.Entity.Current("LiteMol", LiteMol.Plugin.VERSION.number)(LiteMol.Bootstrap.Components.LayoutRegion.Right, true),
    LiteMol.Plugin.Components.Transform.View(LiteMol.Bootstrap.Components.LayoutRegion.Right),
    LiteMol.Plugin.Components.create("PrankWeb.SequenceView", s => new SequenceController(s), SequenceView)(LiteMol.Bootstrap.Components.LayoutRegion.Top, true),
    LiteMol.Plugin.Components.Context.Overlay(LiteMol.Bootstrap.Components.LayoutRegion.Root),
    LiteMol.Plugin.Components.Context.Toast(LiteMol.Bootstrap.Components.LayoutRegion.Main, true),
    LiteMol.Plugin.Components.Context.BackgroundTasks(LiteMol.Bootstrap.Components.LayoutRegion.Main, true)
  ],
  "viewport": {
    "view": LiteMol.Plugin.Views.Visualization.Viewport,
    "controlsView": LiteMol.Plugin.Views.Visualization.ViewportControls
  },
  "layoutView": LiteMol.Plugin.Views.Layout,
  "tree": {
    "region": LiteMol.Bootstrap.Components.LayoutRegion.Left,
    "view": LiteMol.Plugin.Views.Entity.Tree
  }
};

export default PrankWebSpec;