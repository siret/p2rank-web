package cz.siret.prank.lib;

import com.univocity.parsers.tsv.TsvParser;
import com.univocity.parsers.tsv.TsvParserSettings;

import cz.siret.prank.lib.utils.BioUtils;
import cz.siret.prank.lib.utils.Tuple;
import cz.siret.prank.lib.utils.Tuple2;
import cz.siret.prank.lib.utils.Tuple3;
import cz.siret.prank.lib.utils.Utils;
import org.biojava.nbio.structure.Chain;
import org.biojava.nbio.structure.Group;
import org.biojava.nbio.structure.GroupType;
import org.biojava.nbio.structure.ResidueNumber;
import org.biojava.nbio.structure.Structure;
import org.biojava.nbio.structure.StructureException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.Serializable;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

public class ConservationScore implements Serializable {
    private Map<ResidueNumberWrapper, Double> scores;
    private final transient Logger logger = LoggerFactory.getLogger(getClass());

    private ConservationScore(Map<ResidueNumberWrapper, Double> scores) {
        this.scores = scores;
    }

    public static List<Tuple2<File, String>> pickScoresForPDBs(File[] files)
            throws IOException, StructureException {
        List<Tuple2<File, String>> scoreFiles = new ArrayList<>(files.length);
        for (File pdbFile : files) {
            Tuple2<String, String> baseAndExt = BioUtils.INSTANCE.removePdbExtension(pdbFile.getName());
            Path parentDir = Paths.get(pdbFile.getParent());
            pickScoresForFile(pdbFile).forEach(t-> {
                String chainId = t.getItem3();
                File scoreFile = parentDir.
                        resolve(baseAndExt.getItem1() + chainId.toUpperCase()
                                + baseAndExt.getItem2() + ".hom.gz")
                        .toFile();
                scoreFiles.add(Tuple.create(t.getItem1(), scoreFile.getName()));
            });
        }
        return scoreFiles;
    }

    public static Map<String, String> pickScores(Structure protein,
                                                 Map<String, File> conservationFiles)
            throws IOException {
        Map<String, String> result = new HashMap<>();
        for (Chain chain : protein.getChains()) {
            // Skip non-protein chains.
            if (chain.getAtomGroups(GroupType.AMINOACID).size() <= 0) continue;
            // Try end find score for this chain.
            String chainId = chain.getChainID().trim().isEmpty() ? "A" : chain.getChainID();
            File scoreFile = conservationFiles.get(chainId);
            if (scoreFile != null && scoreFile.exists()) {
                result.put(chainId, chainId);
                continue;
            }
            // Fallback case. Try all chains and pick the one with longest LCS.
            int max = -1;
            String newScoreChain = null;
            for (Map.Entry<String, File> possibleScoreFile : conservationFiles.entrySet()) {
                List<ConservationScore.AA> scores = loadScoreFile(possibleScoreFile.getValue(),
                        ConservationScore.ScoreFormat.JSDFormat);
                int[][] lcs = calcLongestCommonSubSequence(
                        chain.getAtomGroups(GroupType.AMINOACID), scores);
                int length = lcs[lcs.length - 1][lcs[lcs.length - 1].length - 1];
                if (max < length) {
                    max = length;
                    newScoreChain = possibleScoreFile.getKey();
                }
            }
            if (newScoreChain != null) {
                result.put(chainId, newScoreChain);
            }
        }
        return result;
    }

