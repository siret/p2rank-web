import LiteMol from "litemol";

export interface PrankPocket {
  name: string;
  rank: number;
  score: number;
  probability: number;
  conollyPoints: number;
  surfAtoms: number;
  centerX: number;
  centerY: number;
  centerZ: number;
  residueIds: Array<string>
  surfAtomIds: Array<number>
}

export const Colors = LiteMol.Bootstrap.Immutable.List.of(
  LiteMol.Visualization.Color.fromRgb(0, 0, 255),      //Blue
  LiteMol.Visualization.Color.fromRgb(255, 0, 0),      //Red
  LiteMol.Visualization.Color.fromRgb(0, 255, 0),      //Green
  LiteMol.Visualization.Color.fromRgb(255, 0, 255),    //Magenta
  LiteMol.Visualization.Color.fromRgb(255, 128, 128),  //Pink
  LiteMol.Visualization.Color.fromRgb(128, 0, 0),      //Brown
  LiteMol.Visualization.Color.fromRgb(255, 128, 0));   //Orange

export interface PocketListEntity extends LiteMol.Bootstrap.Entity<{ pockets: PrankPocket[] }> {
}

// TODO Used in sequence view.
export const PredictionEntity = LiteMol.Bootstrap.Entity.create<{ pockets: PrankPocket[] }>({
  "name": "Pocket prediction",
  "typeClass": "Data",
  "shortName": "PP",
  "description": "Represents predicted protein-ligand binding pockets."
});

// Action for loading the data from JSON.
export const ParseAndCreatePrediction =
  LiteMol.Bootstrap.Tree.Transformer.create<LiteMol.Bootstrap.Entity.Data.Json, PocketListEntity, {}>
  ({
      "id": "protein-pocket-prediction-parse",
      "name": "Protein predicted pockets",
      "description": "Parse protein pocket prediction.",
      "from": [LiteMol.Bootstrap.Entity.Data.Json],
      "to": [PredictionEntity],
      defaultParams: () => ({})
    }, (context, a, t) => {
      return LiteMol.Bootstrap.Task.create<PocketListEntity>(
        "Create protein prediction entity.", "Normal", async ctx => {
          await ctx.updateProgress("Creating prediction data...");
          // @ts-ignore
          return PredictionEntity.create(t, {
            "label": "Sequence",
            "pockets": (a.props.data as PrankPocket[])
          })
        }).setReportTime(true);
    }
  );
