package cz.siret.protein.utils;

import cz.siret.protein.utils.command.Command;
import cz.siret.protein.utils.command.ConservationToFeature;
import cz.siret.protein.utils.command.PrepareDataForP2RankWeb;
import cz.siret.protein.utils.command.SelectChains;
import cz.siret.protein.utils.command.StructureToFasta;
import org.apache.commons.cli.CommandLine;
import org.apache.commons.cli.CommandLineParser;
import org.apache.commons.cli.DefaultParser;
import org.apache.commons.cli.HelpFormatter;
import org.apache.commons.cli.Options;
import org.apache.commons.cli.ParseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;


public class ApplicationEntry {

    private static final Logger LOG =
            LoggerFactory.getLogger(ApplicationEntry.class);

    private static final List<Command<?>> COMMANDS = Arrays.asList(
            new ConservationToFeature(),
            new PrepareDataForP2RankWeb(),
            new SelectChains(),
            new StructureToFasta()
    );

    public static void main(String[] args) {
        (new ApplicationEntry()).run(args);
    }

    private void run(String[] args) {
        CommandLine cmdLine = parseArguments(args);
        if (cmdLine == null) {
            // Invalid command line.
            return;
        }
        Instant start = Instant.now();
        boolean showHelp = shouldShowHelp(args);
        if (cmdLine.hasOption("script")) {
            executeScript(cmdLine, showHelp);
        } else {
            executeAction(cmdLine, showHelp);
        }
        Duration duration = Duration.between(start, Instant.now());
        LOG.info(String.format("Finished in %02d:%02d:%02d",
                duration.toHours(),
                duration.toMinutesPart(),
                duration.toSecondsPart()));
    }

    /**
     * Argument parser cancel parsing before first unknown argument. So we
     * use this to detect help argument anywhere.
     */
    private boolean shouldShowHelp(String[] args) {
        for (String arg : args) {
            if ("-h".equals(arg)) {
                return true;
            }
        }
        return false;
    }

    private CommandLine parseArguments(String[] args) {
        Options options = createAppCmdOptions();
        CommandLineParser parser = new DefaultParser();
        try {
            return parser.parse(options, args, true);
        } catch (ParseException ex) {
            LOG.error("Invalid command line arguments");
            LOG.info("Reason: " + ex.getMessage());
            return null;
        }
    }

    private Options createAppCmdOptions() {
        Options result = new Options();
        result.addOption(
                "a", "action", true,
                "Name of an action to execute, must be the first argument.");
        result.addOption(
                "s", "script", true,
                "Load command arguments from file.");
        result.addOption("h", false,
                "Show help.");
        return result;
    }

    private void executeScript(CommandLine cmdLine, boolean showHelp) {
        if (showHelp) {
            HelpFormatter formatter = new HelpFormatter();
            formatter.printHelp("protein-utils", createAppCmdOptions());
            return;
        }
        File file = new File(cmdLine.getOptionValue("script"));
        try (FileReader fileReader = new FileReader(file);
             BufferedReader reader = new BufferedReader(fileReader)) {
            String line = reader.readLine();
            while (line != null) {
                String[] args = parseStringAsArgs(line);
                if (args.length == 0) {
                    continue;
                }
                CommandLine lineCmdLine = parseArguments(args);
                if (lineCmdLine == null) {
                    LOG.error("Can't parse script command.");
                    LOG.info("Script line: {}", line);
                    return;
                }
                executeAction(lineCmdLine, false);
                //
                line = reader.readLine();
            }
        } catch (IOException ex) {
            LOG.error("can't read script file");
            LOG.info("reason: " + ex.getMessage());
        }
    }

    /**
     * Parse string into arguments, this simple implementation should
     * be enough for start. Should we need more we can employ some library:
     */
    private String[] parseStringAsArgs(String line) {
        List<String> result = new ArrayList<>();
        StringBuilder nextItem = new StringBuilder();
        boolean ignoreNextControl = false;
        char escaping = 0;
        for (int index = 0; index < line.length(); ++index) {
            char character = line.charAt(index);
            // First we detect escape, as that mean that every followup
            // character is going to be used as it is.
            if (character == '\\') {
                ignoreNextControl = true;
                continue;
            }
            // Check for ignored characters - just read them.
            if (ignoreNextControl) {
                nextItem.append(character);
                ignoreNextControl = false;
                continue;
            }
            // Handle quotes.
            if (character == escaping) {
                // Ending quotes.
                escaping = 0;
                continue;
            }
            if (character == '\'' || character == '\"') {
                escaping = character;
                continue;
            }
            if (escaping == 0 && Character.isWhitespace(character)) {
                // Space with no escape, i.e. end of argument.
                result.add(nextItem.toString().trim());
                nextItem.setLength(0);
            }
            nextItem.append(character);
        }
        if (nextItem.length() > 0) {
            result.add(nextItem.toString().trim());
        }
        return result.toArray(new String[0]);
    }

    private void executeAction(CommandLine cmdLine, boolean showHelp) {
        Command<?> action = selectAction(cmdLine.getOptionValue("action"));
        if (action == null) {
            // No action set and help is required.
            if (showHelp) {
                HelpFormatter formatter = new HelpFormatter();
                formatter.printHelp("protein-utils", createAppCmdOptions());
                printAvailableActions();
            }
            return;
        }
        if (showHelp) {
            // We have an action and help is required.
            HelpFormatter formatter = new HelpFormatter();
            formatter.printHelp("protein-utils", action.createOptions());
            return;
        }
        LOG.info("Using action: " + action.getModuleName());
        CommandLine cmdActionLine =
                parseActionArguments(action, cmdLine.getArgs());
        if (cmdActionLine == null) {
            // Invalid command line arguments for the action.
            return;
        }
        try {
            executeAction(action, cmdActionLine);
        } catch (Exception ex) {
            LOG.error("Action execution failed");
            LOG.info("Reason", ex);
        }
    }

    private Command<?> selectAction(String actionName) {
        for (Command<?> action : COMMANDS) {
            if (action.getModuleName().equals(actionName)) {
                return action;
            }
        }
        return null;
    }

    private void printAvailableActions() {
        System.out.println("available actions:");
        for (Command<?> action : COMMANDS) {
            System.out.println(" " + action.getModuleName());
        }
    }

    private CommandLine parseActionArguments(
            Command<?> action, String[] args) {
        Options options = action.createOptions();
        CommandLineParser parser = new DefaultParser();
        try {
            return parser.parse(options, args);
        } catch (ParseException ex) {
            LOG.error("invalid action command line arguments");
            LOG.info("reason: " + ex.getMessage());
            return null;
        }
    }

    private <T> void executeAction(Command<T> action, CommandLine args)
            throws Exception {
        T configuration = action.loadOptions(args);
        action.execute(configuration);
    }

}
