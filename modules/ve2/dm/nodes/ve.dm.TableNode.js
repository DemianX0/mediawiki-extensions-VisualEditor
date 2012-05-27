/**
 * DataModel node for a table.
 *
 * @class
 * @constructor
 * @extends {ve.dm.BranchNode}
 * @param {ve.dm.BranchNode[]} [children] Child nodes to attach
 * @param {Object} [attributes] Reference to map of attribute key/value pairs
 */
ve.dm.TableNode = function( children, attributes ) {
	// Inheritance
	ve.dm.BranchNode.call( this, 'table', children, attributes );
};

/* Static Members */

/**
 * Node rules.
 *
 * @see ve.dm.NodeFactory
 * @static
 * @member
 */
ve.dm.TableNode.rules = {
	'isWrapped': true,
	'isContent': false,
	'canContainContent': false,
	'childNodeTypes': ['tableRow'],
	'parentNodeTypes': null
};

/* Registration */

ve.dm.factory.register( 'table', ve.dm.TableNode );

/* Inheritance */

ve.extendClass( ve.dm.TableNode, ve.dm.BranchNode );
