package cz.siret.protein.utils;

import cz.siret.protein.utils.action.chainselector.ChainSelector;
import cz.siret.protein.utils.action.chaintosequence.ChainToSequence;
import org.biojava.nbio.structure.Chain;
import org.biojava.nbio.structure.Structure;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.List;

public class Issue027 {

    /**
     * Extract sequence, we are not interested in the result for now.
     * Just demonstrate situation where chain name and chain ID is different.
     */
    @Test
    public void issue027For7bv2() throws Exception {
        Structure structure = TestUtils.fetchPdb("7bv2");
        ChainSelector chainSelector = new ChainSelector();
        ChainToSequence chainToSequence = new ChainToSequence();

        List<Chain> chains = chainSelector.selectByPdbName(structure, "P");
        String actualChainP = chainToSequence.getPolymerSequence(chains.get(0));

        Assertions.assertEquals("GAUUAAGUUAU", actualChainP);
    }

}
