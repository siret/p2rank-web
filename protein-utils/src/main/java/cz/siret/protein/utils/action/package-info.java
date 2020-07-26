/**
 * Actions must not perform any IO operation. They encapsulate functionality
 * that can be reused by multiple commands. When an action becomes too big,
 * a package should be created for the whole action.
 */
package cz.siret.protein.utils.action;