import LiteMol from "litemol";

export interface Sequence {
  indices: string[]
  seq: string[]
  scores: number[]
  regions: Array<{ regionName: string, start: number, end: number }>
  bindingSites: number[]
}

export interface SequenceListEntity extends LiteMol.Bootstrap.Entity<{ seq: Sequence }> {
}

// TODO Used in sequence view.
export const SequenceEntity = LiteMol.Bootstrap.Entity.create<{ seq: Sequence }>({
  "name": "Protein sequence",
  "typeClass": "Data",
  "shortName": "PS",
  "description": "Represents sequence of the protein."
});

// Action for loading sequence from JSON.
export const CreateSequence =
  LiteMol.Bootstrap.Tree.Transformer.create<LiteMol.Bootstrap.Entity.Data.Json, SequenceListEntity, {}>({
      "id": "protein-sequence-create",
      "name": "Protein sequence",
      "description": "Create protein sequence from string.",
      "from": [LiteMol.Bootstrap.Entity.Data.Json],
      "to": [SequenceEntity],
      defaultParams: () => ({})
    }, (context, a, t) => {
      return LiteMol.Bootstrap.Task.create<SequenceListEntity>(
        "Create sequence entity", "Normal", async ctx => {
          await ctx.updateProgress("Creating sequence entity...");
          let seq = a.props.data as Sequence;
          // Get rid of the negative scores.
          if (seq.scores) {
            seq.scores.forEach((score, i) => {
              seq.scores[i] = score < 0 ? 0 : score;
            })
          }
          // @ts-ignore
          return SequenceEntity.create(t, {"label": "Sequence", seq})
        }).setReportTime(true);
    }
  );
