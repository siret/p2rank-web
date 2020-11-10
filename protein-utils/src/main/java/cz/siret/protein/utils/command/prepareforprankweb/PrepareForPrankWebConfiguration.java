package cz.siret.protein.utils.command.prepareforprankweb;

import java.io.File;
import java.util.HashMap;
import java.util.Map;

public class PrepareForPrankWebConfiguration {

    public File structureFile;

    public Map<String, File> chainToConservationFile = new HashMap<>();

    public File predictionsFile;

    public File residuesFile;

    public File outputDirectory;

}
