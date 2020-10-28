package cz.siret.protein.utils;

import cz.siret.protein.utils.action.ChainToSequence;
import cz.siret.protein.utils.command.PrepareDataForP2RankWeb;
import cz.siret.protein.utils.command.StructureToFasta;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.nio.file.Files;
import java.util.Collections;

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
    public void issue20For1gac() throws Exception {
        PrepareDataForP2RankWeb.Configuration conf =
                new PrepareDataForP2RankWeb.Configuration();
        conf.structureFile = TestUtils.fileFromResource(
                "issues/20/1gac.structure.pdb");
        conf.predictionsCsvFile = TestUtils.fileFromResource(
                "issues/20/1gac.predictions.csv");
        conf.residuesCsvFile = TestUtils.fileFromResource(
                "issues/20/1gac.residues.csv");
        conf.outputPocketFile=
                Files.createTempFile("19hc-p2rank-web", "").toFile();
        conf.outputSequenceFile =
                Files.createTempFile("19hc-p2rank-web", "").toFile();
        (new PrepareDataForP2RankWeb()).execute(conf);
    }

    /**
     * Another performance test with a lots of small molecules and
     * multiple models.
     */
    @Test
    public void issue20For19hc() throws Exception {
        PrepareDataForP2RankWeb.Configuration conf =
                new PrepareDataForP2RankWeb.Configuration();
        conf.structureFile = TestUtils.fileFromResource(
                "issues/20/19hc.structure.pdb");
        conf.predictionsCsvFile = TestUtils.fileFromResource(
                "issues/20/19hc.predictions.csv");
        conf.residuesCsvFile = TestUtils.fileFromResource(
                "issues/20/19hc.residues.csv");
        conf.outputPocketFile=
                Files.createTempFile("19hc-p2rank-web", "").toFile();
        conf.outputSequenceFile =
                Files.createTempFile("19hc-p2rank-web", "").toFile();
        (new PrepareDataForP2RankWeb()).execute(conf);
    }

    /**
     * Extract sequence, we are not interested in the result for now.
     * Just demonstrate situation where chain name and chain ID is different.
     */
    @Test
    public void issue27() throws Exception {
        StructureToFasta.Configuration configuration =
                new StructureToFasta.Configuration();
        configuration.chains = Collections.singletonList("T");
        configuration.structureFile =  TestUtils.fileFromResource(
                "issues/27/7bv2.pdb");
        File working = Files.createTempDirectory("protein-utils-test").toFile();
        configuration.outputFileTemplate =
                working.toString() + "/file-{chain}.fasta";
        //
        StructureToFasta structureToFasta = new StructureToFasta();
        structureToFasta.execute(configuration);
    }

}
