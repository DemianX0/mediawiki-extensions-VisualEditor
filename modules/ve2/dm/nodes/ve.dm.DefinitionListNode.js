/**
 * DataModel node for a definition list.
 *
 * @class
 * @constructor
 * @extends {ve.dm.BranchNode}
 * @param {ve.dm.BranchNode[]} [children] Child nodes to attach
 * @param {Object} [attributes] Reference to map of attribute key/value pairs
 */
ve.dm.DefinitionListNode = function( children, attributes ) {
	// Inheritance
	ve.dm.BranchNode.call( this, 'definitionList', children, attributes );
};

/* Static Members */

/**
 * Node rules.
 *
 * @see ve.dm.NodeFactory
 * @static
 * @member
 */
ve.dm.DefinitionListNode.rules = {
	'isWrapped': true,
	'isContent': false,
	'canContainContent': false,
	'childNodeTypes': ['definitionListItem'],
	'parentNodeTypes': null
};

/**
 * Node converters.
 *
 * @see {ve.dm.Converter}
 * @static
 * @member
 */
ve.dm.DefinitionListNode.converters = {
	'tags': ['dt', 'dd'],
	'toHtml': function( type, element ) {
		return element.attributes && ( {
			'term': ve.dm.createHtmlElement( 'dt' ),
			'definition': ve.dm.createHtmlElement( 'dd' )
		} )[element.attributes['style']];
	},
	'toData': function( tag, element ) {
		return ( {
			'dt': { 'type': 'definitionList', 'attributes': { 'style': 'term' } },
			'dd': { 'type': 'definitionList', 'attributes': { 'style': 'definition' } }
		} )[tag];
	}
};

/* Registration */

ve.dm.nodeFactory.register( 'definitionList', ve.dm.DefinitionListNode );

/* Inheritance */

ve.extendClass( ve.dm.DefinitionListNode, ve.dm.BranchNode );
