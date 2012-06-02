/**
 * DataModel node for a list.
 *
 * @class
 * @constructor
 * @extends {ve.dm.BranchNode}
 * @param {ve.dm.BranchNode[]} [children] Child nodes to attach
 * @param {Object} [attributes] Reference to map of attribute key/value pairs
 */
ve.dm.ListNode = function( children, attributes ) {
	// Inheritance
	ve.dm.BranchNode.call( this, 'list', children, attributes );
};

/* Static Members */

/**
 * Node rules.
 *
 * @see ve.dm.NodeFactory
 * @static
 * @member
 */
ve.dm.ListNode.rules = {
	'isWrapped': true,
	'isContent': false,
	'canContainContent': false,
	'childNodeTypes': ['listItem'],
	'parentNodeTypes': null
};

/**
 * Node converters.
 *
 * @see {ve.dm.Converter}
 * @static
 * @member
 */
ve.dm.ListNode.converters = {
	'tags': ['ul', 'ol'],
	'toHtml': function( type, element ) {
		return element.attributes && ( {
			'bullet': ve.dm.createHtmlElement( 'ul' ),
			'number': ve.dm.createHtmlElement( 'ol' )
		} )[element.attributes['style']];
	},
	'toData': function( tag, element ) {
		return ( {
			'ul': { 'type': 'list', 'attributes': { 'style': 'bullet' } },
			'ol': { 'type': 'list', 'attributes': { 'style': 'number' } }
		} )[tag];
	}
};

/* Registration */

ve.dm.nodeFactory.register( 'list', ve.dm.ListNode );

/* Inheritance */

ve.extendClass( ve.dm.ListNode, ve.dm.BranchNode );
