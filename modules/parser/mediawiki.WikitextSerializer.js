/**
 * Serializes a chunk of tokens or an HTML DOM to MediaWiki's wikitext flavor.
 * 
 * @class
 * @constructor
 * @param options {Object} List of options for serialization
 */
WikitextSerializer = function( options ) {
	this.options = $.extend( {
		// defaults
	}, options || {} );
};

var WSP = WikitextSerializer.prototype;

WSP.defaultOptions = {
	needParagraphLines: false,
	listStack: [],
	lastHandler: null,
	precedingNewlineCount: 0
};

var id = function( v, needParagraphLines ) { 
	return function( state ) { 
		state.needParagraphLines = needParagraphLines; 
		return v; 
	}; 
};

var nlid = function( newlineCount, v ) { 
	return function( state ) { 
		return WSP.getNewLines( state, newlineCount ) + v; 
	}; 
};

WSP._listHandler = function( bullet, state, token ) {
	var bullets, res;
	var stack = state.listStack;
	if (stack.length === 0) {
		bullets = bullet;
		res     = bullets;
	} else {
		var curList = stack[stack.length - 1];
		bullets = curList.bullets + bullet;
		curList.itemCount++;
		if (	// deeply nested list
				curList.itemCount > 2 ||
				// A nested list, not directly after the li
				( curList.itemCount > 1 &&
				! ( state.prevToken.constructor === TagTk && 
					state.prevToken.name === 'li') )) {
			res = bullets;
		} else {
			res = bullet;
		}
	}
	stack.push({ itemCount: 0, bullets: bullets});
	return WSP.getNewLines( state, 1 ) + res;
};

WSP._listEndHandler = function( state, token ) {
	state.listStack.pop();
	// FIXME: insert a newline after a list block is closed (the next token is
	// no list token).
	return '';
};

WSP._listItemHandler = function ( bullet, state, token ) { 
	//console.warn( JSON.stringify( state.listStack ) );
	var stack = state.listStack;
	// state.needParagraphLines = true;
	if (stack.length === 0) {
		return bullet;
	} else {
		var curList = stack[stack.length - 1];
		curList.itemCount++;
		// > 1 ==> consecutive list items
		return ( curList.itemCount > 1 ) ? curList.bullets + bullet : bullet;
	}
};

WSP._serializeTableTag = function ( symbol, optionEndSymbol, newlineCount, state, token ) {
	symbol = WSP.getNewLines( state, newlineCount ) + symbol;
	if ( token.attribs.length ) {
		return symbol + ' ' + 
			WSP._serializeAttributes( token.attribs ) + optionEndSymbol;
	} else {
		return symbol;
	}
};

WSP._emptyTags = { br: true, meta: true };

WSP._serializeHTMLTag = function ( state, token ) {
	var close = '';
	if ( WSP._emptyTags[ token.name ] ) {
		close = '/';
	}
	if ( token.attribs.length ) {
		return '<' + token.name + ' ' + 
			WSP._serializeAttributes( token.attribs ) + close + '>';
	} else {
		return '<' + token.name + close + '>';
	}
};

WSP._serializeHTMLEndTag = function ( state, token ) {
	if ( ! WSP._emptyTags[ token.name ] ) {
		return '</' + token.name + '>';
	} else {
		return '';
	}
};

