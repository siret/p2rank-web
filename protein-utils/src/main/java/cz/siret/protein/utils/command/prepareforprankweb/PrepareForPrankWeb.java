package cz.siret.protein.utils.command.prepareforprankweb;

import com.fasterxml.jackson.databind.ObjectMapper;
import cz.siret.protein.utils.action.bindingsiteselector.BindingSiteSelector;
import cz.siret.protein.utils.action.ligandselector.LigandSelector;
import cz.siret.protein.utils.adapter.StructureAdapter;
import cz.siret.protein.utils.command.Command;
import cz.siret.protein.utils.command.prepareforprankweb.p2rank.P2RankAdapter;
import cz.siret.protein.utils.command.prepareforprankweb.p2rank.P2RankPocket;
import cz.siret.protein.utils.command.prepareforprankweb.p2rank.P2RankSequence;
import cz.siret.protein.utils.feature.ResidueFeature;
import cz.siret.protein.utils.feature.conservation.ConservationAdapter;
import org.apache.commons.cli.CommandLine;
import org.apache.commons.cli.Option;
import org.apache.commons.cli.Options;
import org.biojava.nbio.structure.Chain;
import org.biojava.nbio.structure.Group;
import org.biojava.nbio.structure.GroupType;
import org.biojava.nbio.structure.ResidueNumber;
import org.biojava.nbio.structure.Structure;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.IOException;
import java.util.Collection;
import java.util.Iterator;
import java.util.List;
import java.util.Set;

/**
 * Prepare files for PrankWeb.
 */
public class PrepareForPrankWeb extends Command {

    private static final Logger LOG =
            LoggerFactory.getLogger(PrepareForPrankWeb.class);

    private PrepareForPrankWebConfiguration configuration;

    private ObjectMapper mapper = new ObjectMapper();

    @Override
    public String getName() {
        return "PrepareForPrankWeb";
    }

    @Override
    public String getDescription() {
        return "Prepare data for prankweb.";
    }

    @Override
    public void execute(String[] args) throws Exception {
        CommandLine commandLine = parseArgs(args);
        if (commandLine == null) {
            LOG.error("Can't parse command line arguments.");
            return;
        }
        loadConfiguration(commandLine);
        writePocketFile();
        writeSequenceFile();
    }

    private CommandLine parseArgs(String[] args) {
        Options options = new Options();
        options.addOption(null, "structure", true, "Structure file.");
        options.addOption(null, "prediction", true, "P2rank prediction file.");
        options.addOption(null, "residues", true, "P2rank residues file.");
        options.addOption(null, "output", true, "Output directory.");
        options.addOption(Option.builder()
                .longOpt("conservation")
                .argName("property=value")
                .desc("Conservation file for given chain.")
                .numberOfArgs(2)
                .valueSeparator('=')
                .build()
        );
        return parseCommandLine(options, args);
    }

    private void loadConfiguration(CommandLine commandLine) {
        configuration = new PrepareForPrankWebConfiguration();
        configuration.structureFile = new File(
                commandLine.getOptionValue("structure"));
        configuration.predictionsFile = new File(
                commandLine.getOptionValue("prediction"));
        configuration.residuesFile = new File(
                commandLine.getOptionValue("residues"));
        configuration.outputDirectory = new File(
                commandLine.getOptionValue("output"));
        for (Iterator<Option> iter = commandLine.iterator(); iter.hasNext(); ) {
            Option opt = iter.next();
            if (!opt.getLongOpt().equals("conservation")) {
                continue;
            }
            configuration.chainToConservationFile.put(
                    opt.getValue(0), new File(opt.getValue(1)));
        }
    }


    private void writePocketFile() throws IOException {
        List<P2RankPocket> pockets = loadPredictions();
        mapper.writeValue(
                new File(configuration.outputDirectory, "prediction.json"),
                pockets);
    }

    private List<P2RankPocket> loadPredictions() throws IOException {
        P2RankAdapter adapter = new P2RankAdapter();
        return adapter.loadPredictions(configuration.predictionsFile);
    }

    private void writeSequenceFile() throws IOException {
        Structure structure = loadStructure();
        ResidueFeature<Double> conservation = loadConservation(structure);
        Set<ResidueNumber> bindingSites = getBindingSites(structure);
        P2RankSequence sequence = createSequence(
                structure, conservation, bindingSites);
        mapper.writeValue(
                new File(configuration.outputDirectory, "sequence.json"),
                sequence);
    }

    private Structure loadStructure() throws IOException {
        StructureAdapter structureAdapter = new StructureAdapter();
        return structureAdapter.loadStructure(configuration.structureFile);
    }

    private ResidueFeature<Double> loadConservation(Structure structure)
            throws IOException {
        ConservationAdapter adapter = new ConservationAdapter();
        return adapter.loadConservationJsdFormat(
                structure, configuration.chainToConservationFile::get);
    }

    private Set<ResidueNumber> getBindingSites(Structure structure) {
        LigandSelector ligandSelector = new LigandSelector();
        BindingSiteSelector siteSelector = new BindingSiteSelector();
        var ligands = ligandSelector.selectLigands(structure);
        return siteSelector.getBindingSites(structure, ligands);

    }

    private P2RankSequence createSequence(
            Structure structure, ResidueFeature<Double> conservation,
            Collection<ResidueNumber> bindingSites) {
        P2RankSequence result = new P2RankSequence();
        for (Chain chain : structure.getChains()) {
            if (chain.getAtomGroups(GroupType.AMINOACID).size() <= 0) {
                continue;
            }
            String chainId = getChainId(chain);
            int start = result.indices.size();
            for (Group group : chain.getAtomGroups(GroupType.AMINOACID)) {
                String code = getGroupLetter(group);
                if (code.equals("?")) {
                    continue;
                }
                result.seq.add(code);
                ResidueNumber resNum = group.getResidueNumber();
                if (conservation != null && conservation.size() > 0) {
                    result.scores.add(conservation.getOrDefault(resNum, 0.0));
                }
                result.indices.add(resNum.printFull());
                if (bindingSites != null && bindingSites.contains(resNum)) {
                    result.bindingSites.add(result.indices.size() - 1);
                }
            }
            result.regions.add(new P2RankSequence.Region(
                    chainId, start, result.indices.size() - 1));
        }
        return result;
    }

    /**
     * Return chain or "A" if no chain is provided.
     */
    private String getChainId(Chain chain) {
        String id = chain.getId();
        return id.trim().isEmpty() ? "A" : id;
    }

    private String getGroupLetter(Group group) {
        return group.getChemComp().getOne_letter_code().toUpperCase();
    }

}
