package cz.siret.protein.utils.clustering;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * We start with each element in it's own cluster.
 * Then for each cluster we try to merge it with all other.
 * <p>
 * We start by wrapping up the elements into NamedClusters. One cluster
 * per element. Next we put the clusters into grid. Next we start merging
 * the clusters. But we do not try to merge every cluster with all other
 * clusters but instead only with clusters that are in close cells.
 * <p>
 * This gives us better performance.
 */
public class GridBasedClustering<T> implements Clustering<T> {

    private static class NamedCluster<T> extends Clustering.Cluster<T> {

        Integer id;

        final double[] position;

        public NamedCluster(int id, T element, double[] position) {
            super(element);
            this.id = id;
            this.position = position;
        }

        public void mergeWith(NamedCluster<T> other) {
            this.items.addAll(other.items);
            other.id = this.id;
            other.items = this.items;
        }

    }

    private static class Cell<T> {

        final int x;

        final int y;

        final int z;

        public Cell(int x, int y, int z) {
            this.x = x;
            this.y = y;
            this.z = z;
        }

        List<NamedCluster<T>> content = new ArrayList<>();

    }

    private final Position<T> positionGetter;

    private List<NamedCluster<T>> clusters;

    private List<Cell<T>> cells;

    public GridBasedClustering(Position<T> positionGetter) {
        this.positionGetter = positionGetter;
    }

    @Override
    public List<Cluster<T>> cluster(
            List<T> elements, double minDist, Distance<T> distanceFunction) {
        wrapElementsToClusters(elements);
        createGrid(minDist * 2);
        mergeClusters(minDist, distanceFunction);
        return collectClusters();
    }

    private void wrapElementsToClusters(List<T> elements) {
        this.clusters = new ArrayList<>(elements.size());
        int counter = 0;
        for (T element : elements) {
            var position = this.positionGetter.apply(element);
            if (position.length != 3) {
                throw new RuntimeException(
                        "This algorithm works only with 3D data.");
            }
            this.clusters.add(new NamedCluster<>(++counter, element, position));
        }
    }

    private void createGrid(double distance) {
        this.cells = new ArrayList<>();
        for (NamedCluster<T> cluster : clusters) {
            Cell<T> cell = getCell(cluster.position, distance);
            cell.content.add(cluster);
        }
    }

    private Cell<T> getCell(double[] position, double distance) {
        int x = (int) (position[0] / distance);
        int y = (int) (position[1] / distance);
        int z = (int) (position[2] / distance);
        for (Cell<T> cell : cells) {
            if (cell.x == x && cell.y == y && cell.z == z) {
                return cell;
            }
        }
        Cell<T> result = new Cell<>(x, y, z);
        this.cells.add(result);
        return result;
    }

    private void mergeClusters(double minDist, Distance<T> distanceFunction) {
        for (Cell<T> cell : cells) {
            for (Cell<T> other : getNeighbourCell(cell)) {
                mergeCells(minDist, distanceFunction, cell, other);
            }
        }
    }

    private List<Cell<T>> getNeighbourCell(Cell<T> center) {
        List<Cell<T>> result = new ArrayList<>(8);
        for (Cell<T> cell : cells) {
            if (Math.abs(cell.x - center.x) < 1
                    && Math.abs(cell.y - center.y) < 1
                    && Math.abs(cell.z - center.z) < 1) {
                result.add(cell);
            }
        }
        return result;
    }

    private void mergeCells(
            double minDist, Distance<T> distanceFunction,
            Cell<T> left, Cell<T> right) {
        for (NamedCluster<T> leftItem : left.content) {
            for (NamedCluster<T> rightItem : right.content) {
                if (leftItem.id == rightItem.id) {
                    // Same cluster.
                    continue;
                }
                double distance = distanceFunction.apply(
                        leftItem, rightItem);
                if (distance <= minDist) {
                    leftItem.mergeWith(rightItem);
                }
            }
        }
    }

    private List<Cluster<T>> collectClusters() {
        Map<Integer, Cluster<T>> result = new HashMap<>();
        for (NamedCluster<T> cluster : clusters) {
            if (result.containsKey(cluster.id)) {
                continue;
            }
            result.put(cluster.id, new Cluster<T>(cluster.items));
        }
        return new ArrayList<>(result.values());
    }

}
