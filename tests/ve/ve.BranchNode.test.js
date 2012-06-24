module( 've.BranchNode' );

/* Stubs */

ve.BranchNodeStub = function( children ) {
	// Inheritance
	ve.BranchNode.call( this, children );
};

ve.extendClass( ve.BranchNodeStub, ve.BranchNode );

/* Tests */

test( 'getChildren', 2, function() {
	var node1 = new ve.BranchNodeStub(),
		node2 = new ve.BranchNodeStub( [node1] );
	deepEqual( node1.getChildren(), [] );
	deepEqual( node2.getChildren(), [node1] );
} );

test( 'indexOf', 4, function() {
	var node1 = new ve.BranchNodeStub(),
		node2 = new ve.BranchNodeStub(),
		node3 = new ve.BranchNodeStub(),
		node4 = new ve.BranchNodeStub( [node1, node2, node3] );
	strictEqual( node4.indexOf( null ), -1 );
	strictEqual( node4.indexOf( node1 ), 0 );
	strictEqual( node4.indexOf( node2 ), 1 );
	strictEqual( node4.indexOf( node3 ), 2 );
} );

test( 'traverseLeafNodes', 1, function() {
	var fragment = new ve.dm.Document( ve.dm.example.data ),
		docNode = fragment.getDocumentNode(),
		children = docNode.getChildren();
	var tests = [
		// Test 1 & 2
		{
			'node': docNode,
			'output': [
						children[0].children[0],
						children[1].children[0].children[0].children[0].children[0].children[0],
						children[1].children[0].children[0].children[0].children[1].children[0].children[0].children[0],
						children[1].children[0].children[0].children[0].children[1].children[0].children[1].children[0].children[0].children[0],
						children[1].children[0].children[0].children[0].children[2].children[0].children[0].children[0],
						children[2].children[0],
						children[2].children[1],
						children[2].children[2],
						children[3].children[0].children[0].children[0],
						children[3].children[1].children[0].children[0],
						children[4].children[0],
						children[5].children[0]
			],
			'reverse': true,
			'desc': 'Traversing the entire document returns all leaf nodes'
		},
		// Test 3 & 4
		{
			'node': docNode,
			'output': [
						children[0].children[0],
						children[1].children[0].children[0].children[0].children[0].children[0],
						children[1].children[0].children[0].children[0].children[1].children[0].children[0].children[0]
			],
			'reverse': [
						children[5].children[0],
						children[4].children[0],
						children[3].children[1].children[0].children[0],
						children[3].children[0].children[0].children[0],
						children[2].children[2],
						children[2].children[1],
						children[2].children[0],
						children[1].children[0].children[0].children[0].children[2].children[0].children[0].children[0],
						children[1].children[0].children[0].children[0].children[1].children[0].children[1].children[0].children[0].children[0],
						children[1].children[0].children[0].children[0].children[1].children[0].children[0].children[0]
			],
			'callback': function( node ) {
				if ( node === children[1].children[0].children[0].children[0].children[1].children[0].children[0].children[0] ) {
					return false;
				}
			},
			'desc': 'Returning false from the callback stops the traversal'
		},
		// Test 5 & 6
		{
			'node': docNode,
			'output': [
						children[2].children[0],
						children[2].children[1],
						children[2].children[2],
						children[3].children[0].children[0].children[0],
						children[3].children[1].children[0].children[0],
						children[4].children[0],
						children[5].children[0]
			],
			'reverse': [
						children[2].children[0],
						children[1].children[0].children[0].children[0].children[2].children[0].children[0].children[0],
						children[1].children[0].children[0].children[0].children[1].children[0].children[1].children[0].children[0].children[0],
						children[1].children[0].children[0].children[0].children[1].children[0].children[0].children[0],
						children[1].children[0].children[0].children[0].children[0].children[0],
						children[0].children[0]
			],
			'from': children[2].children[0],
			'desc': 'Starting at a leaf node returns that leaf node and everything after it',
			'reverseDesc': 'Starting at a leaf node returns that leaf node and everything before it (in reverse)'
		},
		// Test 7 & 8
		{
			'node': docNode,
			'output': [
						children[1].children[0].children[0].children[0].children[0].children[0],
						children[1].children[0].children[0].children[0].children[1].children[0].children[0].children[0],
						children[1].children[0].children[0].children[0].children[1].children[0].children[1].children[0].children[0].children[0],
						children[1].children[0].children[0].children[0].children[2].children[0].children[0].children[0],
						children[2].children[0],
						children[2].children[1],
						children[2].children[2],
						children[3].children[0].children[0].children[0],
						children[3].children[1].children[0].children[0],
						children[4].children[0],
						children[5].children[0]
			],
			'reverse': [
				children[0].children[0]
			],
			'from': children[1],
			'desc': 'Starting at a non-leaf node returns all leaf nodes inside and after it',
			'reverseDesc': 'Starting at a non-leaf node returns all leaf nodes before it and none inside (in reverse)'
		},
		// Test 9 & 10
		{
			'node': children[1],
			'output': [
						children[1].children[0].children[0].children[0].children[0].children[0],
						children[1].children[0].children[0].children[0].children[1].children[0].children[0].children[0],
						children[1].children[0].children[0].children[0].children[1].children[0].children[1].children[0].children[0].children[0],
						children[1].children[0].children[0].children[0].children[2].children[0].children[0].children[0]
			],
			'reverse': true,
			'desc': 'Calling traverseLeafNodes() on a non-root node only returns leaf nodes inside that node'
		},
		// Test 11
		{
			'node': children[1],
			'from': children[2],
			'exception': /^from parameter passed to traverseLeafNodes\(\) must be a descendant$/,
			'desc': 'Passing a sibling for from results in an exception'
		}
	];
	var count=0;
	for(var t=0;t<tests.length;t++) {
		if(tests[t].hasOwnProperty('reverse')) {
			count++;
		}
		count++;
	}

	expect (count);
	for ( var i = 0; i < tests.length; i++ ) {
		executeTest( tests[i] );
		if ( tests[i].reverse !== undefined ) {
			var reversed = {
				'node': tests[i].node,
				'from': tests[i].from,
				'callback': tests[i].callback,
				'exception': tests[i].exception,
				'isReversed': true,
				'desc': tests[i].reverseDesc || tests[i].desc + ' (in reverse)'
			};
			if ( tests[i].output !== undefined && tests[i].reverse === true ) {
				reversed.output = tests[i].output.reverse();
			} else {
				reversed.output = tests[i].reverse;
			}
			executeTest( reversed );
		}
	}
	
	function executeTest( test ) {
		var	realLeaves = [],
			callback = function( node ) {
				var retval;
				realLeaves.push( node );
				if ( test.callback ) {
					retval = test.callback( node );
					if ( retval !== undefined ) {
						return retval;
					}
				}
			},
			f = function() {
				test.node.traverseLeafNodes( callback, test.from, test.isReversed );
			};
		if ( test.exception ) {
			raises( f, test.exception, test.desc );
		} else {
			f();
			ok( ve.compareArrays( realLeaves, test.output ), test.desc );
		}
	}
} );