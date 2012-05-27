module( 've.dm.Node' );

/* Stubs */

ve.dm.NodeStub = function( length, attributes ) {
	// Inheritance
	ve.dm.Node.call( this, 'stub', length, attributes );
};

ve.dm.NodeStub.rules = {
	'isWrapped': true,
	'isContent': true,
	'canContainContent': false,
	'childNodeTypes': []
};

ve.extendClass( ve.dm.NodeStub, ve.dm.Node );

ve.dm.factory.register( 'stub', ve.dm.NodeStub );

/* Tests */

test( 'canHaveChildren', 1, function() {
	var node = new ve.dm.NodeStub();
	equal( node.canHaveChildren(), false );
} );

test( 'canHaveGrandchildren', 1, function() {
	var node = new ve.dm.NodeStub();
	equal( node.canHaveGrandchildren(), false );
} );

test( 'getLength', 2, function() {
	var node1 = new ve.dm.NodeStub(),
		node2 = new ve.dm.NodeStub( 1234 );
	strictEqual( node1.getLength(), 0 );
	strictEqual( node2.getLength(), 1234 );
} );

test( 'getOuterLength', 2, function() {
	var node1 = new ve.dm.NodeStub(),
		node2 = new ve.dm.NodeStub( 1234 );
	strictEqual( node1.getOuterLength(), 2 );
	strictEqual( node2.getOuterLength(), 1236 );
} );

test( 'setLength', 2, function() {
	var node = new ve.dm.NodeStub();
	node.setLength( 1234 );
	strictEqual( node.getLength(), 1234 );
	raises(
		function() {
			// Length can not be negative
			node.setLength( -1 );
		},
		/^Length cannot be negative$/,
		'throws exception if length is negative'
	);
} );

test( 'adjustLength', 1, function() {
	var node = new ve.dm.NodeStub( 1234 );
	node.adjustLength( 5678 );
	strictEqual( node.getLength(), 6912 );
} );

test( 'getAttribute', 2, function() {
	var node = new ve.dm.NodeStub( 0, { 'a': 1, 'b': 2 } );
	strictEqual( node.getAttribute( 'a' ), 1 );
	strictEqual( node.getAttribute( 'b' ), 2 );
} );

test( 'setRoot', 1, function() {
	var node1 = new ve.dm.NodeStub(),
		node2 = new ve.dm.NodeStub();
	node1.setRoot( node2 );
	strictEqual( node1.getRoot(), node2 );
} );

test( 'attach', 2, function() {
	var node1 = new ve.dm.NodeStub(),
		node2 = new ve.dm.NodeStub();
	node1.attach( node2 );
	strictEqual( node1.getParent(), node2 );
	strictEqual( node1.getRoot(), node2 );
} );

test( 'detach', 2, function() {
	var node1 = new ve.dm.NodeStub(),
		node2 = new ve.dm.NodeStub();
	node1.attach( node2 );
	node1.detach();
	strictEqual( node1.getParent(), null );
	strictEqual( node1.getRoot(), node1 );
} );

