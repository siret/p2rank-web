package cz.siret.protein.utils.command;

import cz.siret.protein.utils.action.parsecommandline.ParseCommandLine;
import org.apache.commons.cli.CommandLine;
import org.apache.commons.cli.Options;

public abstract class Command {

    /**
     * @return Name used to call given command.
     */
    public abstract String getName();

    /**
     * @return Short description shown in the command list.
     */
    public abstract String getDescription();

    /**
     * Execute given command.
     */
    public abstract void execute(String[] args) throws Exception;

    protected CommandLine parseCommandLine(Options options, String[] args) {
        ParseCommandLine parser = new ParseCommandLine(
                "protein-utils.jar " + getName(),
                getDescription()
        );
        return parser.parseCommandLine(options, args);
    }

}