WSP._linkHandler =  function( state, token ) {
	//return '[[';
	// TODO: handle internal/external links etc using RDFa and dataAttribs
	// Also convert unannotated html links to external wiki links for html
	// import. Might want to consider converting relative links without path
	// component and file extension to wiki links.
	
	var env = state.env;
	var attribDict = env.KVtoHash( token.attribs );
	if ( attribDict.rel && attribDict.href !== undefined ) {
		var tokenData = token.dataAttribs;
		if ( attribDict.rel === 'mw:wikiLink' ) {
			var tail = tokenData.tail,
				target = decodeURIComponent( 
					attribDict.href.substr( env.wgScriptPath.length ) );
			if ( tail && tail.length ) {
				state.dropTail = tail;
				target = tokenData.gc ? tokenData.sHref : target.replace( /_/g, ' ' );
			} else {
				var origHref = tokenData.sHref;
				if (origHref) {
					//console.warn( JSON.stringify( tokenData.sHref ) );
					// SSS FIXME: Why was resolveTitle wrapping this?  Also, why do we require normalizeTitle here?
					var normalizedOrigHref = env.normalizeTitle(env.tokensToString(origHref));
					if ( normalizedOrigHref === target ) {
						// Non-standard capitalization
						target = origHref;
					}
				} else {
					target = target.replace( /_/g, ' ' );
				}
			}

			// FIXME: Properly handle something like [[{{Foo}}]]s
			target = env.tokensToString( target );

			if ( tokenData.gc ) {
				state.dropContent = true;
				return '[[' + target;
			} else {
				return '[[' + target + '|';
			}
		} else if ( attribDict.rel === 'mw:extLink' ) {
			if ( tokenData.stx === 'urllink' ) {
				state.dropContent = true;
				return attribDict.href;
			} else if ( tokenData.gc ) {
				state.dropContent = true;
				return '[' + attribDict.href;
			} else {
				return '[' + attribDict.href + ' ';
			}
		} else {
			return WSP._serializeHTMLTag( state, token );
		}
	} else {
		return WSP._serializeHTMLTag( state, token );
	}
					
	//if ( rtinfo.type === 'wikilink' ) {
	//	return '[[' + rtinfo.target + ']]';
	//} else {
	//	// external link
	//	return '[' + rtinfo.
};
WSP._linkEndHandler =  function( state, token ) {
	var attribDict = state.env.KVtoHash( token.attribs );
	if ( attribDict.rel && attribDict.href !== undefined ) {
		if ( attribDict.rel === 'mw:wikiLink' ) {
			var retVal = "]]" + (token.dataAttribs.tail ? token.dataAttribs.tail : "");
			state.dropContent = false;
			state.dropTail = false;
			return retVal;
		} else if ( attribDict.rel === 'mw:extLink' ) {
			if ( token.dataAttribs.stx === 'urllink' ) {
				state.dropContent = false;
				return '';
			} else {
				state.dropContent = false;
				return ']';
			}
		} else {
			return WSP._serializeHTMLEndTag( state, token );
		}
	} else {
		return WSP._serializeHTMLEndTag( state, token );
	}
};

WSP.tagToWikitext = {
	body: {},
	b: { start: id("'''"), end: id("'''") },
	i: { start: id("''"), end: id("''") },
	ul: { 
		start: WSP._listHandler.bind( null, '*' ),
		end: WSP._listEndHandler 
	},
	ol: { 
		start: WSP._listHandler.bind( null, '#' ),
		end: WSP._listEndHandler
	},
	dl: { 
		start: WSP._listHandler.bind( null, '' ), 
		end: WSP._listEndHandler
	},
	li: { start: WSP._listItemHandler.bind( null, '' ) },
	// XXX: handle single-line vs. multi-line dls etc
	dt: { start: WSP._listItemHandler.bind( null, ';' ) },
	dd: { start: WSP._listItemHandler.bind( null, ":" ) },
	// XXX: handle options
	table: { 
		start: WSP._serializeTableTag.bind(null, "{|", '', 1), 
		end: id("\n|}") 
	},
	tbody: {},
	th: { 
		start: function ( state, token ) {
			if ( token.dataAttribs.stx_v === 'row' ) {
				return WSP._serializeTableTag("!!", ' |', 0, state, token);
			} else {
				return WSP._serializeTableTag( "!", ' |', 1, state, token);
			}
		}
	},
	// XXX: omit for first row in table.
	tr: { 
		start: function ( state, token ) {
			if ( state.prevToken.constructor === TagTk && state.prevToken.name === 'tbody' ) {
				return '';
			} else {
				return WSP._serializeTableTag("|-", '', 1, state, token );
			}
		}
	},
	td: { 
		start: function ( state, token ) {
			if ( token.dataAttribs.stx_v === 'row' ) {
				return WSP._serializeTableTag("||", ' |', 0, state, token);
			} else {
				return WSP._serializeTableTag("|", ' |', 1, state, token);
			}
		}
	},
	caption: { start: WSP._serializeTableTag.bind(null, "|+", ' |', 1) },
	p: { 
		start: function( state, token ) {
			if (state.listStack.length > 0) {
				// SSS FIXME: Other tags that have similar requirements within lists?
				// Paragraphs within lists are not expanded
				return '';
			} else if (state.needParagraphLines) {
				return WSP.getNewLines( state, 2 );
			} else {
				state.needParagraphLines = true;
				return '';
			}
		}
	},
	hr: { start: nlid(1, "----"), end: id("") },
	h1: { start: nlid(1, "="), end: id("=", false) },
	h2: { start: nlid(1, "=="), end: id("==", false) },
	h3: { start: nlid(1, "==="), end: id("===", false) },
	h4: { start: nlid(1, "===="), end: id("====", false) },
	h5: { start: nlid(1, "====="), end: id("=====", false) },
	h6: { start: nlid(1, "======"), end: id("======", false) },
	// XXX: support indent variant instead by registering a newline handler?
	pre: { 
		start: function( state, token ) {
			state.textHandler = function( t ) { return t.replace( /^/g, ' ' ); };
			return '';
		},
		end: function( state, token) { state.textHandler = null; return ''; }
	},
	a: { start: WSP._linkHandler, end: WSP._linkEndHandler },
	meta: { 
		start: function ( state, token ) {
			var argDict = state.env.KVtoHash( token.attribs );
			if ( argDict['typeof'] === 'mw:tag' ) {
				return '<' + argDict.content + '>';
			} else {
				return WSP._serializeHTMLTag( state, token );
			}
		}
	},
	br: { start: nlid(2, "") }
};


