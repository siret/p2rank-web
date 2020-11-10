package cz.siret.protein.utils.action.parsecommandline;

import org.apache.commons.cli.CommandLine;
import org.apache.commons.cli.CommandLineParser;
import org.apache.commons.cli.DefaultParser;
import org.apache.commons.cli.HelpFormatter;
import org.apache.commons.cli.Options;
import org.apache.commons.cli.ParseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Arrays;

public class ParseCommandLine {

    private static final Logger LOG =
            LoggerFactory.getLogger(ParseCommandLine.class);

    private static final String FOOTER =
            "\nPlease report issues at "
                    + "https://github.com/cusbg/prankweb/issues";

    private final String command;

    private final String header;

    public ParseCommandLine(String command, String header) {
        this.command = command;
        this.header = header;
    }

    public CommandLine parseCommandLine(Options options, String[] args) {
        if (Arrays.asList(args).contains("-h")) {
            printHelp(options);
            return null;
        }
        CommandLineParser parser = new DefaultParser();
        try {
            return parser.parse(options, args);
        } catch (ParseException ex) {
            LOG.error("Invalid command line arguments.");
            LOG.info("reason: " + ex.getMessage());
            return null;
        }
    }

    private void printHelp(Options options) {
        HelpFormatter formatter = new HelpFormatter();
        formatter.printHelp(command, header, options, FOOTER, true);
    }

}
