package cz.siret.protein.utils.feature;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.apache.commons.csv.QuoteMode;
import org.biojava.nbio.structure.ResidueNumber;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.Writer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class ResidueFeatureAdapter {

    private static final String[] HEADER = {
            "chain", "ins. code", "seq. code"
    };

    public static <T> void writeToCsvFile(
            ResidueFeature<T> feature, String columnName,
            File file) throws IOException {
        writeToCsvFile(feature, columnName, file, false);
    }


    private static <T> void writeToCsvFile(
            ResidueFeature<T> feature,
            String columnName,
            File file,
            boolean append) throws IOException {
        CSVFormat format = CSVFormat.RFC4180
                .withQuoteMode(QuoteMode.ALL);
        try (Writer writer = new FileWriter(file, append);
             CSVPrinter printer = new CSVPrinter(writer, format)) {
            if (!append) {
                printer.printRecord(prepareHeader(columnName));
            }
            List<Object> line = new ArrayList<>();
            for (ResidueNumber residue : feature.getResidues()) {
                line.clear();
                line.add(residue.getChainName());
                line.add(residue.getInsCode());
                line.add(residue.getSeqNum());
                line.add(feature.get(residue));
                printer.printRecord(line);
            }
        }
    }

    private static List<String> prepareHeader(String customColumn) {
        return prepareHeader(Collections.singletonList(customColumn));
    }

    private static List<String> prepareHeader(List<String> customColumns) {
        List<String> result = new ArrayList<>(HEADER.length);
        result.addAll(Arrays.asList(HEADER));
        result.addAll(customColumns);
        return result;
    }


    public static <T> void appendToCsvFile(
            ResidueFeature<T> feature, String columnName,
            File file) throws IOException {
        boolean canAppend = file.exists();
        writeToCsvFile(feature, columnName, file, canAppend);
    }

}
