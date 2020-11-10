package cz.siret.protein.utils.action.chaintosequence;

import cz.siret.protein.utils.util.ProteinUtils;
import org.biojava.nbio.structure.Chain;
import org.biojava.nbio.structure.Group;


public class ChainToSequence {

    public String getPolymerSequence(Chain chain) {
        StringBuilder result = new StringBuilder();
        for (Group group : chain.getAtomGroups()) {
            if (!ProteinUtils.isPolymer(group)) {
                continue;
            }
            String code = getGroupLetter(group);
            if (code.equals("?")) {
                continue;
            }
            result.append(code);
        }
        return result.toString();
    }

    private String getGroupLetter(Group group) {
        return group.getChemComp().getOne_letter_code().toUpperCase();
    }

}
