package cz.siret.protein.utils.clustering;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;

/**
 * We start with each element in it's own cluster.
 * Then for each cluster we try to merge it with all other.
 */
public class SimpleClustering<T> implements Clustering<T> {

    @Override
    public List<Cluster<T>> cluster(
            List<T> elements, double minDist, Distance<T> distanceFunction) {
        if (elements.isEmpty()) {
            return Collections.emptyList();
        }
        if (elements.size() == 1) {
            return Collections.singletonList(new Cluster<>(elements));
        }
        List<Cluster<T>> clusters = new ArrayList<>(elements.size());
        for (T element : elements) {
            clusters.add(new Cluster<>(element));
        }
        for (int i = 0; i < clusters.size(); i++) {
            for (int j = 0; j < clusters.size(); j++) {
                if (clusters.get(i) == clusters.get(j)) {
                    // Same cluster.
                    continue;
                }
                double distance = distanceFunction.apply(
                        clusters.get(i),
                        clusters.get(j));
                if (distance > minDist) {
                    // Cluster are not close enough.
                    continue;
                }
                clusters.get(i).add(clusters.get(j));
                clusters.set(j, clusters.get(i));
            }
        }
        // Collect unique clusters.
        return new ArrayList<>(new HashSet<>(clusters));
    }

}
