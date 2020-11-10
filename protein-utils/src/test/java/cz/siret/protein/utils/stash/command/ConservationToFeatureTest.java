package cz.siret.protein.utils.stash.command;

import cz.siret.protein.utils.TestUtils;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.nio.file.Files;

public class ConservationToFeatureTest {

    @Test
    public void testWith101mPdb() throws Exception {
        ConservationToFeature.Configuration conf =
                new ConservationToFeature.Configuration();
        conf.structureFile = TestUtils.fileFromResource(
                "conservation-to-feature/101m.pdb");
        conf.chainToConservationFile.put("A", TestUtils.fileFromResource(
                "conservation-to-feature/101m"));
        conf.outputFile = Files.createTempFile(
                "protein-utils-test", "").toFile();
        (new ConservationToFeature()).execute(conf);
        File expectedFile = TestUtils.fileFromResource(
                "conservation-to-feature/101m.csv");
        try {
            TestUtils.assertCsvEqual(expectedFile, conf.outputFile);
        } finally {
            conf.outputFile.delete();
        }
    }

    @Test
    public void testWith101mCif() throws Exception {
        ConservationToFeature.Configuration conf =
                new ConservationToFeature.Configuration();
        conf.structureFile =TestUtils.fileFromResource(
                "conservation-to-feature/101m.cif");
        conf.chainToConservationFile.put("A", TestUtils.fileFromResource(
                "conservation-to-feature/101m"));
        conf.outputFile = Files.createTempFile(
                "protein-utils-test", "").toFile();
        (new ConservationToFeature()).execute(conf);
        File expectedFile = TestUtils.fileFromResource(
                "conservation-to-feature/101m.csv");
        try {
            TestUtils.assertCsvEqual(expectedFile, conf.outputFile);
        } finally {
            conf.outputFile.delete();
        }
    }

}
