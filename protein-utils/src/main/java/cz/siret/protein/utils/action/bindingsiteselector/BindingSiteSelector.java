package cz.siret.protein.utils.action.bindingsiteselector;

import cz.siret.protein.utils.util.AtomUtils;
import cz.siret.protein.utils.util.ProteinUtils;
import cz.siret.protein.utils.util.StructureUtils;
import cz.siret.protein.utils.action.ligandselector.Ligand;
import org.biojava.nbio.structure.Atom;
import org.biojava.nbio.structure.Group;
import org.biojava.nbio.structure.ResidueNumber;
import org.biojava.nbio.structure.Structure;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public class BindingSiteSelector {

    /**
     * Atoms in this distance to the ligands are considered to be
     * a part of the binding site.
     */
    private final double bindingSiteDistance = 4.0;

    public Set<ResidueNumber> getBindingSites(
            Structure structure, List<Ligand> ligands) {
        List<Atom> ligandAtoms = new ArrayList<>();
        for (Ligand ligand : ligands) {
            ligandAtoms.addAll(ligand.getAtoms());
        }
        List<Atom> proteinAtoms = ProteinUtils.polymerAtoms(
                StructureUtils.getAllAtoms(structure));
        List<Atom> bindingSiteAtoms = StructureUtils.selectInProximity(
                proteinAtoms, ligandAtoms, bindingSiteDistance);
        return AtomUtils.getDistinctGroups(bindingSiteAtoms)
                .stream()
                .map(Group::getResidueNumber)
                .collect(Collectors.toSet());
    }

}
