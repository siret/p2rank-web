package cz.siret.protein.utils;

import cz.siret.protein.utils.action.chainselector.ChainSelector;
import org.biojava.nbio.structure.Chain;
import org.biojava.nbio.structure.Structure;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.List;

public class Issue038 {

    /**
     * A single PDB chain can be represented by multiple chains. For example
     * for different atom types.
     */
    @Test
    public void issue038For6y2f() throws Exception {
        Structure structure = TestUtils.fetchPdb("6y2f");
        ChainSelector chainSelector = new ChainSelector();
        List<Chain> actual = chainSelector.selectByPdbName(
                structure, "A");
        Assertions.assertEquals(4, actual.size());
    }

    /**
     * Has chains A, B, C, P, T.
     */
    @Test
    public void issue038For7bv2() throws Exception {
        Structure structure = TestUtils.fetchPdb("7bv2");
        ChainSelector chainSelector = new ChainSelector();
        Assertions.assertEquals(
                7, chainSelector.selectByPdbName(structure, "A").size());
        Assertions.assertEquals(
                1, chainSelector.selectByPdbName(structure, "B").size());
        Assertions.assertEquals(
                2, chainSelector.selectByPdbName(structure, "P").size());
    }

}
