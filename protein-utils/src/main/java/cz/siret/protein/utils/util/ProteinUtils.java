package cz.siret.protein.utils.util;

import org.biojava.nbio.structure.Atom;
import org.biojava.nbio.structure.Group;
import org.biojava.nbio.structure.GroupType;

import java.util.List;
import java.util.stream.Collectors;

public class ProteinUtils {

    public static List<Atom> polymerAtoms(List<Atom> atoms) {
        List<Atom> result = atoms.stream()
                .filter(atom -> isPolymer(atom.getGroup()))
                .filter(atom -> atom.getGroup().getChainId() != null)
                .collect(Collectors.toList());
        return AtomUtils.withoutHydrogens(result);
    }

    /**
     * Select the macro molecules where there might be binding sites.
     * This include the protein, DNA, ...
     * <p>
     * Use PDB types, we should consider update for PolymerType
     * that is based on mmcif dictionary.
     */
    public static boolean isPolymer(Group group) {
        GroupType type = group.getType();
        return GroupType.AMINOACID.equals(type)
                || GroupType.NUCLEOTIDE.equals(type);
    }

}
