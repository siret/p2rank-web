package cz.siret.protein.utils;

import cz.siret.protein.utils.action.chainselector.ChainSelector;
import cz.siret.protein.utils.action.chaintosequence.ChainToSequence;
import org.biojava.nbio.structure.Structure;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class Issue027 {

    /**
     * Extract sequence, we are not interested in the result for now.
     * Just demonstrate situation where chain name and chain ID is different.
     */
    @Test
    public void issue27() throws Exception {
        Structure structure = TestUtils.fetchPdb("7bv2");
        ChainSelector chainSelector = new ChainSelector();
        ChainToSequence chainToSequence = new ChainToSequence();

        String actualChainP = chainToSequence.getPolymerSequence(
                chainSelector.selectChain(structure, "P"));

        Assertions.assertEquals("GAUUAAGUUAU", actualChainP);
    }

}
