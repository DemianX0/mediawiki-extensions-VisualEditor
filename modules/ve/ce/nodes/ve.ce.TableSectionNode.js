/**
 * VisualEditor content editable TableSectionNode class.
 *
 * @copyright 2011-2012 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * ContentEditable node for a table section.
 *
 * @class
 * @constructor
 * @extends {ve.ce.BranchNode}
 * @param model {ve.dm.TableSectionNode} Model to observe
 */
ve.ce.TableSectionNode = function( model ) {
	// Inheritance
	ve.ce.BranchNode.call(
		this, 'tableSection', model, ve.ce.BranchNode.getDomWrapper( model, 'style' )
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
ve.ce.TableSectionNode.rules = {
	'canBeSplit': false
};

/**
 * Mapping of list item style values and DOM wrapper element types.
 *
 * @static
 * @member
 */
ve.ce.TableSectionNode.domWrapperElementTypes = {
	'header': 'thead',
	'body': 'tbody',
	'footer': 'tfoot'
};

/* Methods */

/**
 * Responds to model update events.
 *
 * If the style changed since last update the DOM wrapper will be replaced with an appropriate one.
 *
 * @method
 */
ve.ce.TableSectionNode.prototype.onUpdate = function() {
	this.updateDomWrapper( 'style' );
};

/* Registration */

ve.ce.nodeFactory.register( 'tableSection', ve.ce.TableSectionNode );

/* Inheritance */

ve.extendClass( ve.ce.TableSectionNode, ve.ce.BranchNode );
