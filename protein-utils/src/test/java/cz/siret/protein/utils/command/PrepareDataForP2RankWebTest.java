package cz.siret.protein.utils.command;

import cz.siret.protein.utils.TestUtils;
import cz.siret.protein.utils.command.PrepareDataForP2RankWeb;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.nio.file.Files;

public class PrepareDataForP2RankWebTest {

    @Test
    public void testWith2src() throws Exception {
        PrepareDataForP2RankWeb.Configuration conf =
                new PrepareDataForP2RankWeb.Configuration();
        conf.structureFile = TestUtils.fileFromResource(
                "p2rank-web/pdbDataRaw/pdbid_2src_A.pdb");
        conf.chainToConservationFile.put("A", TestUtils.fileFromResource(
                "p2rank-web/pdbAnalyzed/pdbid_2srcA.hom"));
        conf.predictionsCsvFile = TestUtils.fileFromResource(
                "p2rank-web/pdbAnalyzed/pdbid_2src_A.ent.gz_predictions.csv");
        conf.residuesCsvFile = TestUtils.fileFromResource(
                "p2rank-web/pdbAnalyzed/pdbid_2src_A.ent.gz_residues.csv");
        conf.outputPocketFile=
                Files.createTempFile("protein-utils-test", "").toFile();
        conf.outputSequenceFile =
                Files.createTempFile("protein-utils-test", "").toFile();

        (new PrepareDataForP2RankWeb()).execute(conf);

        File expectedPocketsFile = TestUtils.fileFromResource(
                "p2rank-web/csv_2src_A.json");
        File expectedSequenceFile = TestUtils.fileFromResource(
                "p2rank-web/sequence_2src_A.json");

        try {
            TestUtils.assertJsonEqual(
                    expectedPocketsFile, conf.outputPocketFile);
            TestUtils.assertJsonEqual(
                    expectedSequenceFile, conf.outputSequenceFile);
        } finally {
            conf.outputPocketFile.delete();
            conf.outputSequenceFile.delete();
        }
    }

}
