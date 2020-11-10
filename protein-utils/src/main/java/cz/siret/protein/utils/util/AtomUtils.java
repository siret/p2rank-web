package cz.siret.protein.utils.util;

import org.biojava.nbio.structure.Atom;
import org.biojava.nbio.structure.Element;
import org.biojava.nbio.structure.Group;
import org.biojava.nbio.structure.ResidueNumber;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

public class AtomUtils {

    public static Map<Integer, Atom> buildIndexByPdbSerial(List<Atom> atoms) {
        Map<Integer, Atom> result = new HashMap<>();
        for (Atom atom : atoms) {
            result.put(atom.getPDBserial(), atom);
        }
        return result;
    }

    public static List<Atom> getAllAtoms(Collection<Group> groups) {
        List<Atom> result = new ArrayList<>();
        for (Group group : groups) {
            result.addAll(group.getAtoms());
        }
        return result;
    }

    public static double atomEuclideanDistance(Atom left, Atom right) {
        double x = left.getX() - right.getX();
        double y = left.getY() - right.getY();
        double z = left.getZ() - right.getZ();
        return Math.sqrt(x * x + y * y + z * z);
    }

    public static Set<Group> getDistinctGroups(List<Atom> atoms) {
        return atoms.stream()
                .map(Atom::getGroup)
                .collect(Collectors.toSet());
    }

    public static Set<ResidueNumber> getDistinctResidues(List<Atom> atoms) {
        return atoms.stream()
                .map(Atom::getGroup)
                .map(Group::getResidueNumber)
                .collect(Collectors.toSet());
    }

    public static List<Atom> withoutHydrogens(List<Atom> atoms) {
        return atoms.stream()
                .filter((atom) -> !isHydrogenAtom(atom))
                .collect(Collectors.toList());
    }

    public static boolean isHydrogenAtom(Atom atom) {
        // TODO Add test for Hydrogen detection - metapocket ub48 dataset
        if (Element.H == atom.getElement()) {
            return true;
        }
        String name = atom.getName();
        if (name.startsWith("H")) {
            return true;
        }
        if (name.length() > 1 && name.charAt(1) == 'H') {
            return true;
        }
        return false;
    }

}
