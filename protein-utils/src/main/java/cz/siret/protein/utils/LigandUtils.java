package cz.siret.protein.utils;

import cz.siret.protein.utils.clustering.ClusterDistanceFunction;
import cz.siret.protein.utils.clustering.Clustering;
import cz.siret.protein.utils.clustering.GridBasedClustering;
import cz.siret.protein.utils.clustering.SimpleClustering;
import cz.siret.protein.utils.model.Ligand;
import org.biojava.nbio.structure.Atom;
import org.biojava.nbio.structure.Group;
import org.biojava.nbio.structure.GroupType;
import org.biojava.nbio.structure.Structure;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class LigandUtils {

    public static class Configuration {

        /**
         * 1.7 is a size of a covalent bond.
         */
        double LigandClusteringDistance = 1.7;

    }

    private static final Logger LOG =
            LoggerFactory.getLogger(LigandUtils.class);

    private Configuration configuration;

    public LigandUtils() {
        configuration = new Configuration();
    }

    public LigandUtils(Configuration configuration) {
        this.configuration = configuration;
    }

    public List<Ligand> selectLigands(Structure structure) {
        List<Group> ligandGroups = StructureUtils.getLigandGroups(structure);
        List<Atom> ligandAtoms = AtomUtils.getAllAtoms(ligandGroups);
        Clustering<Atom> clustering =
                new GridBasedClustering<>(Atom::getCoords);
        var clusters = clustering.cluster(
                ligandAtoms,
                configuration.LigandClusteringDistance,
                ClusterDistanceFunction.minDistance(
                        AtomUtils::atomEuclideanDistance)
        );
        return createFromAtoms(
                clusters.stream()
                        .map(Clustering.Cluster::getItems)
                        .collect(Collectors.toList()));
    }

    private List<Ligand> createFromAtoms(
            List<List<Atom>> ligandGroups) {
        return ligandGroups.stream()
                .map(Ligand::new)
                .collect(Collectors.toList());
    }

    /**
     * In chen11 dataset, the ligands by marked by TER line:
     * TER    1s69a
     * .. ligand
     * TER    1s69a
     */
    public List<Ligand> selectLigandsByTER(
            Structure structure, File pdbFile) throws IOException {
        List<List<Atom>> ligandAtomGroups = getLigandsAtomsByTER(
                StructureUtils.getAllAtoms(structure),
                pdbFile);
        return createFromAtoms(ligandAtomGroups);
    }

    private List<List<Atom>> getLigandsAtomsByTER(
            List<Atom> atoms, File pdbFile) throws IOException {
        Map<Integer, Atom> index = AtomUtils.buildIndexByPdbSerial(atoms);
        List<List<Atom>> result = new ArrayList<>();
        List<Atom> currentLigandAtoms = new ArrayList<>();
        for (String line : Files.readAllLines(pdbFile.toPath())) {
            if (line.startsWith("A")) {
                continue;
            } else if (line.startsWith("HETATM")) {
                String lineData = line.substring(6);
                int atomId = Integer.parseInt(firstWord(lineData));
                Atom atom = index.get(atomId);
                if (atom != null) {
                    currentLigandAtoms.add(atom);
                } else {
                    LOG.warn("Can't find atom in strcuture for line: {}", line);
                }
            } else if (line.startsWith("TER")) {
                result.add(currentLigandAtoms);
                currentLigandAtoms = new ArrayList<>();
            }
        }
        return result;
    }

    private String firstWord(String string) {
        string = string.trim();
        for (int index = 0; index != string.length(); index++) {
            if (Character.isWhitespace(string.charAt(index))) {
                return string.substring(0, index);
            }
        }
        return string;
    }

}
