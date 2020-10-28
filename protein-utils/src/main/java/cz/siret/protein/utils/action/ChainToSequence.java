package cz.siret.protein.utils.action;

import org.biojava.nbio.structure.Chain;
import org.biojava.nbio.structure.Group;
import org.biojava.nbio.structure.GroupType;
import org.biojava.nbio.structure.Structure;


public class ChainToSequence {

    public String getChainSequence(Structure structure, String chainId)
            throws ActionFailed {
        for (Chain chain : structure.getChains()) {
            String id = chain.getId();
            String name = chain.getName();
            if (chainId.equals(id) || chainId.equals(name)) {
                return getSequence(chain);
            }
        }
        throw new ActionFailed("Missing chain: {}", chainId);
    }


    public String getSequence(Chain chain) {
        StringBuilder result = new StringBuilder();
        for (Group group : chain.getAtomGroups(GroupType.AMINOACID)) {
            String code = getGroupLetter(group);
            if (code.equals("?")) {
                continue;
            }
            result.append(code);
        }
        return result.toString();
    }

    private static String getGroupLetter(Group group) {
        return group.getChemComp().getOne_letter_code().toUpperCase();
    }

}
