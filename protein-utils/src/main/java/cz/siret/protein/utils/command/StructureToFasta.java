package cz.siret.protein.utils.command;

import cz.siret.protein.utils.StructureAdapter;
import cz.siret.protein.utils.action.ActionFailed;
import cz.siret.protein.utils.action.ChainToSequence;
import org.apache.commons.cli.CommandLine;
import org.apache.commons.cli.Options;
import org.biojava.nbio.structure.Structure;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * Output FASTA file (sequence) for given structure file.
 */
public class StructureToFasta extends Command<StructureToFasta.Configuration> {


    public static class Configuration {

        public File structureFile;

        public String outputFileTemplate;

        public List<String> chains = Collections.emptyList();

    }

    public StructureToFasta() {
        super("extract-chain-sequence");
    }

    @Override
    public Options createOptions() {
        Options options = new Options();
        options.addOption(null, "structure", true, "Structure file.");
        options.addOption(null, "output", true,
                "Output file template. Use {chain} as a placeholder" +
                        "for chain value.");
        options.addOption(null, "chains", true,
                "Comma separated chain(s) to extract");
        return options;
    }

    @Override
    public Configuration loadOptions(CommandLine args) {
        Configuration result = new Configuration();
        result.structureFile = new File(args.getOptionValue("structure"));
        result.outputFileTemplate = args.getOptionValue("output");
        result.chains = Arrays.asList(args.getOptionValue("chains").split(","));
        return result;
    }

    @Override
    public void execute(Configuration configuration) throws Exception {
        Structure structure = StructureAdapter.loadStructure(
                configuration.structureFile);
        for (String chainId : configuration.chains) {
            File outputFile = getOutputFile(configuration, chainId);
            saveSequence(structure, chainId, outputFile);
        }
    }

    private File getOutputFile(Configuration configuration, String chainId) {
        return new File(
                configuration.outputFileTemplate.replace("{chain}", chainId));
    }

    private void saveSequence(
            Structure structure, String chainId, File output)
            throws ActionFailed, IOException {
        ChainToSequence chainToSequence = new ChainToSequence();
        String header = getHeader(structure, chainId);
        String sequence = chainToSequence.getChainSequence(
                structure, chainId);
        try (FileWriter writer = new FileWriter(output)) {
            writer.write(header);
            writer.write("\n");
            writer.write(sequence);
            writer.write("\n");
        }
    }

    private String getHeader(Structure structure, String chainId) {
        if (structure.getPDBCode() == null) {
            return ">structure|" + chainId;
        }
        return ">pdb|" + structure.getPDBCode() + "|Chain " + chainId;
    }

}
