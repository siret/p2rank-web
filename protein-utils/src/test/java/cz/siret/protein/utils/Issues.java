package cz.siret.protein.utils;

import cz.siret.protein.utils.command.PrepareDataForP2RankWeb;
import org.junit.jupiter.api.Test;

import java.nio.file.Files;

/**
 * This class holds use-case base tests. They may cover different areas
 * of the project.
 */
public class Issues {

    /**
     * This test was introduced as execution with the given input data
     * takes too long (more then 45 minutes).
     */
    @Test
    public void issue20() throws Exception {
        PrepareDataForP2RankWeb.Configuration conf =
                new PrepareDataForP2RankWeb.Configuration();
        conf.structureFile = TestUtils.fileFromResource(
                "issues/20/structure.pdb");
        conf.predictionsCsvFile = TestUtils.fileFromResource(
                "issues/20/predictions.csv");
        conf.residuesCsvFile = TestUtils.fileFromResource(
                "issues/20/residues.csv");
        conf.outputPocketFile=
                Files.createTempFile("19hc-p2rank-web", "").toFile();
        conf.outputSequenceFile =
                Files.createTempFile("19hc-p2rank-web", "").toFile();

        (new PrepareDataForP2RankWeb()).execute(conf);

    }

}
