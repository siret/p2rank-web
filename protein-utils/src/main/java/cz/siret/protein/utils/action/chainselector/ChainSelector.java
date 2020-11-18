package cz.siret.protein.utils.action.chainselector;

import org.biojava.nbio.structure.Chain;
import org.biojava.nbio.structure.Structure;

import java.util.List;
import java.util.stream.Collectors;

public class ChainSelector {

    public List<Chain> selectByPdbName(
            Structure structure, String chainName) {
        return structure.getChains().stream()
                .filter((chain -> chainName.equals(chain.getName())))
                .collect(Collectors.toList());
    }

}
