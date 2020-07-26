package cz.siret.protein.utils.command;

import org.apache.commons.cli.CommandLine;
import org.apache.commons.cli.Options;

public abstract class Command<T> {

    /**
     * Name used to call module from command line.
     */
    private final String moduleName;

    public Command(String moduleName) {
        this.moduleName = moduleName;
    }

    /**
     * @return Options object used to parse command line arguments.
     */
    public abstract Options createOptions();

    /**
     * @param args Parsed command line arguments.
     * @return Configuration object for this action.
     */
    public abstract T loadOptions(CommandLine args);

    public abstract void execute(T configuration) throws Exception;

    public String getModuleName() {
        return moduleName;
    }

}
