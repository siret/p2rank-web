package cz.siret.protein.utils.command.prepareforprankweb.p2rank;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Scanner;

public class P2RankAdapter {

    public List<P2RankPocket> loadPredictions(File predictionsFile)
            throws IOException {
        List<P2RankPocket> pockets;
        try (InputStream stream = new FileInputStream(predictionsFile)) {
            pockets = parsePredictionFile(stream);
        }
        return pockets;
    }

    private List<P2RankPocket> parsePredictionFile(InputStream stream) {
        // name, rank, score, probability,
        // sas_points, surf_atoms,
        // center_x, center_y, center_z, residue_ids, surf_atom_ids
        Scanner scanner = new Scanner(stream);
        scanner.nextLine(); // Skip the header line
        List<P2RankPocket> result = new ArrayList<>();
        while (scanner.hasNextLine()) {
            P2RankPocket pocket = new P2RankPocket();
            String[] tokens = scanner.nextLine().split(",");
            pocket.name = tokens[0].trim();
            pocket.rank = Integer.parseInt(tokens[1].trim());
            pocket.score = Float.parseFloat(tokens[2].trim());
            pocket.probability = Float.parseFloat(tokens[3].trim());
            pocket.numOfConnollyPoints = Integer.parseInt(tokens[4].trim());
            pocket.numOfSurfaceAtoms = Integer.parseInt(tokens[5].trim());
            pocket.centerX = Float.parseFloat(tokens[6].trim());
            pocket.centerY = Float.parseFloat(tokens[7].trim());
            pocket.centerZ = Float.parseFloat(tokens[8].trim());
            pocket.residueIds = tokens[9].trim().split(" ");
            pocket.surfAtomIds =
                    Arrays.stream(tokens[10].trim().split(" "))
                            .map(Integer::parseInt)
                            .toArray(Integer[]::new);
            result.add(pocket);
        }
        return result;
    }

}