WSP._serializeAttributes = function ( attribs ) {
	var out = [];
	for ( var i = 0, l = attribs.length; i < l; i++ ) {
		var kv = attribs[i];
		if (kv.k.length) {
			if ( kv.v.length ) {
				out.push( kv.k + '=' + 
						'"' + kv.v.replace( '"', '&quot;' ) + '"');
			} else {
				out.push( kv.k );
			}
		} else if ( kv.v.length ) {
			// not very likely..
			out.push( kv.v );
		}
	}
	// XXX: round-trip optional whitespace / line breaks etc
	return out.join(' ');
};

WSP._stripFirstNewLines = function ( state, chunk ) {
	while ( chunk !== '' && chunk[0] === '\n' ) {
		chunk = chunk.substr(1);
	}
	if ( chunk !== '' ) {
		state.realChunkCB( chunk );
		state.chunkCB = state.realChunkCB;
	}
};


/**
 * Serialize a chunk of tokens
 */
WSP.serializeTokens = function( tokens, chunkCB ) {
	var state = $.extend({}, this.defaultOptions, this.options),
		i, l;
	state.chunkCB = WSP._stripFirstNewLines.bind( this, state );
	if ( chunkCB === undefined ) {
		var out = [];
		state.realChunkCB = out.push.bind(out);
		for ( i = 0, l = tokens.length; i < l; i++ ) {
			this._serializeToken( state, tokens[i] );
		}
		return out;
	} else {
		state.realChunkCB = chunkCB;
		for ( i = 0, l = tokens.length; i < l; i++ ) {
			this._serializeToken( state, tokens[i] );
		}
	}
};

WSP.getNewLines = function ( state, n ) {
	var out = '';
	while ( state.precedingNewlineCount < n ) {
		out += '\n';
		n--;
	}
	return out;
};

WSP.defaultHTMLTagHandler = { 
	start: WSP._serializeHTMLTag, 
	end  : WSP._serializeHTMLEndTag 
};

WSP.getTokenHandler = function(state, token) {
	if (token.dataAttribs.stx === 'html') return this.defaultHTMLTagHandler;

	var tname = token.name;
	if (tname === "p" && state.listStack.length > 0) {
		// We dont want paragraphs in list context expanded.
		// Retain them as html tags.
		//
		// SSS FIXME: any other cases like this?
		return this.defaultHTMLTagHandler;
	} else {
		var handler = this.tagToWikitext[tname];
		return handler ? handler : this.defaultHTMLTagHandler;
	}
};

/**
 * Serialize a token.
 */
