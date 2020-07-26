package cz.siret.protein.utils.command;

import com.fasterxml.jackson.databind.ObjectMapper;
import cz.siret.protein.utils.command.p2rank.P2RankPocket;
import cz.siret.protein.utils.command.p2rank.P2RankSequence;
import cz.siret.protein.utils.AtomUtils;
import cz.siret.protein.utils.LigandUtils;
import cz.siret.protein.utils.ProteinUtils;
import cz.siret.protein.utils.StructureAdapter;
import cz.siret.protein.utils.StructureUtils;
import cz.siret.protein.utils.feature.conservation.ConservationLoader;
import cz.siret.protein.utils.model.Ligand;
import cz.siret.protein.utils.model.ResidueFeature;
import org.apache.commons.cli.CommandLine;
import org.apache.commons.cli.Option;
import org.apache.commons.cli.Options;
import org.biojava.nbio.structure.Atom;
import org.biojava.nbio.structure.Chain;
import org.biojava.nbio.structure.Group;
import org.biojava.nbio.structure.GroupType;
import org.biojava.nbio.structure.ResidueNumber;
import org.biojava.nbio.structure.Structure;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Scanner;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

public class PrepareDataForP2RankWeb
        extends Command<PrepareDataForP2RankWeb.Configuration> {

    public static class Configuration {

        public File structureFile;

        public Map<String, File> chainToConservationFile = new HashMap<>();

        public File predictionsCsvFile;

        public File residuesCsvFile;

        public File outputPocketFile;

        public File outputSequenceFile;

    }

    private static final Logger LOG =
            LoggerFactory.getLogger(PrepareDataForP2RankWeb.class);

    public PrepareDataForP2RankWeb() {
        super("p2rank-web");
    }

    @Override
    public Options createOptions() {
        Options options = new Options();
        options.addOption(null, "structure", true, "Structure file.");
        options.addOption(null, "prediction", true, "P2rank prediction file.");
        options.addOption(null, "residues", true, "P2rank residues file.");
        options.addOption(null, "output-pocket", true,
                "Output pocket JSON file.");
        options.addOption(null, "output-sequence", true,
                "Output sequence JSON file.");
        options.addOption(Option.builder()
                .longOpt("conservation")
                .argName("property=value")
                .desc("Conservation file for given chain.")
                .numberOfArgs(2)
                .valueSeparator('=')
                .build()
        );
        return options;
    }

    @Override
    public Configuration loadOptions(CommandLine args) {
        Configuration result = new Configuration();
        result.structureFile = new File(args.getOptionValue("structure"));
        result.predictionsCsvFile = new File(args.getOptionValue("prediction"));
        result.residuesCsvFile = new File(args.getOptionValue("residues"));
        result.outputPocketFile =
                new File(args.getOptionValue("output-pocket"));
        result.outputSequenceFile =
                new File(args.getOptionValue("output-sequence"));
        for (Iterator<Option> iter = args.iterator(); iter.hasNext(); ) {
            Option opt = iter.next();
            if (!opt.getLongOpt().equals("conservation")) {
                continue;
            }
            result.chainToConservationFile.put(
                    opt.getValue(0), new File(opt.getValue(1)));
        }
        return result;
    }

    @Override
    public void execute(Configuration configuration) throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        List<P2RankPocket> pockets = summarizePredictions(
                configuration.predictionsCsvFile,
                configuration.residuesCsvFile);
        mapper.writeValue(
                configuration.outputPocketFile,
                pockets);
        P2RankSequence sequence = summarizeSequence(
                configuration.structureFile,
                configuration.chainToConservationFile::get);
        mapper.writeValue(
                configuration.outputSequenceFile,
                sequence);
    }

    public List<P2RankPocket> summarizePredictions(
            File predictionsFile, File residuesFile) throws IOException {
        List<P2RankPocket> pockets;
        try (InputStream stream = new FileInputStream(predictionsFile)) {
            pockets = parsePredictionFile(stream);
        }
        return pockets;
    }

    private static List<P2RankPocket> parsePredictionFile(InputStream stream) {
        // name,rank,score,connolly_points,surf_atoms,
        // center_x,center_y,center_z,residue_ids,surf_atom_ids
        Scanner scanner = new Scanner(stream);
        scanner.nextLine(); // Skip the header line
        List<P2RankPocket> result = new ArrayList<>();
        while (scanner.hasNextLine()) {
            P2RankPocket pocket = new P2RankPocket();
            String[] tokens = scanner.nextLine().split(",");
            pocket.name = tokens[0];
            pocket.rank = Integer.parseInt(tokens[1]);
            pocket.score = Float.parseFloat(tokens[2]);
            pocket.numOfConnollyPoints = Integer.parseInt(tokens[3]);
            pocket.numOfSurfaceAtoms = Integer.parseInt(tokens[4]);
            pocket.centerX = Float.parseFloat(tokens[5]);
            pocket.centerY = Float.parseFloat(tokens[6]);
            pocket.centerZ = Float.parseFloat(tokens[7]);
            pocket.residueIds = tokens[8].split(" ");
            pocket.surfAtomIds =
                    Arrays.stream(tokens[9].split(" "))
                            .map(Integer::parseInt)
                            .toArray(Integer[]::new);
            result.add(pocket);
        }
        return result;
    }

    public P2RankSequence summarizeSequence(
            File structureFile, Function<String, File> homologyFiles)
            throws IOException {
        Structure structure = StructureAdapter.loadStructure(structureFile);
        ResidueFeature<Double> conservation =
                (new ConservationLoader()).loadConservationJsdFormat(
                        structure, homologyFiles);
        var bindingSites = getBindingSites(structure);
        return createSequence(structure, conservation, bindingSites);
    }

    private static Set<ResidueNumber> getBindingSites(Structure structure) {
        LigandUtils ligandFactory = new LigandUtils();
        // TODO Load from TER if provided ?
        LOG.info("Get ligand atoms");
        List<Ligand> ligands = ligandFactory.selectLigands(structure);
        List<Atom> ligandAtoms = new ArrayList<>();
        for (Ligand ligand : ligands) {
            ligandAtoms.addAll(ligand.getAtoms());
        }
        LOG.info("Get binding sites");
        List<Atom> proteinAtoms = ProteinUtils.proteinAtoms(
                StructureUtils.getAllAtoms(structure));
        List<Atom> bindingSiteAtoms = StructureUtils.selectInProximity(
                proteinAtoms, ligandAtoms, 4.0);
        LOG.info("Collect groups");
        return AtomUtils.getDistinctGroups(bindingSiteAtoms)
                .stream()
                .map(Group::getResidueNumber)
                .collect(Collectors.toSet());
    }

    private static P2RankSequence createSequence(
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
    private static String getChainId(Chain chain) {
        String id = chain.getId();
        return id.trim().isEmpty() ? "A" : id;
    }

    private static String getGroupLetter(Group group) {
        return group.getChemComp().getOne_letter_code().toUpperCase();
    }

}
