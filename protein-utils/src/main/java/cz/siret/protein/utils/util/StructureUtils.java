package cz.siret.protein.utils.util;

import org.biojava.nbio.structure.Atom;
import org.biojava.nbio.structure.AtomIterator;
import org.biojava.nbio.structure.Group;
import org.biojava.nbio.structure.GroupIterator;
import org.biojava.nbio.structure.GroupType;
import org.biojava.nbio.structure.ResidueNumber;
import org.biojava.nbio.structure.Structure;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public class StructureUtils {

    public static Set<ResidueNumber> getProteinResidues(Structure structure) {
        var atoms = AtomUtils.getAllAtoms(StructureUtils.getGroups(structure));
        var proteinAtoms = ProteinUtils.polymerAtoms(atoms);
        return AtomUtils.getDistinctResidues(proteinAtoms);
    }

    public static List<Group> getGroups(Structure structure) {
        List<Group> result = new ArrayList<>();
        GroupIterator iterator = new GroupIterator(structure);
        while (iterator.hasNext()) {
            result.add(iterator.next());
        }
        return result;
    }

    public static List<Group> getLigandGroups(Structure structure) {
        return StructureUtils.getGroups(structure)
                .stream()
                .filter(StructureUtils::isLigandGroup)
                .collect(Collectors.toList());
    }

    public static boolean isLigandGroup(Group group) {
        return isHetGroup(group) && !isWaterGroup(group);
    }

    public static boolean isHetGroup(Group group) {
        return group != null && GroupType.HETATM == group.getType();
    }

    public static boolean isWaterGroup(Group group) {
        return "HOH".equals(group.getPDBName());
    }

    public static List<Atom> getAllAtoms(Structure structure) {
        List<Atom> result = new ArrayList<>(3000);
        AtomIterator atomIterator = new AtomIterator(structure);
        while (atomIterator.hasNext()) {
            result.add(atomIterator.next());
        }
        return result;
    }


    /**
     * Return atoms that are in given distance to aroundAtoms.
     */
    public static List<Atom> selectInProximity(
            List<Atom> atoms,
            List<Atom> queryAtoms,
            double distanceThreshold) {
        if (queryAtoms == null || queryAtoms.isEmpty()) {
            return Collections.emptyList();
        }
        // TODO Performance
        List<Atom> result = new ArrayList<>();
        for (Atom atom : atoms) {
            for (Atom aroundAtom : queryAtoms) {
                double distance = AtomUtils.atomEuclideanDistance(
                        atom, aroundAtom);
                if (distance < distanceThreshold) {
                    result.add(atom);
                    break;
                }
            }
        }
        return result;
    }

}
