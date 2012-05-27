/**
 * ContentEditable node for a definition list item.
 *
 * @class
 * @constructor
 * @extends {ve.ce.BranchNode}
 * @param model {ve.dm.DefinitionListItemNode} Model to observe
 */
ve.ce.DefinitionListItemNode = function( model ) {
	// Inheritance
	ve.ce.BranchNode.call(
		this, 'definitionListItem', model, ve.ce.BranchNode.getDomWrapper( model, 'style' )
	);

	// Events
	this.model.addListenerMethod( this, 'update', 'onUpdate' );
};

/* Static Members */

/**
 * Node rules.
 *
 * @see ve.ce.NodeFactory
 * @static
 * @member
 */
ve.ce.DefinitionListItemNode.rules = {
	'canBeSplit': false
};

/**
 * Mapping of list item style values and DOM wrapper element types.
 *
 * @static
 * @member
 */
ve.ce.DefinitionListItemNode.domWrapperElementTypes = {
	'definition': 'dd',
	'term': 'dt'
};

/* Methods */

/**
 * Responds to model update events.
 *
 * If the style changed since last update the DOM wrapper will be replaced with an appropriate one.
 *
 * @method
 */
ve.ce.DefinitionListItemNode.prototype.onUpdate = function() {
	this.updateDomWrapper( 'style' );
};

/* Registration */

ve.ce.factory.register( 'definitionListItem', ve.ce.DefinitionListItemNode );

/* Inheritance */

ve.extendClass( ve.ce.DefinitionListItemNode, ve.ce.BranchNode );
