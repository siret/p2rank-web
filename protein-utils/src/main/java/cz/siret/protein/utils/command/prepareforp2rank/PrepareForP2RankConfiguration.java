package cz.siret.protein.utils.command.prepareforp2rank;

import java.io.File;
import java.util.List;

public class PrepareForP2RankConfiguration {

    /**
     * Input structure file.
     */
    public File structureFile;

    /**
     * Output directory.
     */
    public File outputDirectory;

    /**
     * Chains to select, when null use all available chains.
     */
    public List<String> chains;

}
