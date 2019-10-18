package cz.siret.prank.lib.utils;

/**
 *
 * @author Sam Harwell
 */
public final class Tuple {

    public static <T1, T2> Tuple2<T1, T2> create(T1 item1, T2 item2) {
        return new Tuple2<T1, T2>(item1, item2);
    }

    public static <T1, T2, T3> Tuple3<T1, T2, T3> create(T1 item1, T2 item2, T3 item3) {
        return new Tuple3<T1, T2, T3>(item1, item2, item3);
    }

    /*package*/ static boolean equals(Object x, Object y) {
        return x == y || (x != null && x.equals(y));
    }

    // static utility class
    private Tuple() {}

}