package cz.siret.protein.utils.command;

import cz.siret.protein.utils.TestUtils;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.Arrays;
import java.util.List;

public class StructureToFastaTest {

    @Test
    public void pdb2src() throws Exception {
        loadSequenceAndAssert(
                TestUtils.fileFromResource(
                        "./structure-to-fasta/2src.pdb"),
                Arrays.asList("A"),
                Arrays.asList(
                        TestUtils.fileFromResource(
                                "./structure-to-fasta/2src.fasta")
                )
        );
    }

    private void loadSequenceAndAssert(
            File structureFile, List<String> chains, List<File> expectedFiles)
            throws Exception {
        StructureToFasta.Configuration configuration =
                new StructureToFasta.Configuration();
        configuration.chains = chains;
        configuration.structureFile = structureFile;
        File working = Files.createTempDirectory("protein-utils-test").toFile();
        configuration.outputFileTemplate =
                working.toString() + "/file-{chain}.fasta";
        StructureToFasta structureToFasta = new StructureToFasta();
        try {
            structureToFasta.execute(configuration);
            for (int index = 0; index < chains.size(); ++index) {
                String fileName = "file-" + chains.get(index) + ".fasta";
                TestUtils.assertTextEqual(
                        expectedFiles.get(index),
                        new File(working, fileName));
            }
        } finally {
            TestUtils.deleteDirectory(working);
        }
    }

    @Test
    public void mmCif2src() throws Exception {
        loadSequenceAndAssert(
                TestUtils.fileFromResource(
                        "./structure-to-fasta/2src.cif"),
                Arrays.asList("A"),
                Arrays.asList(
                        TestUtils.fileFromResource(
                                "./structure-to-fasta/2src.fasta")
                )
        );
    }

}
