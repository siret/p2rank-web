package cz.siret.protein.utils.command;

import cz.siret.protein.utils.StructureAdapter;
import org.apache.commons.cli.CommandLine;
import org.apache.commons.cli.Option;
import org.apache.commons.cli.Options;
import org.biojava.nbio.structure.Chain;
import org.biojava.nbio.structure.Structure;
import org.biojava.nbio.structure.io.FileConvert;

import java.io.File;
import java.io.FileWriter;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * Select only atoms from given PDB of mmCIF file that
 * belong to given chains.
 */
public class SelectChains extends Command<SelectChains.Configuration> {

    public static class Configuration {

        public File structureFile;

        public String outputFile;

        public List<String> chains = Collections.emptyList();

    }

    public SelectChains() {
        super("filter-by-chain");
    }

    @Override
    public Options createOptions() {
        Options options = new Options();
        options.addOption(null, "structure", true, "Structure file.");
        options.addOption(null, "output", true, "Output directory.");
        options.addOption(Option.builder()
                .longOpt("chains")
                .desc("Command separated list of chains to preserve." +
                        "If empty output one file for each chain.")
                .hasArg()
                .type(Double.class)
                .optionalArg(false)
                .build()
        );
        return options;
    }

    @Override
    public Configuration loadOptions(CommandLine args) {
        Configuration result = new Configuration();
        result.structureFile = new File(args.getOptionValue("structure"));
        result.outputFile = args.getOptionValue("output");
        result.chains = Arrays.asList(args.getOptionValue("chains").split(","));
        return result;
    }

    @Override
    public void execute(Configuration configuration) throws Exception {
        Structure structure = StructureAdapter.loadStructure(
                configuration.structureFile);
        StringBuilder pdbBuilder = new StringBuilder();
        for (Chain chain : structure.getChains()) {
            String id = chain.getId();
            String name = chain.getName();
            if (configuration.chains.contains(id)
                    || configuration.chains.contains(name)) {
                pdbBuilder.append(FileConvert.toPDB(chain));
            }
        }
        File output = new File(configuration.outputFile);
        try (FileWriter writer = new FileWriter(output)) {
            writer.write(pdbBuilder.toString());
        }
    }

}
