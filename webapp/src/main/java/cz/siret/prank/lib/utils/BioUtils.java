package cz.siret.prank.lib.utils;

import org.biojava.nbio.structure.Chain;
import org.biojava.nbio.structure.GroupType;
import org.biojava.nbio.structure.Structure;
import org.biojava.nbio.structure.StructureException;
import org.biojava.nbio.structure.io.FileConvert;
import org.biojava.nbio.structure.io.PDBFileReader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.lang.StringBuilder;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

public enum BioUtils {
    INSTANCE;

    private final transient Logger logger = LoggerFactory.getLogger(getClass());

    public Map<String, String> pdbToFasta(File pdbFile) throws IOException,
            StructureException {
        return pdbToFasta(loadPdbFile(pdbFile), null);
    }

    public String chainToFasta(Chain chain, String header) {
        StringBuilder result = new StringBuilder();
        String seq = chain.getAtomSequence().trim();
        if (seq.length() == 0) return null;
        // Print the header like this: >4X09:A
        result.append(header).append(chain.getChainID()).append('\n');
        // Print the chain sequence and wrap lines at 80 characters
        for (int i = 0; i < seq.length(); i++) {
            if (i != 0 && i % 80 == 0) result.append('\n');
            result.append(seq.charAt(i));
        }
        return result.toString();
    }

    public Structure loadPdbFile(File pdbFile) throws IOException {
        logger.info("Loading pdb file [{}]", pdbFile.getAbsolutePath());
        PDBFileReader pdbReader = new PDBFileReader();
        try (InputStream inputStream = Utils.INSTANCE.readFile(pdbFile)) {
            return pdbReader.getStructure(inputStream);
        }
    }

    public Map<String, String> pdbToFasta(Structure protein, String chainId) throws
            IOException, StructureException {
        Map<String, String> output = new HashMap<>();
        String header = ">" + protein.getPDBHeader().getIdCode() + ":";
        if (chainId == null) {
            for (Chain chain : protein.getChains()) {
                String chId = chain.getChainID().trim().isEmpty() ? "A" : chain.getChainID();
                if (chain.getAtomGroups(GroupType.AMINOACID).size() <= 0) continue;
                String chainFasta = chainToFasta(chain, header);
                if (chainFasta != null) {
                    output.put(chId, chainFasta);
                }
            }
        } else {
            Chain chain = chainId.isEmpty() ?
                    protein.getChains().get(0) :
                    protein.getChainByPDB(chainId);
            String chainFasta = chainToFasta(chain, header);
            if (chainFasta != null) {
                output.put(chain.getChainID(), chainFasta);
            }
        }
        return output;
    }

    public Tuple2<String, String> removePdbExtension(String fileName) {
        if (fileName.endsWith(".pdb.gz") || fileName.endsWith("ent.gz")) {
            return Tuple.create(fileName.substring(0, fileName.length() - 7),
                    fileName.substring(fileName.length() - 7));
        } else {
            int dotIndex = fileName.lastIndexOf('.');
            return Tuple.create(fileName.substring(0, dotIndex), fileName.substring(dotIndex));
        }
    }

    public List<String> fileToFastaFiles(File f) throws IOException, StructureException {
        List<String> result = new ArrayList<>();
        if (f.isFile()) {
            Map<String, String> fastaChains = pdbToFasta(f);
            Tuple2<String, String> baseAndExt = removePdbExtension(f.getName());
            for (Map.Entry<String, String> chainEntry : fastaChains.entrySet()) {
                String newFileName = baseAndExt.getItem1().concat(chainEntry.getKey())
                        .concat(baseAndExt.getItem2()).concat(".seq.fasta");
                File newFile = new File(f.getParent(), newFileName);
                Utils.INSTANCE.stringToFile(chainEntry.getValue(), newFile, false, false);
                result.add(newFile.getAbsolutePath());
            }
        }
        return result;
    }

    public List<String> dirToFastaFiles(File dir) throws IOException, StructureException {
        List<String> result = new ArrayList<>();
        File[] listOfFiles = dir.listFiles();
        for (File f : listOfFiles != null ? listOfFiles : new File[0]) {
            result.addAll(fileToFastaFiles(f));
        }
        return result;
    }

    public static final String CONSERVATION_FILENAME_PATTERN = "%baseDir%%chainID%.%ext%";
    public Map<String, Tuple2<File, File>> copyAndGzipConservationAndMSAsToDir(
            Map<String, Tuple2<File, File>> conservationAndMSAs, String baseName, Path destDir) throws IOException {
        Map<String, Tuple2<File, File>> result = new HashMap<>();
        for (final Map.Entry<String, Tuple2<File, File>> entry : conservationAndMSAs.entrySet()) {
            Path msaFile = destDir.resolve(baseName.concat(entry.getKey()).concat(".fasta"));
            Path sourceFile = entry.getValue().getItem1().toPath();
            logger.info("Copying file: {} -> {}", sourceFile.toAbsolutePath().toString(),
                    msaFile.toAbsolutePath().toString());
            Files.copy(sourceFile, msaFile, StandardCopyOption.REPLACE_EXISTING);
            Utils.INSTANCE.gzipAndDeleteFile(msaFile.toFile());

            Path scoreFile = destDir.resolve(baseName.concat(entry.getKey()).concat(".hom"));
            sourceFile = entry.getValue().getItem2().toPath();
            logger.info("Copying file: {} -> {}", sourceFile.toAbsolutePath().toString(),
                    scoreFile.toAbsolutePath().toString());
            Files.copy(sourceFile, scoreFile, StandardCopyOption.REPLACE_EXISTING);
            Utils.INSTANCE.gzipAndDeleteFile(scoreFile.toFile());

            result.put(entry.getKey(), Tuple.create(msaFile.toFile(), scoreFile.toFile()));
        }
        for (final Tuple2<File, File> files : conservationAndMSAs.values()) {
            files.getItem1().delete();
            files.getItem2().delete();
        }

        return result;
    }

    public int getProteinSize(Structure protein) {
        int resCount = 0;
        for (final Chain chain : protein.getChains()) {
            if (chain.getAtomGroups(GroupType.AMINOACID).size() <= 0) continue;
            resCount += chain.getAtomGroups(GroupType.AMINOACID).size();
        }
        return resCount;
    }

    public String getChainsPDB(File pdbFile, Set<String> chains) throws StructureException, IOException {
        Structure protein = loadPdbFile(pdbFile);
        FileConvert fileConvert = new FileConvert(protein);
        StringBuilder pdbBuilder = new StringBuilder();
        for (String chainId : chains) {
            Chain chain = protein.findChain(chainId);
            pdbBuilder.append(fileConvert.toPDB(chain));
        }
        return pdbBuilder.toString();
    }

    public String checkForPdbFileErrors(File pdbFile) {
        try {
            Structure protein = loadPdbFile(pdbFile);
            boolean hasAminoChains = false;
            for (Chain chain : protein.getChains()) {
                if (chain.getAtomGroups(GroupType.AMINOACID).size() > 0) {
                    hasAminoChains = true;
                    break;
                }
            }
            return hasAminoChains ? null : "The PDB file does not contain any protein structure.";
        } catch (Exception e) {
            return "Failed to load PDB file. ".concat(e.toString());
        }
    }

}