WSP._serializeToken = function ( state, token ) {
	state.prevToken = state.curToken;
	state.curToken = token;
	var handler, 
		res,
		dropContent = state.dropContent;
	//console.warn( 'st: ' + JSON.stringify( token ) );
	switch( token.constructor ) {
		case TagTk:
		case SelfclosingTagTk:
			handler = WSP.getTokenHandler(state, token);
			res = handler.start ? handler.start( state, token ) : '';
			break;
		case EndTagTk:
			handler = WSP.getTokenHandler(state, token);
			res = handler.end ? handler.end( state, token ) : '';
			break;
		case String:
			res = state.textHandler ? state.textHandler( token ) : token;
			break;
		case CommentTk:
			res = '<!--' + token.value + '-->';
			break;
		case NlTk:
			res = '\n';
			break;
		case EOFTk:
			res = '';
			break;
		default:
			res = '';
			console.warn( 'Unhandled token type ' + JSON.stringify( token ) );
			break;
	}
	//console.warn( 'res: ' + JSON.stringify( res ) );
	if (res !== '') {
		var nls = res.match( /(?:\r?\n)+$/ );
		if ( nls ) {
			if ( nls[0] === res ) {
				// completely newlines, continue counting..
				state.precedingNewlineCount += res.length;
			} else {
				// reset to new newline count
				state.precedingNewlineCount = res.length;
			}
		} else {
			// no trailing newlines at all
			state.precedingNewlineCount = 0;
		}
		if ( ! dropContent || ! state.dropContent ) {
			// FIXME: This might modify not just the last content token in a
			// link, which would be wrong. We'll likely have to collect tokens
			// between a tags instead, and strip only the last content token.
			if (state.dropTail && res.substr(- state.dropTail.length) === state.dropTail) {
				res = res.substr(0, res.length - state.dropTail.length);
			}
			state.chunkCB( res );
		}
	}
};

/**
 * Serialize an HTML DOM document.
 */
WSP.serializeDOM = function( node, chunkCB ) {
	var state = $.extend({}, this.defaultOptions, this.options);
	//console.warn( node.innerHTML );
	state.chunkCB = this._stripFirstNewLines.bind( this, state );
	if ( ! chunkCB ) {
		var out = [];
		state.realChunkCB = out.push.bind( out );
		this._serializeDOM( node, state );
		return out.join('');
	} else {
		state.realChunkCB = chunkCB;
		this._serializeDOM( node, state );
	}
};

/**
 * Internal worker. Recursively serialize a DOM subtree by creating tokens and
 * calling _serializeToken on each of these.
 */
WSP._serializeDOM = function( node, state ) {
	// serialize this node
	switch( node.nodeType ) {
		case Node.ELEMENT_NODE:
			//console.warn( node.nodeName.toLowerCase() );
			var children = node.childNodes,
				name = node.nodeName.toLowerCase(),
				tkAttribs = this._getDOMAttribs(node.attributes),
				tkRTInfo = this._getDOMRTInfo(node.attributes);

			this._serializeToken( state, 
					new TagTk( name, tkAttribs, tkRTInfo ) );
			for ( var i = 0, l = children.length; i < l; i++ ) {
				// serialize all children
				this._serializeDOM( children[i], state );
			}
			this._serializeToken( state, 
					new EndTagTk( name, tkAttribs, tkRTInfo ) );
			break;
		case Node.TEXT_NODE:
			this._serializeToken( state, node.data );
			break;
		case Node.COMMENT_NODE:
			this._serializeToken( state, new CommentTk( node.data ) );
			break;
		default:
			console.warn( "Unhandled node type: " + 
					node.outerHTML );
			break;
	}
};

WSP._getDOMAttribs = function( attribs ) {
	// convert to list fo key-value pairs
	var out = [];
	for ( var i = 0, l = attribs.length; i < l; i++ ) {
		var attrib = attribs.item(i);
		if ( attrib.name !== 'data-mw' ) {
			out.push( { k: attrib.name, v: attrib.value } );
		}
	}
	return out;
};

WSP._getDOMRTInfo = function( attribs ) {
	if ( attribs['data-mw'] ) {
		return JSON.parse( attribs['data-mw'].value || '{}' );
	} else {
		return {};
	}
};

// Quick HACK: define Node constants locally
// https://developer.mozilla.org/en/nodeType
var Node = {
	ELEMENT_NODE: 1,
    ATTRIBUTE_NODE: 2,
    TEXT_NODE: 3,
    CDATA_SECTION_NODE: 4,
    ENTITY_REFERENCE_NODE: 5,
    ENTITY_NODE: 6,
    PROCESSING_INSTRUCTION_NODE: 7,
    COMMENT_NODE: 8,
    DOCUMENT_NODE: 9,
    DOCUMENT_TYPE_NODE: 10,
    DOCUMENT_FRAGMENT_NODE: 11,
    NOTATION_NODE: 12
};


if (typeof module == "object") {
	module.exports.WikitextSerializer = WikitextSerializer;
}
