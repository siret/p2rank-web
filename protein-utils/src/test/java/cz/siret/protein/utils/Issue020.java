package cz.siret.protein.utils;

import cz.siret.protein.utils.action.bindingsiteselector.BindingSiteSelector;
import cz.siret.protein.utils.action.ligandselector.LigandSelector;
import org.biojava.nbio.structure.Structure;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import java.util.concurrent.TimeUnit;

public class Issue020 {

    /**
     * This test was introduced as execution with the given input data
     * takes too long (more then 45 minutes).
     */
    @Test
    @Timeout(value = 15, unit = TimeUnit.SECONDS)
    public void issue020For1gac() throws Exception {
        Structure structure = TestUtils.fetchPdb("7bv2");
        LigandSelector ligandSelector = new LigandSelector();

        BindingSiteSelector bindingSiteSelector = new BindingSiteSelector();
        bindingSiteSelector.getBindingSites(
                structure, ligandSelector.selectLigands(structure));
    }

    /**
     * Another performance test with a lots of small molecules and
     * multiple models.
     */
    @Test
    @Timeout(value = 10, unit = TimeUnit.SECONDS)
    public void issue020For19hc() throws Exception {
        Structure structure = TestUtils.fetchPdb("19hc");
        LigandSelector ligandSelector = new LigandSelector();

        BindingSiteSelector bindingSiteSelector = new BindingSiteSelector();
        bindingSiteSelector.getBindingSites(
                structure, ligandSelector.selectLigands(structure));
    }

}
