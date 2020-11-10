/**
 * All input/output functionality not carried out by commands must be
 * in this package. The aim is to force the IO to happen outside of the
 * business logic code and thus force better design.
 * <p>
 * An action may utilize data objects and main action class from another
 * action.
 * <p>
 * Every data object must be placed within a package of an action that
 * creates instances of the data object.
 */
package cz.siret.protein.utils.adapter;