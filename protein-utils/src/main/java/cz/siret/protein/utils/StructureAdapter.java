package cz.siret.protein.utils;

import org.biojava.nbio.structure.Atom;
import org.biojava.nbio.structure.Structure;
import org.biojava.nbio.structure.io.CifFileReader;
import org.biojava.nbio.structure.io.PDBFileReader;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.zip.GZIPInputStream;

public class StructureAdapter {

    private static final String PDB_EXTENSION = ".pdb";

    private static final String PDB_GZ_EXTENSION = ".pdb.gz";

    private static final String CIF_EXTENSION = ".cif";

    private static final String CIF_GZ_EXTENSION = ".cif.gz";

    public static Structure loadStructure(
            File structureFile) throws IOException {
        String fileName = structureFile.getName().toLowerCase();
        if (fileName.endsWith(PDB_EXTENSION)
                || fileName.endsWith(PDB_GZ_EXTENSION)) {
            return loadPdbFile(structureFile);
        } else if (fileName.endsWith(CIF_EXTENSION)
                || fileName.endsWith(CIF_GZ_EXTENSION)) {
            return loadCifFile(structureFile);
        } else {
            throw new IOException(
                    "Unknown file format: " + structureFile.getName());
        }
    }

    private static Structure loadPdbFile(File pdbFile) throws IOException {
        PDBFileReader reader = new PDBFileReader();
        try (InputStream inputStream = openStream(pdbFile)) {
            return reader.getStructure(inputStream);
        }
    }

    private static Structure loadCifFile(File pdbFile) throws IOException {
        CifFileReader reader = new CifFileReader();
        try (InputStream inputStream = openStream(pdbFile)) {
            return reader.getStructure(inputStream);
        }
    }

    private static InputStream openStream(File file) throws IOException {
        if (file.getName().endsWith(".gz")) {
            return new GZIPInputStream(new FileInputStream(file));
        } else {
            return new FileInputStream(file);
        }
    }

}
