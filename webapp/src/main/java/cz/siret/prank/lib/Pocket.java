package cz.siret.prank.lib;

import java.io.InputStream;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Scanner;

public class Pocket implements Serializable {
    private String name;
    private int rank;
    private float score;
    private int numOfConnollyPoints;
    private int numOfSurfaceAtoms;
    private float centerX;
    private float centerY;
    private float centerZ;
    private String[] residueIds;
    private Integer[] surfAtomIds;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getRank() {
        return rank;
    }

    public void setRank(int rank) {
        this.rank = rank;
    }

    public float getScore() {
        return score;
    }

    public void setScore(float score) {
        this.score = score;
    }

    public int getNumOfConnollyPoints() {
        return numOfConnollyPoints;
    }

    public void setNumOfConnollyPoints(int numOfConnollyPoints) {
        this.numOfConnollyPoints = numOfConnollyPoints;
    }

    public int getNumOfSurfaceAtoms() {
        return numOfSurfaceAtoms;
    }

    public void setNumOfSurfaceAtoms(int numOfSurfaceAtoms) {
        this.numOfSurfaceAtoms = numOfSurfaceAtoms;
    }

    public float getCenterX() {
        return centerX;
    }

    public void setCenterX(float centerX) {
        this.centerX = centerX;
    }

    public float getCenterY() {
        return centerY;
    }

    public void setCenterY(float centerY) {
        this.centerY = centerY;
    }

    public float getCenterZ() {
        return centerZ;
    }

    public void setCenterZ(float centerZ) {
        this.centerZ = centerZ;
    }

    public String[] getResidueIds() {
        return residueIds;
    }

    public void setResidueIds(String[] residueIds) {
        this.residueIds = residueIds;
    }

    public Integer[] getSurfAtomIds() {
        return surfAtomIds;
    }

    public void setSurfAtomIds(Integer[] surfAtomIds) {
        this.surfAtomIds = surfAtomIds;
    }


    public static List<Pocket> parseCSVPrediction(InputStream inputStream) {
        // name,rank,score,connolly_points,surf_atoms,center_x,center_y,center_z,residue_ids,
        // surf_atom_ids
        Scanner scanner = new Scanner(inputStream);
        scanner.nextLine(); // Skip the header line
        List<Pocket> res = new ArrayList<>();
        while (scanner.hasNextLine()) {
            Pocket p = new Pocket();
            String[] tokens = scanner.nextLine().split(",");
            p.setName(tokens[0]);
            p.setRank(Integer.parseInt(tokens[1]));
            p.setScore(Float.parseFloat(tokens[2]));
            p.setNumOfConnollyPoints(Integer.parseInt(tokens[3]));
            p.setNumOfSurfaceAtoms(Integer.parseInt(tokens[4]));
            p.setCenterX(Float.parseFloat(tokens[5]));
            p.setCenterY(Float.parseFloat(tokens[6]));
            p.setCenterZ(Float.parseFloat(tokens[7]));
            p.setResidueIds(Arrays.stream(tokens[8].split(" ")).toArray(String[]::new));
            p.setSurfAtomIds(Arrays.stream(tokens[9].split(" "))
                    .map((s) -> Integer.parseInt(s)).toArray(Integer[]::new));
            res.add(p);
        }
        return res;
    }
}
