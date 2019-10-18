namespace LiteMol.PrankWeb {

    import Bootstrap = LiteMol.Bootstrap;
    import Entity = Bootstrap.Entity;
    import Transformer = Bootstrap.Entity.Transformer;

    export interface PrankPocket {
        name: string;
        rank: number;
        score: number;
        conollyPoints: number;
        surfAtoms: number;
        centerX: number;
        centerY: number;
        centerZ: number;
        residueIds: Array<string>
        surfAtomIds: Array<number>
    }

    export const Colors = Bootstrap.Immutable.List.of(
        Visualization.Color.fromRgb(0, 0, 255),      //Blue
        Visualization.Color.fromRgb(255, 0, 0),      //Red
        Visualization.Color.fromRgb(0, 255, 0),      //Green
        Visualization.Color.fromRgb(255, 0, 255),    //Magenta
        Visualization.Color.fromRgb(255, 128, 128),  //Pink
        Visualization.Color.fromRgb(128, 0, 0),      //Brown
        Visualization.Color.fromRgb(255, 128, 0))    //Orange

    export interface Prediction extends Entity<{ pockets: PrankPocket[] }> { }

    export const Prediction = Entity.create<{ pockets: PrankPocket[] }>({
        name: 'Pocket prediction',
        typeClass: 'Data',
        shortName: 'PP',
        description: 'Represents predicted protein-ligand binding pockets.'
    });

    export const ParseAndCreatePrediction = Bootstrap.Tree.Transformer.create<Bootstrap.Entity.Data.Json, Prediction, {}>({
        id: 'protein-pocket-prediction-parse',
        name: 'Protein predicted pockets',
        description: 'Parse protein pocket prediction.',
        from: [Entity.Data.Json],
        to: [Prediction],
        defaultParams: () => ({})
    }, (context, a, t) => {
        return Bootstrap.Task.create<Prediction>(`Create protein prediction entity.`, 'Normal', async ctx => {
            await ctx.updateProgress('Creating prediction data...');
            return Prediction.create(t, { label: 'Sequence', pockets: (a.props.data as PrankPocket[]) })
        }).setReportTime(true);
    }
    );

}