package cz.siret.prank.lib;

import cz.siret.prank.lib.utils.Tuple;
import cz.siret.prank.lib.utils.Tuple2;
import cz.siret.prank.lib.utils.Utils;
import org.apache.commons.compress.compressors.bzip2.BZip2CompressorInputStream;
import org.biojava.nbio.structure.Structure;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;

public class ExternalTools {
    private final transient Logger logger = LoggerFactory.getLogger(getClass());

    private String hsspToFastaScript;
    private String msaToConservationScript;
    private Path hsspDir;

    public ExternalTools(String hsspToFastaScript, String msaToConservationScript, String hsspDir) {
        this.hsspToFastaScript = hsspToFastaScript;
        this.msaToConservationScript = msaToConservationScript;
        this.hsspDir = hsspDir != null ? Paths.get(hsspDir) : null;
    }

    public Map<String, File> getMSAsfromHSSP(String pdbId) throws IOException,
            InterruptedException {
        pdbId = pdbId.toLowerCase();
        // Check if the script even exists
        logger.info("Getting MSA from HSSP for PDB: {}", pdbId);
        Map<String, File> result = new HashMap<>();
        if (hsspToFastaScript != null && hsspDir != null) {
            File scriptFile = new File(hsspToFastaScript);
            if (scriptFile.exists() && hsspDir.toFile().exists()) {
                // Decompress HSSP files first
                File hsspFile = hsspDir.resolve(pdbId.concat(".hssp.bz2")).toFile();
                logger.info("Looking for {}", hsspFile.getAbsolutePath());
                if (!hsspFile.exists()) return result;
                Path tempHsspDir = Files.createTempDirectory(pdbId.concat("_hssp"));
                Path tempFastaDir = Files.createTempDirectory(pdbId.concat("_fasta"));
                try (InputStream in = new BZip2CompressorInputStream(
                        new FileInputStream(hsspFile))) {
                    Files.copy(in, tempHsspDir.resolve(pdbId.concat(".hssp")),
                            StandardCopyOption.REPLACE_EXISTING);
                }

                logger.info("Converting hssp->fasta :{}", hsspFile.getName());
                ProcessBuilder processBuilder = new ProcessBuilder(scriptFile.getAbsolutePath(),
                        pdbId, tempHsspDir.toAbsolutePath().toString(),
                        tempFastaDir.toAbsolutePath().toString());
                processBuilder.directory(scriptFile.getParentFile());
                Process process = processBuilder.start();
                int exitCode = process.waitFor();
                logger.info("Hssp2Fasta script finished with exit code: {}", exitCode);

                File[] files = tempFastaDir.toFile().listFiles();
                for (File f : files) {
                    String name = f.getName();
                    String chainId = name.substring(pdbId.length(),
                            name.length() - ".hssp.fasta".length());
                    File tempFile = File.createTempFile("msa", ".fasta");
                    Files.move(f.toPath(), tempFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
                    logger.info("Chain: {}, file: {}", chainId, tempFile.getAbsolutePath());
                    result.put(chainId, tempFile);
                }
                Utils.INSTANCE.deleteDirRecursively(tempHsspDir);
                Utils.INSTANCE.deleteDirRecursively(tempFastaDir);
            }
        }
        return result;
    }


    public Map<String, File> getConservationFromMSAs(Map<String, File> msas) throws IOException,
            InterruptedException {
        // Check if the script even exists
        Map<String, File> result = new HashMap<>();
        if (msaToConservationScript != null) {
            File scriptFile = new File(msaToConservationScript);
            if (scriptFile.exists()) {
                for (Map.Entry<String, File> msa : msas.entrySet()) {
                    logger.info("Calculating conservation for chain: {}", msa.getKey());
                    ProcessBuilder processBuilder = new ProcessBuilder(scriptFile.getAbsolutePath(),
                            msa.getValue().getAbsolutePath());
                    processBuilder.directory(scriptFile.getParentFile());
                    String newName = msa.getValue().getName().replaceFirst(".fasta$", ".hom");
                    Path resultFile = Paths.get(msa.getValue().getParent(), newName);
                    processBuilder.redirectOutput(resultFile.toFile());
                    Process process = processBuilder.start();
                    int exitCode = process.waitFor();
                    logger.info("JSD script finished with exit code: {}", exitCode);
                    result.put(msa.getKey(), resultFile.toFile());
                }
            }
        }
        return result;
    }

    public Map<String, Tuple2<File, File>> getConsevationAndMSAsFromHSSP(String pdbId,
                                                                         Structure protein)
            throws IOException, InterruptedException {
        Map<String, Tuple2<File, File>> result = new HashMap<>();
        Map<String, File> msas = getMSAsfromHSSP(pdbId);
        Map<String, File> scores = getConservationFromMSAs(msas);
        Map<String, String> chainMatching = ConservationScore.pickScores(protein, scores);
        for (Map.Entry<String, String> chainMatch : chainMatching.entrySet()) {
            logger.info("Chains matched. {}->{}", chainMatch.getKey(), chainMatch.getValue());
            result.put(chainMatch.getKey(), Tuple.create(
                    msas.get(chainMatch.getValue()), scores.get(chainMatch.getValue())));
        }
        logger.info(result.toString());
        return result;
    }

}
