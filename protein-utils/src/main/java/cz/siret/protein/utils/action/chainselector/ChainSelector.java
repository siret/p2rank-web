package cz.siret.protein.utils.action.chainselector;

import org.biojava.nbio.structure.Chain;
import org.biojava.nbio.structure.Structure;

public class ChainSelector {

    public Chain selectChain(Structure structure, String chainId) {
        for (Chain chain : structure.getChains()) {
            String id = chain.getId();
            String name = chain.getName();
            if (chainId.equals(id) || chainId.equals(name)) {
                return chain;
            }
        }
        return null;
    }

}
