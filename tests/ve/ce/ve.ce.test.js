/**
 * VisualEditor content editable tests.
 *
 * @copyright 2011-2012 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

module( 've.ce' );

/* Tests */

test( 'whitespacePattern', 4, function( assert ) {
	assert.equal( 'a b'.match( ve.ce.whitespacePattern ), ' ', 'matches spaces' );
	assert.equal( 'a\u00A0b'.match( ve.ce.whitespacePattern ), '\u00A0', 'matches non-breaking spaces' );
	assert.equal( 'a\tb'.match( ve.ce.whitespacePattern ), null, 'does not match tab' );
	assert.equal( 'ab'.match( ve.ce.whitespacePattern ), null, 'does not match non-whitespace' );
} );

test( 'getDOMText', 1, function( assert ) {
	assert.equal( ve.ce.getDomText(
		$( '<span>a<b><a href="#">b</a></b><span></span><i>c</i>d</span>' )[0] ),
		'abcd'
	);
} );

test( 'getDOMHash', 1, function( assert ) {
	assert.equal(
		ve.ce.getDomHash( $( '<span>a<b><a href="#">b</a></b><span></span><i>c</i>d</span>' )[0] ),
		'<SPAN>#<B><A>#</A></B><SPAN></SPAN><I>#</I>#</SPAN>'
	);
} );
