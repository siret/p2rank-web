package cz.siret.prank.lib;

import cz.siret.prank.lib.utils.BioUtils;
import cz.siret.prank.lib.utils.Tuple2;
import cz.siret.prank.lib.utils.Utils;
import org.biojava.nbio.structure.Structure;
import org.biojava.nbio.structure.StructureException;
import org.biojava.nbio.structure.io.PDBFileReader;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.FilenameFilter;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

public class Main {

    public static void main(String[] args) {
        try {
            if (args.length == 0) {
                Path dir = Paths.get("e:/School/MFF/Projects/Prank2Web/Experiments" +
                        "/joined/");
                //analyzeConservation(dir, "hssp", ConservationScore.ScoreFormat.JSDFormat);
                return;
            }
            switch (args[0].toLowerCase()) {
                case "pdbtofasta":
                    try {
                        File argFile = new File(args[1]);
                        if (!argFile.exists()) {
                            System.err.println("File specified does not exists.");
                            return;
                        }
                        if (argFile.isDirectory()) {
                            BioUtils.INSTANCE.dirToFastaFiles(argFile).forEach(System.out::println);
                        } else {
                            BioUtils.INSTANCE.fileToFastaFiles(argFile).forEach(System.out::println);
                        }
                    } catch (StructureException e) {
                        e.printStackTrace();
                    }
                    break;
                case "pickscoresfromhssp":
                    // Parameters are pdbfile, pdbId, hsspToFasta, msaToConservation, hsspDir
                    try {
                        ExternalTools externalTools = new ExternalTools(args[3], args[4], args[5]);
                        Path pdbFile = Paths.get(args[1]);
                        Structure protein = BioUtils.INSTANCE.loadPdbFile(pdbFile.toFile());
                        Map<String, Tuple2<File, File>> scores = externalTools
                                .getConsevationAndMSAsFromHSSP(args[2], protein);
                        String baseName = BioUtils.INSTANCE.removePdbExtension(args[1]).getItem1();
                        Path pdbFileParent = pdbFile.getParent();
                        if (scores.size() <= 0) {
                            System.exit(1);
                        }
                        for (Map.Entry<String, Tuple2<File, File>> entry : scores.entrySet()) {
                            Path dest = pdbFileParent.resolve(baseName.concat(entry.getKey())
                                    .concat(".fasta"));
                            Files.copy(Paths.get(
                                    entry.getValue().getItem1().getAbsolutePath()), dest,
                                    StandardCopyOption.REPLACE_EXISTING);
                            Utils.INSTANCE.gzipAndDeleteFile(dest.toFile());
                            dest = pdbFileParent.resolve(baseName.concat(entry.getKey())
                                    .concat(".hom"));
                            Files.copy(Paths.get(
                                    entry.getValue().getItem2().getAbsolutePath()), dest,
                                    StandardCopyOption.REPLACE_EXISTING);
                            Utils.INSTANCE.gzipAndDeleteFile(dest.toFile());
                        }
                        // Delete the temp files with MSAs and conservation files.
                         scores.values().stream().forEach(files -> {
                             files.getItem1().delete();
                             files.getItem2().delete();
                         });
                    } catch (IOException | InterruptedException e) {
                        e.printStackTrace();
                        System.exit(1);
                    }
                    break;
                case "pickscores":
                    try {
                        File directory = (new File(args[1]));
                        if (directory.exists() && directory.isDirectory()) {
                            FilenameFilter filter = (File dir, String name) -> {
                                if (name.endsWith(".pdb")) {
                                    return true;
                                }
                                return false;
                            };
                            for (Tuple2<File, String> f : ConservationScore.pickScoresForPDBs(
                                    directory.listFiles(filter))) {
                                if (f == null || f.getItem1() == null || f.getItem2() == null) {
                                    int debug = 5;
                                }
                                System.out.printf("%s %s\n", f.getItem1().getName(), f.getItem2());
                            }
                        }
                    } catch (StructureException e) {
                        e.printStackTrace();
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                case "getproteinsize":
                    System.out.println(BioUtils.INSTANCE.getProteinSize(
                            BioUtils.INSTANCE.loadPdbFile(new File(args[1]))));
                    break;
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private static ConservationScore loadConservationScore(File pdbFile,
                                                           Function<String, File> scoreFnc,
                                                           ConservationScore.ScoreFormat format)
            throws IOException {
        try (InputStream pdbIn = Utils.INSTANCE.readFile(pdbFile)) {
            PDBFileReader reader = new PDBFileReader();
            Structure s = reader.getStructure(pdbIn);
            return ConservationScore.fromFiles(s, scoreFnc, format);
        }
    }

    private static Map<String, List<Integer>> loadDatasetStatistics(File datasetStats) throws
            IOException {
        Map<String, List<Integer>> result = new HashMap<>();
        try (BufferedReader br = new BufferedReader(new FileReader(datasetStats))) {
            String line;
            boolean first = true;
            while ((line = br.readLine()) != null) {
                // Skip the header.
                if (first) {
                    first = false;
                    continue;
                }

                String[] tokens = line.split(",");
                String fileName = tokens[0];
                List<Integer> pocketList = result.get(fileName);
                if (pocketList == null) { // No value for given key.
                    pocketList = new ArrayList<>(1);
                }
                // Pocket rank is 4th field in the CSV.
                pocketList.add(Integer.parseInt(tokens[3]));
                result.put(fileName, pocketList);
            }
        }
        return result;
    }
/*
    private static void analyzeConservation(Path dir, String origin,
                                            ConservationScore.ScoreFormat format) throws
            IOException {
        Map<String, List<Integer>> datasetStats = loadDatasetStatistics(
                dir.resolve("ranks_rescored.dca4.csv").toFile());
        List<Integer> truePocketPositionsConservation = new ArrayList<>();
        List<Integer> truePocketPositionsPrank = new ArrayList<>();
        List<Integer> truePocketPositionsCombi = new ArrayList<>();
        List<Integer> falsePocketPositionsConservation = new ArrayList<>();
        List<Integer> falsePocketPositionsPrank = new ArrayList<>();
        List<Integer> falsePocketPositionsCombi = new ArrayList<>();
        List<Integer> numberOfPockets = new ArrayList<>();

        List<Double> truePocketConservationAvg = new ArrayList<>();
        List<Double> falsePocketConservationAvg = new ArrayList<>();


        List<Double> scores = new ArrayList<>();
        List<Double> conservationScore = new ArrayList<>();
        List<Boolean> pocketIsTrue = new ArrayList<>();
        try (PrintWriter result = new PrintWriter(dir.resolve("results." + origin + ".txt")
                .toFile())) {
            try (PrintWriter allRaw = new PrintWriter(dir.resolve("resultsAllRaw." + origin + "" +
                    ".txt").toFile())) {
                File[] filesInDir = dir.toFile().listFiles();
                List<ConservationComparison> comparisons = new ArrayList<>();
                for (File pdb : filesInDir) {
                    if (pdb.getName().endsWith(".pdb")) {
                        String nameBase = pdb.getName().substring(0, pdb.getName().length() - 4);
                        File indices = dir.resolve(nameBase + ".pdb_binding-residues.txt").toFile();

                        Function<String, File> scoreFnc = format == ConservationScore.ScoreFormat
                                .ConCavityFormat ?
                                chainId -> dir.resolve(String.format
                                        ("%s_%s.scores", nameBase, chainId)).toFile() :
                                chainId -> dir.resolve(String.format
                                        ("%s%s.scores", nameBase, chainId)).toFile();

                        File predictions = dir.resolve(String.format("%s.pdb_predictions.csv",
                                nameBase)).toFile();
                        try {
                            ConservationScore score = loadConservationScore(pdb, scoreFnc, format);
                            ConservationComparison comparison =
                                    ConservationComparison.fromFiles(pdb, score,
                                            origin, indices);
                            List<Pocket> pockets = Pocket.parseCSVPrediction(
                                    new FileInputStream(predictions),
                                    datasetStats.get(pdb.getName()),
                                    score);

                            for (Pocket pocket : pockets) {
                                scores.add((double) pocket.getScore());
                                conservationScore.add(pocket.getConservationAvg());
                                pocketIsTrue.add(pocket.isTruePocket());
                            }

                            for (int i = 0; i < pockets.size(); i++) {
                                if (pockets.get(i).isTruePocket()) {
                                    truePocketPositionsPrank.add(i);
                                    System.out.printf("prank: %d\n", i);
                                } else {
                                    falsePocketPositionsPrank.add(i);
                                }
                            }

                            pockets.sort(Comparator.comparing(Pocket::getConservationAvg)
                                    .reversed());
                            for (int i = 0; i < pockets.size(); i++) {
                                if (pockets.get(i).isTruePocket()) {
                                    truePocketPositionsConservation.add(i);
                                    System.out.printf("conser: %d\n", i);
                                    truePocketConservationAvg.add(pockets.get(i)
                                            .getConservationAvg());
                                } else {
                                    falsePocketPositionsConservation.add(i);
                                    falsePocketConservationAvg.add(pockets.get(i)
                                            .getConservationAvg());
                                }
                            }

                            pockets.sort(Comparator.comparing(Pocket::getCombiningScore).reversed
                                    ());
                            for (int i = 0; i < pockets.size(); i++) {
                                if (pockets.get(i).isTruePocket()) {
                                    truePocketPositionsCombi.add(i);
                                    System.out.printf("combi: %d\n", i);
                                } else {
                                    falsePocketPositionsCombi.add(i);
                                }
                            }

                            numberOfPockets.add(pockets.size());

                            System.out.println(comparison.toString());
                            result.println(comparison.toString());
                            comparisons.add(comparison);
                        } catch (IOException e) {
                            e.printStackTrace();
                        }
                    }
                }
//                ConservationComparison all = ConservationComparison.merge(comparisons, origin);
                result.println();
//                result.println(all.toString());
                double avgNumberOfPockets = numberOfPockets.stream().mapToInt(Integer::intValue)
                        .average().getAsDouble();
                System.out.printf("\n\nTrue pocket prank rank avg: %f/%f\n",
                        truePocketPositionsPrank.stream().mapToInt(Integer::intValue)
                                .average().getAsDouble(), avgNumberOfPockets);
                System.out.printf("True pocket conservation rank avg: %f/%f\n",
                        truePocketPositionsConservation.stream().mapToInt(Integer::intValue)
                                .average().getAsDouble(), avgNumberOfPockets);
                System.out.printf("True pocket combi rank avg: %f/%f\n",
                        truePocketPositionsCombi.stream().mapToInt(Integer::intValue)
                                .average().getAsDouble(), avgNumberOfPockets);
                System.out.printf("False pocket prank rank avg: %f/%f\n",
                        falsePocketPositionsPrank.stream().mapToInt(Integer::intValue)
                                .average().getAsDouble(), avgNumberOfPockets);
                System.out.printf("False pocket conservation rank avg: %f/%f\n",
                        falsePocketPositionsConservation.stream().mapToInt(Integer::intValue)
                                .average().getAsDouble(), avgNumberOfPockets);
                System.out.printf("False pocket combi rank avg: %f/%f\n",
                        falsePocketPositionsCombi.stream().mapToInt(Integer::intValue)
                                .average().getAsDouble(), avgNumberOfPockets);

                System.out.printf("\n\nTrue pocket conservation avg: %f\n",
                        truePocketConservationAvg.stream().mapToDouble(Double::doubleValue)
                                .average().getAsDouble());
                System.out.printf("False pocket conservation avg: %f\n",
                        falsePocketConservationAvg.stream().mapToDouble(Double::doubleValue)
                                .average().getAsDouble());

//                Function<String, String> trim = s -> s.substring(1, s.length() - 1);
//                allRaw.println(trim.apply(Arrays.toString(all.getProteinScores())));
//                allRaw.println(trim.apply(Arrays.toString(all.getNonLigandScores())));
//                allRaw.println(trim.apply(Arrays.toString(all.getLigandScores())));

                for (int i = 0; i < pocketIsTrue.size(); i++) {
                    allRaw.printf("%f,%f,%f\n", scores.get(i), conservationScore.get(i),
                            pocketIsTrue.get(i) ? 1.0 : 0.0);
                }
            }
        }
    }
    */
}
