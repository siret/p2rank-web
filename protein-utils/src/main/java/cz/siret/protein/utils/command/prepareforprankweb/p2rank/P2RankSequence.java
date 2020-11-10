package cz.siret.protein.utils.command.prepareforprankweb.p2rank;

import java.util.ArrayList;
import java.util.List;

public class P2RankSequence {

    public static class Region {

        public final String regionName;

        public final int start;

        public final int end;

        public Region(String regionName, int start, int end) {
            this.regionName = regionName;
            this.start = start;
            this.end = end;
        }

    }

    public final List<String> indices = new ArrayList<>();

    public final List<String> seq = new ArrayList<>();

    /**
     * Conservation scores.
     */
    public final List<Double> scores = new ArrayList<>();

    public final List<Region> regions = new ArrayList<>();

    public final List<Integer> bindingSites = new ArrayList<>();

}
