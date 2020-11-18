package cz.siret.protein.utils;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.biojava.nbio.structure.Structure;
import org.biojava.nbio.structure.io.PDBFileReader;
import org.junit.jupiter.api.Assertions;

import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.io.Reader;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.HashSet;
import java.util.Set;

public class TestUtils {

    public static Structure fetchPdb(String id) throws IOException {
        PDBFileReader reader = new PDBFileReader();
        String urlAsStr = "https://files.rcsb.org/download/" + id + ".pdb";
        return reader.getStructure(new URL(urlAsStr));
    }

    public static File fileFromResource(String fileName) {
        final URL url = Thread.currentThread().getContextClassLoader().
                getResource(fileName);
        if (url == null) {
            throw new RuntimeException("Required resource '"
                    + fileName + "' is missing.");
        }
        return new File(url.getPath());
    }

    /**
     * Does not properly detect
     */
    public static void assertCsvEqual(
            File expectedFile, File actualFile) throws IOException {
        Set<String> expected = readCsv(expectedFile);
        Set<String> actual = readCsv(actualFile);
        Assertions.assertEquals(expected, actual);
    }

    public static Set<String> readCsv(File file) throws IOException {
        try (Reader reader = new FileReader(file);) {
            CSVParser parser = CSVFormat.RFC4180
                    .withFirstRecordAsHeader()
                    .parse(reader);
            Set<String> result = new HashSet<>();
            result.add(String.join(",", parser.getHeaderNames()));
            StringBuilder line = new StringBuilder();
            for (CSVRecord row : parser) {
                line.setLength(0);
                for (String column : parser.getHeaderNames()) {
                    line.append("---");
                    line.append(row.get(column));
                }
                result.add(line.toString());
            }
            return result;
        }
    }

    public static void assertJsonEqual(
            File expectedFile, File actualFile) throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        JsonNode expected = mapper.readTree(expectedFile);
        JsonNode actual = mapper.readTree(actualFile);
        Assertions.assertEquals(expected, actual);
    }

    public static void assertTextEqual(
            File expectedFile, File actualFile) throws IOException {
        String expected = Files.readString(expectedFile.toPath());
        String actual = Files.readString(actualFile.toPath());
        Assertions.assertEquals(expected, actual);
    }

    public static void deleteDirectory(File file) throws IOException {
        Files.walk(file.toPath())
                .sorted(Comparator.reverseOrder())
                .map(Path::toFile)
                .forEach(File::delete);
    }

}
