package cz.siret.protein.utils.command.prepareforp2rank;

import java.util.ArrayList;
import java.util.List;

/**
 * Definition of structure info file.
 */
class StructureInfoFile {

    public static class Chain {

        public String id;

        public String name;

        public List<String> types;

    }

    public List<Chain> chains = new ArrayList<>();

}
