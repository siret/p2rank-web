package cz.siret.protein.utils.clustering;

public class ClusterDistanceFunction {

    @FunctionalInterface
    public interface ElementDistance<T> {

        double apply(T left, T right);

    }

    public static <T> Clustering.Distance<T> minDistance(
            ElementDistance<T> distanceFunction) {
        return (Clustering.Cluster<T> left, Clustering.Cluster<T> right) -> {
            double result = Double.POSITIVE_INFINITY;
            for (T leftItem : left.getItems()) {
                for (T rightItem : right.getItems()) {
                    result = Math.min(
                            distanceFunction.apply(leftItem, rightItem),
                            result);
                }
            }
            return result;
        };
    }

}