    public static List<Tuple3<File, String, String>> pickScoresForFile(File pdbFile) throws
            IOException {
        List<Tuple3<File, String, String>> result = new ArrayList<>();
        Structure s = BioUtils.INSTANCE.loadPdbFile(pdbFile);
        for (Chain chain : s.getChains()) {
            // Skip non-protein chains.
            if (chain.getAtomGroups(GroupType.AMINOACID).size() <= 0) continue;
            // Try end find score for this chain.
            Tuple2<String, String> baseAndExt = BioUtils.INSTANCE.removePdbExtension(pdbFile.getName());
            Path parentDir = Paths.get(pdbFile.getParent());
            String chainId = chain.getChainID().trim().isEmpty() ? "A" : chain.getChainID();
            File scoreFile = parentDir.
                    resolve(baseAndExt.getItem1() + chainId.toUpperCase()
                            + baseAndExt.getItem2() + ".hom.gz")
                    .toFile();
            if (scoreFile.exists()) {
                result.add(Tuple.create(scoreFile, baseAndExt.getItem1(), chainId));
                continue;
            }
            // Fallback case. Try all chains and pick the one with longest LCS.
            File[] possibleScoreFiles = parentDir.toFile().listFiles(
                    (File dir, String name) -> {
                        return name.startsWith(baseAndExt.getItem1()) && name.endsWith(".hom.gz");
                    });
            int max = -1;
            File newScoreFile = null;
            assert possibleScoreFiles != null;
            for (File possibleScoreFile : possibleScoreFiles) {
                List<AA> scores = loadScoreFile(possibleScoreFile, ScoreFormat.JSDFormat);
                int[][] lcs = calcLongestCommonSubSequence(
                        chain.getAtomGroups(GroupType.AMINOACID), scores);
                int length = lcs[lcs.length - 1][lcs[lcs.length - 1].length - 1];
                if (max < length) {
                    max = length;
                    newScoreFile = possibleScoreFile;
                }
            }
            if (newScoreFile != null) {
                result.add(Tuple.create(newScoreFile, baseAndExt.getItem1(), chainId));
            }
        }
        return result;
    }

    private static class AA {
        public String letter;
        public double score;
        public int index;

        public AA(String letter, double score, int index) {
            this.letter = letter;
            this.score = score;
            this.index = index;
        }
    }

    public double getScoreForResidue(ResidueNumber residueNum) {
        return getScoreForResidue(new ResidueNumberWrapper(residueNum));
    }

    public double getScoreForResidue(ResidueNumberWrapper residueNum) {
        Double res = scores.get(residueNum);
        if (res == null) {
            return 0;
        } else {
            return res.doubleValue();
        }
    }

    public Map<ResidueNumberWrapper, Double> getScoreMap() {
        return scores;
    }

    public int size() {
        return this.scores.size();
    }

    public enum ScoreFormat {
        ConCavityFormat,
        JSDFormat
    }

    private static List<AA> loadScoreFile(File scoreFile, ScoreFormat format) throws IOException {
        TsvParserSettings settings = new TsvParserSettings();
        settings.setLineSeparatorDetectionEnabled(true);
        TsvParser parser = new TsvParser(settings);
        List<String[]> lines = parser.parseAll(Utils.INSTANCE.readFile(scoreFile));
        List<AA> result = new ArrayList<>(lines.size());
        for (String[] line : lines) {
            int index = -1;
            double score = 0;
            String letter = "-";
            switch (format) {
                case ConCavityFormat:
                    index = Integer.parseInt(line[0]);
                    letter = line[1];
                    score = Double.parseDouble(line[2]);
                    break;
                case JSDFormat:
                    index = Integer.parseInt(line[0]);
                    score = Double.parseDouble(line[1]);
                    letter = line[2].substring(0, 1);
                    break;
            }
            score = score < 0 ? 0 : score;
            if (letter != "-") {
                result.add(new AA(letter, score, index));
            }
        }
        return result;
    }

    public static ConservationScore fromFiles(Structure structure,
                                              Function<String, File> scoresFiles)
            throws IOException {
        return fromFiles(structure, scoresFiles, ScoreFormat.JSDFormat);
    }

