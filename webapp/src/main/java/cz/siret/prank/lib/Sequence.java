package cz.siret.prank.lib;

import org.biojava.nbio.structure.Chain;
import org.biojava.nbio.structure.Group;
import org.biojava.nbio.structure.GroupType;
import org.biojava.nbio.structure.Structure;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

public class Sequence implements Serializable {
    public static class Region implements Serializable {
        public Region(String regionName, int start, int end) {
            this.regionName = regionName;
            this.start = start;
            this.end = end;
        }
        String regionName;
        int start, end;

        public String getRegionName() {
            return regionName;
        }

        public void setRegionName(String regionName) {
            this.regionName = regionName;
        }

        public int getStart() {
            return start;
        }

        public void setStart(int start) {
            this.start = start;
        }

        public int getEnd() {
            return end;
        }

        public void setEnd(int end) {
            this.end = end;
        }
    }

    private String[] indices;
    private String[] seq;
    private double[] scores;
    private Region[] regions;
    private int[] bindingSites;

    public String[] getSeq() {
        return seq;
    }

    public void setSeq(String[] seq) {
        this.seq = seq;
    }

    public double[] getScores() {
        return scores;
    }

    public void setScores(double[] scores) {
        this.scores = scores;
    }

    public String[] getIndices() {
        return indices;
    }

    public void setIndices(String[] indices) {
        this.indices = indices;
    }

    public Region[] getRegions() {
        return regions;
    }

    public void setRegions(Region[] regions) {
        this.regions = regions;
    }

    public int[] getBindingSites() {
        return bindingSites;
    }

    public void setBindingSites(int[] bindingSites) {
        this.bindingSites = bindingSites;
    }

    public static Sequence fromStructure(Structure protein,
                                         ConservationScore score,
                                         Set<ResidueNumberWrapper> bindingSites) {
        List<String> indices = new ArrayList<>();
        List<String> seq = new ArrayList<>();
        List<Double> conservationScores = new ArrayList<>();
        List<Region> regions = new ArrayList<>();
        List<Integer> sites = new ArrayList<>();

        for (Chain chain : protein.getChains()) {
            if (chain.getAtomGroups(GroupType.AMINOACID).size() <= 0) continue;
            String chainId = chain.getChainID().trim().isEmpty() ? "A" : chain.getChainID();
            int start = indices.size();
            for (Group group : chain.getAtomGroups(GroupType.AMINOACID)) {
                String c = group.getChemComp().getOne_letter_code();
                if (!c.equals("?")) {
                    seq.add(c);
                    ResidueNumberWrapper resNum = new ResidueNumberWrapper(group.getResidueNumber());
                    String insCode = resNum.getResNum().getInsCode() == null
                            ? "" : resNum.getResNum().getInsCode().toString();
                    if (score != null && score.size() > 0) {
                        conservationScores.add(score.getScoreForResidue(resNum));
                    }
                    indices.add(resNum.getResNum().printFull());
                    if (bindingSites != null && bindingSites.contains(resNum)) {
                        sites.add(indices.size()-1);
                    }
                }
            }
            regions.add(new Region(chainId, start, indices.size()-1));
        }
        Sequence res = new Sequence();
        res.indices = indices.toArray(new String[0]);
        res.seq = seq.toArray(new String[0]);
        res.scores = conservationScores.stream().mapToDouble(Double::doubleValue).toArray();
        res.bindingSites = sites.stream().mapToInt(Integer::intValue).toArray();
        res.regions = regions.toArray(new Region[0]);
        return res;
    }
}
