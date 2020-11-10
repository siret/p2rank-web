package cz.siret.protein.utils.action.ligandselector.clustering;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public interface Clustering<T> {

    class Cluster<T> {

        protected List<T> items;

        public Cluster(T item) {
            this.items = new ArrayList<>();
            this.items.add(item);
        }

        public Cluster(List<T> items) {
            this.items = items;
        }

        public List<T> getItems() {
            return Collections.unmodifiableList(items);
        }

        public int size() {
            return items.size();
        }

        public void add(Cluster<T> other) {
            items.addAll(other.items);
        }

    }

    @FunctionalInterface
    interface Distance<T> {

        double apply(Cluster<T> left, Cluster<T> right);

    }

    @FunctionalInterface
    interface Position<T> {
        double[] apply(T entity);
    }

    List<Cluster<T>> cluster(
            List<T> elements,
            double minDist,
            Distance<T> distanceFunction);

}
