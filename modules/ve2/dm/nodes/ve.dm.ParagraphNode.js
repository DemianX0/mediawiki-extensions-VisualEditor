/**
 * DataModel node for a paragraph.
 *
 * @class
 * @constructor
 * @extends {ve.dm.BranchNode}
 * @param {ve.dm.LeafNode[]} [children] Child nodes to attach
 * @param {Object} [attributes] Reference to map of attribute key/value pairs
 */
ve.dm.ParagraphNode = function( children, attributes ) {
	// Inheritance
	ve.dm.BranchNode.call( this, 'paragraph', children, attributes );
};

/* Static Members */

/**
 * Node rules.
 *
 * @see ve.dm.NodeFactory
 * @static
 * @member
 */
ve.dm.ParagraphNode.rules = {
	'isWrapped': true,
	'isContent': false,
	'canContainContent': true,
	'childNodeTypes': null,
	'parentNodeTypes': null
};

/**
 * Node converters.
 *
 * @see {ve.dm.Converter}
 * @static
 * @member
 */
ve.dm.ParagraphNode.converters = {
	'tags': 'p',
	'toHtml': function( type, element ) {
		return ve.dm.createHtmlElement( 'p' );
	},
	'toData': function( tag, element ) {
		return { 'type': 'paragraph' };
	}
};

/* Registration */

ve.dm.nodeFactory.register( 'paragraph', ve.dm.ParagraphNode );

/* Inheritance */

ve.extendClass( ve.dm.ParagraphNode, ve.dm.BranchNode );
