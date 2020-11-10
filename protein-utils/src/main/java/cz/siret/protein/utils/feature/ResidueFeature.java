package cz.siret.protein.utils.feature;

import org.biojava.nbio.structure.ResidueNumber;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

public class ResidueFeature<T> {

    private Map<ResidueNumber, T> values = new HashMap<>();

    public void add(ResidueFeature<T> other) {
        values.putAll(other.values);
    }

    public void add(ResidueNumber residue, T value) {
        values.put(residue, value);
    }

    public void addIfAbsent(ResidueNumber residue, T value) {
        values.putIfAbsent(residue, value);
    }

    public T get(ResidueNumber residue) {
        return values.get(residue);
    }

    public T getOrDefault(ResidueNumber residue, T defaultValue) {
        return values.getOrDefault(residue, defaultValue);
    }

    public long size() {
        return values.size();
    }

    public Collection<ResidueNumber> getResidues() {
        return values.keySet();
    }

}
