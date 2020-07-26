package cz.siret.protein.utils;

import org.biojava.nbio.structure.Atom;
import org.biojava.nbio.structure.Group;
import org.biojava.nbio.structure.GroupType;

import java.util.List;
import java.util.stream.Collectors;

public class ProteinUtils {

    public static List<Atom> proteinAtoms(List<Atom> atoms) {
        List<Atom> result = atoms.stream()
                .filter(atom -> isProteinChainGroup(atom.getGroup()))
                .collect(Collectors.toList());
        return AtomUtils.withoutHydrogens(result);
    }

    public static boolean isProteinChainGroup(Group group) {
        return isAminoAcidGroup(group) && group.getChainId() != null;
    }

    public static boolean isAminoAcidGroup(Group group) {
        return group.getType() == GroupType.AMINOACID;
    }

}
