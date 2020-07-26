package cz.siret.protein.utils.model;

import org.biojava.nbio.structure.Atom;

import java.util.Collections;
import java.util.List;

public class Ligand {

    private List<Atom> atoms;

    public Ligand(List<Atom> atoms) {
        this.atoms = atoms;
    }

    public List<Atom> getAtoms() {
        return Collections.unmodifiableList(atoms);
    }

}
