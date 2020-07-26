package cz.siret.protein.utils;

import cz.siret.protein.utils.model.ResidueFeature;
import org.biojava.nbio.structure.ResidueNumber;
import org.biojava.nbio.structure.Structure;

public class FeatureUtils {

    /**
     * Add default as a value to all missing residues.
     */
    public static <T> void fillStructureWithDefault(
            Structure structure, ResidueFeature<T> feature,
            T defaultValue) {
        for (ResidueNumber residue :
                StructureUtils.getProteinResidues(structure)) {
            feature.addIfAbsent(residue, defaultValue);
        }
    }

    public static <T> void fillChainWithDefault(
            Structure structure, String chainName,ResidueFeature<T> feature,
            T defaultValue) {
        for (ResidueNumber residue :
                StructureUtils.getProteinResidues(structure)) {
            if (residue.getChainName().equals(chainName)) {
                feature.addIfAbsent(residue, defaultValue);
            }
        }
    }

}
