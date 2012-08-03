/**
 * VisualEditor Node tests.
 *
 * @copyright 2011-2012 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

module( 've.Node' );

/* Stubs */

ve.NodeStub = function() {
	// Inheritance
	ve.Node.call( this, 'stub' );
};

ve.extendClass( ve.NodeStub, ve.Node );
 
/* Tests */

test( 'getType', 1, function( assert ) {
	var node = new ve.NodeStub();
	assert.strictEqual( node.getType(), 'stub' );
} );

test( 'getParent', 1, function( assert ) {
	var node = new ve.NodeStub();
	assert.strictEqual( node.getParent(), null );
} );

test( 'getRoot', 1, function( assert ) {
	var node = new ve.NodeStub();
	assert.strictEqual( node.getRoot(), node );
} );
