package cz.siret.protein.utils.feature.conservation;

import com.univocity.parsers.tsv.TsvParser;
import com.univocity.parsers.tsv.TsvParserSettings;
import cz.siret.protein.utils.model.ResidueFeature;
import org.biojava.nbio.structure.Chain;
import org.biojava.nbio.structure.Group;
import org.biojava.nbio.structure.GroupType;
import org.biojava.nbio.structure.ResidueNumber;
import org.biojava.nbio.structure.Structure;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.zip.GZIPInputStream;

public class ConservationLoader {

    private static final Logger LOG =
            LoggerFactory.getLogger(ConservationLoader.class);

    private static class Score {

        public final int index;

        public final String letter;

        public final double score;

        public Score(int index, String letter, double score) {
            this.index = index;
            this.letter = letter.toUpperCase();
            // Value can be -1000, but we go with zero.
            this.score = Math.max(score, 0);
        }

    }

    public ResidueFeature<Double> loadConservationJsdFormat(
            Structure structure, Function<String, File> homologyFiles)
            throws IOException {
        //
        ResidueFeature<Double> result = new ResidueFeature<>();
        for (Chain chain : structure.getChains()) {
            String chainId = getChainId(chain);
            if (chain.getAtomGroups(GroupType.AMINOACID).size() <= 0) {
                LOG.debug("Ignoring chain {} with no amino acids", chainId);
                continue;
            }
            File homologyFile = homologyFiles.apply(chainId);
            if (homologyFile == null) {
                LOG.debug("No conservation found for {}", chainId);
                continue;
            }
            LOG.debug("Loading conservation for {} from {}",
                    chainId, homologyFile);
            List<Score> chainScores = loadJsdFile(homologyFile);
            // We need to map the scores into the structure.
            List<Group> groups = chain.getAtomGroups(GroupType.AMINOACID);
            result.add(scoresToFeature(groups, chainScores));
        }
        return result;
    }

    /**
     * Return chain or "A" if no chain is provided.
     */
    private String getChainId(Chain chain) {
        // getId - asymId (internal chain IDs in mmCif)
        // getName - authId (chain ID in PDB file)
        String id = chain.getName();
        return id.trim().isEmpty() ? "A" : id;
    }

    private List<Score> loadJsdFile(File homologyFile) throws IOException{
        TsvParserSettings settings = new TsvParserSettings();
        settings.setLineSeparatorDetectionEnabled(true);
        TsvParser parser = new TsvParser(settings);
        List<Score> result = new ArrayList<>();
        try (InputStream stream = openStream(homologyFile);
             InputStreamReader streamReader = new InputStreamReader(stream);
             BufferedReader reader = new BufferedReader(streamReader)) {
            String line = reader.readLine();
            while (line != null) {
                String[] row = parser.parseLine(line);
                if (row == null) {
                    line = reader.readLine();
                    continue;
                }
                int index = Integer.parseInt(row[0]);
                double score = Double.parseDouble(row[1]);
                String letter = row[2].substring(0, 1);
                result.add(new Score(index, letter, score));
                //
                line = reader.readLine();
            }
        }
        return result;
    }

    private static InputStream openStream(File file) throws IOException {
        if (file.getName().endsWith(".gz")) {
            return new GZIPInputStream(new FileInputStream(file));
        } else {
            return new FileInputStream(file);
        }
    }

    private ResidueFeature<Double> scoresToFeature(
            List<Group> groups, List<Score> scores) {
        String groupChain = groups.stream()
                .map(ConservationLoader::getGroupLetter)
                .collect(Collectors.joining());
        String scoreChain = scores.stream()
                .map(score -> score.letter.toUpperCase())
                .collect(Collectors.joining());
        if (groupChain.equals(scoreChain)) {
            // We have full match.
            ResidueFeature<Double> result = new ResidueFeature<>();
            for (int index = 0; index < scores.size(); ++index) {
                result.add(
                        new ResidueNumber(groups.get(index).getResidueNumber()),
                        scores.get(index).score);
            }
            return result;
        }
        // We need to match chain as they are not equal.
        int[][] lcs = longestCommonSubSequence(groups, scores);
        // Backtrack the actual sequence.
        ResidueFeature<Double> result = new ResidueFeature<>();
        int i = groups.size();
        int j = scores.size();
        while (i > 0 && j > 0) {
            String chainLetter = getGroupLetter(groups.get(i - 1));
            String scoreLetter = scores.get(j - 1).letter;
            if (chainLetter.equals(scoreLetter)) {
                result.add(
                        new ResidueNumber(groups.get(i - 1).getResidueNumber()),
                        scores.get(j - 1).score);
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
        return result;
    }

    private static String getGroupLetter(Group group) {
        return group.getChemComp().getOne_letter_code().toUpperCase();
    }

    private static int[][] longestCommonSubSequence(
            List<Group> groups, List<Score> scores) {
        // Implementation of Longest Common SubSequence
        // https://en.wikipedia.org/wiki/Longest_common_subsequence_problem
        int[][] lcs = new int[groups.size() + 1][scores.size() + 1];
        for (int i = 0; i <= groups.size(); i++) {
            lcs[i][0] = 0;
        }
        for (int j = 0; j <= scores.size(); j++){
            lcs[0][j] = 0;
        }
        for (int i = 1; i <= groups.size(); i++) {
            for (int j = 1; j <= scores.size(); j++) {
                // Letters are equal.
                String chainLetter = getGroupLetter(groups.get(i - 1));
                String scoreLetter = scores.get(j - 1).letter;
                if (chainLetter.equals(scoreLetter)) {
                    lcs[i][j] = lcs[i - 1][j - 1] + 1;
                } else {
                    lcs[i][j] = Math.max(lcs[i - 1][j], lcs[i][j - 1]);
                }
            }
        }
        return lcs;
    }

}
