package cz.siret.protein.utils.command.prepareforp2rank;

import com.fasterxml.jackson.databind.ObjectMapper;
import cz.siret.protein.utils.action.chainselector.ChainSelector;
import cz.siret.protein.utils.action.chaintosequence.ChainToSequence;
import cz.siret.protein.utils.adapter.StructureAdapter;
import cz.siret.protein.utils.command.Command;
import org.apache.commons.cli.CommandLine;
import org.apache.commons.cli.Option;
import org.apache.commons.cli.Options;
import org.biojava.nbio.structure.Chain;
import org.biojava.nbio.structure.Group;
import org.biojava.nbio.structure.GroupType;
import org.biojava.nbio.structure.Structure;
import org.biojava.nbio.structure.io.FileConvert;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Prepare input files for P2Rank.
 */
public class PrepareForP2Rrank extends Command {

    private static final Logger LOG =
            LoggerFactory.getLogger(PrepareForP2Rrank.class);

    private PrepareForP2RrankConfiguration configuration;

    @Override
    public String getName() {
        return "PrepareForP2Rrank";
    }

    @Override
    public String getDescription() {
        return "Prepare input data for p2rank pre-processor.";
    }

    @Override
    public void execute(String[] args) throws IOException {
        CommandLine commandLine = parseArgs(args);
        if (commandLine == null) {
            LOG.error("Can't parse command line arguments.");
            return;
        }
        loadConfiguration(commandLine);
        Structure structure = loadStructure();
        Map<String, Chain> chains = selectChains(structure);
        writeStructureFile(chains.values(), getOutputStructureFile());
        for (Map.Entry<String, Chain> entry : chains.entrySet()) {
            writeFastaFile(
                    structure,
                    entry.getValue(),
                    getOutputFastaFile(entry.getKey()));
        }
        writeInfoFile(structure);
    }

    private CommandLine parseArgs(String[] args) {
        Options options = new Options();
        options.addOption(null, "input", true, "Input structure file.");
        options.addOption(null, "output", true, "Output directory.");
        options.addOption(Option.builder()
                .longOpt("chains")
                .argName("property=value")
                .desc("Comma separated list of chains.")
                .numberOfArgs(2)
                .valueSeparator('=')
                .build());
        return parseCommandLine(options, args);
    }

    private void loadConfiguration(CommandLine commandLine) {
        configuration = new PrepareForP2RrankConfiguration();
        configuration.structureFile = new File(
                commandLine.getOptionValue("input"));
        configuration.outputDirectory = new File(
                commandLine.getOptionValue("output"));
        if (commandLine.hasOption("chains")) {
            configuration.chains = new ArrayList<>();
            String chains = commandLine.getOptionValue("chains");
            for (String chain : chains.split(",")) {
                if (chain.isEmpty() || chain.isBlank()) {
                    continue;
                }
                configuration.chains.add(chain);
            }
            if (configuration.chains.isEmpty()) {
                configuration.chains = null;
            }
        } else {
            configuration.chains = null;
        }
    }

    private Structure loadStructure() throws IOException {
        StructureAdapter structureAdapter = new StructureAdapter();
        return structureAdapter.loadStructure(configuration.structureFile);
    }

    /**
     * We use chain id to identify the chains.
     */
    private Map<String, Chain> selectChains(Structure structure) {
        Map<String, Chain> result = new HashMap<>();
        if (configuration.chains == null) {
            for (Chain chain : structure.getChains()) {
                result.put(chain.getId(), chain);
            }
        } else {
            ChainSelector chainSelector = new ChainSelector();
            for (String chainName : configuration.chains) {
                chainSelector.selectByPdbName(structure, chainName).forEach(
                        chain -> result.put(chain.getId(), chain));
            }
        }
        return result;
    }

    private List<GroupType> collectGroupTypes(Chain chain) {
        Set<GroupType> result = new HashSet<>();
        for (Group group : chain.getAtomGroups()) {
            result.add(group.getType());
        }
        return new ArrayList<>(result);
    }

    private File getOutputStructureFile() {
        return new File(configuration.outputDirectory, "structure.pdb");
    }

    private void writeStructureFile(Collection<Chain> chains, File output)
            throws IOException {
        StringBuilder pdbBuilder = new StringBuilder();
        for (Chain chain : chains) {
            pdbBuilder.append(FileConvert.toPDB(chain));
        }
        try (FileWriter writer = new FileWriter(output)) {
            writer.write(pdbBuilder.toString());
        }
    }

    private File getOutputFastaFile(String chain) {
        return new File(
                configuration.outputDirectory,
                "chain_" + chain + ".fasta");
    }

    private void writeFastaFile(Structure structure, Chain chain, File output)
            throws IOException {
        String header = getFastaHeader(structure, chain.getId());
        ChainToSequence chainToSequence = new ChainToSequence();
        String sequence = chainToSequence.getPolymerSequence(chain);
        try (FileWriter writer = new FileWriter(output)) {
            writer.write(header);
            writer.write("\n");
            writer.write(sequence);
            writer.write("\n");
        }
    }

    private String getFastaHeader(Structure structure, String chainId) {
        if (structure.getPDBCode() == null) {
            return ">structure|" + chainId;
        }
        return ">pdb|" + structure.getPDBCode() + "|Chain " + chainId;
    }

    private void writeInfoFile(Structure structure) throws IOException {
        StructureInfoFile output = new StructureInfoFile();
        for (Chain chain : structure.getChains()) {
            StructureInfoFile.Chain chainInfo = new StructureInfoFile.Chain();
            chainInfo.id = chain.getId();
            chainInfo.name = chain.getName();
            chainInfo.types = collectGroupTypes(chain)
                    .stream().map(GroupType::toString)
                    .collect(Collectors.toList());
            output.chains.add(chainInfo);
        }
        //
        ObjectMapper mapper = new ObjectMapper();
        mapper.writeValue(getOutputInfoFile(), output);
    }

    private File getOutputInfoFile() {
        return new File(configuration.outputDirectory, "structure-info.json");
    }

}
