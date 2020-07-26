package cz.siret.protein.utils.command;

import cz.siret.protein.utils.FeatureUtils;
import cz.siret.protein.utils.StructureAdapter;
import cz.siret.protein.utils.model.ResidueFeature;
import cz.siret.protein.utils.feature.conservation.ConservationLoader;
import cz.siret.protein.utils.model.ResidueFeatureAdapter;
import org.apache.commons.cli.CommandLine;
import org.apache.commons.cli.Option;
import org.apache.commons.cli.Options;
import org.biojava.nbio.structure.Structure;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

public class ConservationToFeature
        extends Command<ConservationToFeature.Configuration> {

    private static final Logger LOG =
            LoggerFactory.getLogger(ConservationToFeature.class);

    public static class Configuration {

        public File structureFile;

        public Map<String, File> chainToConservationFile = new HashMap<>();

        public Double defaultValue = null;

        public File outputFile;

        public boolean append = false;

    }

    public ConservationToFeature() {
        super("conservation-to-feature");
    }

    @Override
    public Options createOptions() {
        Options options = new Options();
        options.addOption(null, "structure", true, "Structure file.");
        options.addOption(null, "output", true, "Output file.");
        options.addOption(Option.builder()
                .longOpt("default")
                .desc("Default value used for residues in given chain " +
                        "if no conservation is provided.")
                .hasArg()
                .type(Double.class)
                .optionalArg(true)
                .build()
        );
        options.addOption(Option.builder()
                .longOpt("conservation")
                .argName("property=value")
                .desc("Conservation file for given chain.")
                .numberOfArgs(2)
                .valueSeparator('=')
                .build()
        );
        options.addOption(Option.builder()
                .longOpt("append")
                .desc("Append output to existing files. Can be used to add" +
                        "information for multiple chains to a single file.")
                .optionalArg(true)
                .build()
        );
        return options;
    }

    @Override
    public Configuration loadOptions(CommandLine args) {
        Configuration result = new Configuration();
        result.structureFile = new File(args.getOptionValue("structure"));
        result.outputFile = new File(args.getOptionValue("output"));
        if (args.hasOption("default")) {
            result.defaultValue =
                    Double.parseDouble(args.getOptionValue("default"));
        }
        for (Iterator<Option> iter = args.iterator(); iter.hasNext(); ) {
            Option opt = iter.next();
            if (!opt.getLongOpt().equals("conservation")) {
                continue;
            }
            result.chainToConservationFile.put(
                    opt.getValue(0), new File(opt.getValue(1)));
        }
        result.append = args.hasOption("append");
        return result;
    }

    @Override
    public void execute(Configuration configuration) throws Exception {
        Structure structure = StructureAdapter.loadStructure(
                configuration.structureFile);
        ResidueFeature<Double> conservation =
                (new ConservationLoader()).loadConservationJsdFormat(
                        structure, configuration.chainToConservationFile::get);
        LOG.info("Loaded {} values for {}",
                conservation.size(),
                configuration.structureFile);
        if (configuration.defaultValue != null) {
            for (String chain :
                    configuration.chainToConservationFile.keySet()) {
                FeatureUtils.fillChainWithDefault(
                        structure, chain,
                        conservation, configuration.defaultValue);
            }
        }
        if (configuration.append) {
            // Do not use for append.
            ResidueFeatureAdapter.appendToCsvFile(
                    conservation, "conservation", configuration.outputFile);
        } else {
            ResidueFeatureAdapter.writeToCsvFile(
                    conservation, "conservation", configuration.outputFile);
        }
    }

}