    /**
     * @param chain       Chain start PDB Structure
     * @param chainScores Parse conservation scores.
     * @param outResult   Add matched scores end map (residual number -> conservation score)
     */
    public static void matchSequences(List<Group> chain, List<AA> chainScores,
                                      Map<ResidueNumberWrapper, Double> outResult) {
        // Check if the strings match
        String pdbChain = chain.stream().map(ch -> ch.getChemComp().getOne_letter_code()
                .toUpperCase()).collect(Collectors.joining());
        String scoreChain = chainScores.stream().map(ch -> ch.letter.toUpperCase())
                .collect(Collectors.joining());
        if (pdbChain.equals(scoreChain)) {
            for (int i = 0; i < chainScores.size(); i++) {
                outResult.put(new ResidueNumberWrapper(chain.get(i).getResidueNumber()),
                        chainScores.get(i).score);
            }
            return;
        }

        System.out.println("Matching chains using LCS");
        int[][] lcs = calcLongestCommonSubSequence(chain, chainScores);

        // Backtrack the actual sequence.
        int i = chain.size(), j = chainScores.size();
        while (i > 0 && j > 0) {
            // Letters are equal.
            if (chain.get(i - 1).getChemComp().getOne_letter_code().toUpperCase().equals(
                    chainScores.get(j - 1).letter.toUpperCase())) {
                outResult.put(new ResidueNumberWrapper(chain.get(i - 1).getResidueNumber()),
                        chainScores.get(j - 1).score);
                i--;
                j--;
            } else {
                if (lcs[i][j - 1] > lcs[i - 1][j]) {
                    j--;
                } else {
                    i--;
                }
            }
        }
    }

    public static int[][] calcLongestCommonSubSequence(List<Group> chain, List<AA> chainScores) {
        // Implementation of Longest Common SubSequence
        // https://en.wikipedia.org/wiki/Longest_common_subsequence_problem
        int[][] lcs = new int[chain.size() + 1][chainScores.size() + 1];
        for (int i = 0; i <= chain.size(); i++) lcs[i][0] = 0;
        for (int j = 0; j <= chainScores.size(); j++) lcs[0][j] = 0;
        for (int i = 1; i <= chain.size(); i++) {
            for (int j = 1; j <= chainScores.size(); j++) {
                // Letters are equal.
                if (chain.get(i - 1).getChemComp().getOne_letter_code().toUpperCase().equals(
                        chainScores.get(j - 1).letter.toUpperCase())) {
                    lcs[i][j] = lcs[i - 1][j - 1] + 1;
                } else {
                    lcs[i][j] = Math.max(lcs[i - 1][j], lcs[i][j - 1]);
                }
            }
        }
        return lcs;
    }

    /**
     * Parses conservation scores created from HSSP database and Jensen-Shannon divergence.
     *
     * @param structure  Protein BioJava structure
     * @param scoreFiles Map from chain ids to files
     * @param format     Score format (JSD or ConCavity), default: JSD
     * @return new instance of ConservationScore (map from residual numbers to conservation scores)
     */
    public static ConservationScore fromFiles(Structure structure,
                                              Function<String, File> scoreFiles,
                                              ScoreFormat format) throws IOException {
        Map<ResidueNumberWrapper, Double> scores = new HashMap<>();
        for (Chain chain : structure.getChains()) {
            if (chain.getAtomGroups(GroupType.AMINOACID).size() <= 0) {
                continue;
            }
            String chainId = chain.getChainID();
            chainId = chainId.trim().isEmpty() ? "A" : chainId;
            List<AA> chainScores = null;
            File scoreFile = scoreFiles.apply(chainId);
            try {
                if (scoreFile != null && scoreFile.exists()) {
                    chainScores = ConservationScore.loadScoreFile(scoreFile, format);
                }
                if (chainScores != null) {
                    matchSequences(chain.getAtomGroups(GroupType.AMINOACID), chainScores, scores);
                }
            } catch (NumberFormatException e) {
                return null;
            }
        }
        if (scores.isEmpty()) {
            return null;
        }
        return new ConservationScore(scores);
    }

    public static  ConservationScore forFile(File pdbFile, ScoreFormat format) throws IOException {
        List<Tuple3<File, String, String>> scoreFiles = ConservationScore.pickScoresForFile(pdbFile);
        if (scoreFiles == null || scoreFiles.isEmpty()) {
            return null;
        }
        Function<String, File> mappingFunction = (String chainId) -> {
            for (final Tuple3<File, String, String> scoreFile : scoreFiles) {
                if (scoreFile.getItem3().equals(chainId)) {
                    return scoreFile.getItem1();
                }
            }
            return null;
        };
        return fromFiles(BioUtils.INSTANCE.loadPdbFile(pdbFile), mappingFunction, format);
    }
}
