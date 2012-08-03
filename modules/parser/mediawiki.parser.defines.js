/**
 * Constructors for different token types. Plain text is represented as simple
 * strings or String objects (if attributes are needed).
 */

var async = require('async');
var Util = require('./mediawiki.Util.js').Util;

/* -------------------- TagTk -------------------- */
function TagTk( name, attribs, dataAttribs ) { 
	this.name = name;
	this.attribs = attribs || [];
	this.dataAttribs = dataAttribs || {};
}

TagTk.prototype = {};

TagTk.prototype.constructor = TagTk;

TagTk.prototype.toJSON = function () {
	return $.extend( { type: 'TagTk' }, this );
};

TagTk.prototype.defaultToString = function(t) {
	return "<" + this.name + ">";
};

TagTk.prototype.tagToStringFns = {
	"listItem": function() {
		return "<li:" + this.bullets.join('') + ">";
	},
	"mw-quote": function() {
		return "<mw-quote:" + this.value + ">";
	},
	"urllink": function() {
		return "<urllink:" + this.attribs[0].v + ">";
	},
	"behavior-switch": function() {
		return "<behavior-switch:" + this.attribs[0].v + ">";
	}
};

TagTk.prototype.toString = function() {
	if (this.dataAttribs.stx && this.dataAttribs.stx === "html") {
		return "<HTML:" + this.name + ">";
	} else {
		var f = this.tagToStringFns[this.name];
		return f ? f.bind(this)() : this.defaultToString();
	}
};

/* -------------------- EndTagTk -------------------- */
function EndTagTk( name, attribs, dataAttribs ) { 
	this.name = name;
	this.attribs = attribs || [];
	this.dataAttribs = dataAttribs || {};
}

EndTagTk.prototype = {};

EndTagTk.prototype.constructor = EndTagTk;

EndTagTk.prototype.toJSON = function () {
	return $.extend( { type: 'EndTagTk' }, this );
};

EndTagTk.prototype.toString = function() {
	if (this.dataAttribs.stx && this.dataAttribs.stx === "html") {
		return "</HTML:" + this.name + ">";
	} else {
		return "</" + this.name + ">";
	}
};

/* -------------------- SelfclosingTagTk -------------------- */
function SelfclosingTagTk( name, attribs, dataAttribs ) { 
	this.name = name;
	this.attribs = attribs || [];
	this.dataAttribs = dataAttribs || {};
}

SelfclosingTagTk.prototype = {};

SelfclosingTagTk.prototype.constructor = SelfclosingTagTk;

SelfclosingTagTk.prototype.toJSON = function () {
	return $.extend( { type: 'SelfclosingTagTk' }, this );
};

SelfclosingTagTk.prototype.multiTokenArgToString = function(key, arg, indent, indentIncrement) {
	var newIndent = indent + indentIncrement;
	var present = true;
	var toks    = Util.toStringTokens(arg, newIndent);
	var str     = toks.join("\n" + newIndent);

	if (toks.length > 1 || str[0] === '<') {
		str = [key, ":{\n", newIndent, str, "\n", indent, "}"].join('');
	} else {
		present = (str !== '');
	}

	return {present: present, str: str};
},

SelfclosingTagTk.prototype.attrsToString = function(indent, indentIncrement, startAttrIndex) {
	var buf = [];
	for (var i = startAttrIndex, n = this.attribs.length; i < n; i++) {
		var a = this.attribs[i];
		var kVal = this.multiTokenArgToString("k", a.k, indent, indentIncrement);
		var vVal = this.multiTokenArgToString("v", a.v, indent, indentIncrement);

		if (kVal.present && vVal.present) {
			buf.push([kVal.str, "=", vVal.str].join(''));
		} else {
			if (kVal.present) buf.push(kVal.str);
			if (vVal.present) buf.push(vVal.str);
		}
	}

	return buf.join("\n" + indent + "|");
};

SelfclosingTagTk.prototype.defaultToString = function(compact, indent) {
	if (compact) {
		var buf = "<" + this.name + ">:";
		var attr0 = this.attribs[0];
		return attr0 ? buf + Util.toStringTokens(attr0.k, "\n") : buf;
	} else {
		if (!indent) indent = "";
		var origIndent = indent;
		var indentIncrement = "  ";
		indent = indent + indentIncrement;
		return ["<", this.name, ">(\n", indent, this.attrsToString(indent, indentIncrement, 0), "\n", origIndent, ")"].join('');
	}
};

SelfclosingTagTk.prototype.tagToStringFns = { 
	"extlink": function(compact, indent) {
		var href    = Util.kvTokensToString(Util.lookupKV(this.attribs, 'href').v);
		if (compact) {
			return ["<extlink:", href, ">"].join('');
		} else {
			if (!indent) indent = "";
			var origIndent = indent;
			var indentIncrement = "  ";
			indent = indent + indentIncrement;
			var content = Util.lookupKV(this.attribs, 'content').v;
			content = this.multiTokenArgToString("v", content, indent, indentIncrement).str;
			return ["<extlink>(\n", indent, 
					"href=", href, "\n", indent, 
					"content=", content, "\n", origIndent, 
					")"].join('');
		}
	},

	"wikilink": function(compact, indent) {
		if (!indent) indent = "";
		var href = Util.kvTokensToString(Util.lookupKV(this.attribs, 'href').v);
		if (compact) {
			return ["<wikilink:", href, ">"].join('');
		} else {
			if (!indent) indent = "";
			var origIndent = indent;
			var indentIncrement = "  ";
			indent = indent + indentIncrement;
			var tail = Util.lookupKV(this.attribs, 'tail').v;
			var content = this.attrsToString(indent, indentIncrement, 2);
			return ["<wikilink>(\n", indent, 
					"href=", href, "\n", indent, 
					"tail=", tail, "\n", indent,
					"content=", content, "\n", origIndent, 
					")"].join('');
		}
	}
};

SelfclosingTagTk.prototype.toString = function(compact, indent) {
	if (this.dataAttribs.stx && this.dataAttribs.stx === "html") {
		return "<HTML:" + this.name + " />";
	} else {
		var f = this.tagToStringFns[this.name];
		return f ? f.bind(this)(compact, indent) : this.defaultToString(compact, indent);
	}
};

/* -------------------- NlTk -------------------- */
function NlTk( ) { }

NlTk.prototype = {
	constructor: NlTk,

	toJSON: function () {
		return $.extend( { type: 'NlTk' }, this );
	},

	toString: function() {
		return "\\n";
	}
};

/* -------------------- CommentTk -------------------- */
function CommentTk( value, dataAttribs ) { 
	this.value = value;
	// won't survive in the DOM, but still useful for token serialization
	if ( dataAttribs !== undefined ) {
		this.dataAttribs = dataAttribs;
	}
}

CommentTk.prototype = {
	constructor: CommentTk,

	toJSON: function () {
		return $.extend( { type: 'COMMENT' }, this );
	},

	toString: function() {
		return "<!--" + this.value + "-->";
	}
};

/* -------------------- EOFTk -------------------- */
function EOFTk( ) { }
EOFTk.prototype = {
	constructor: EOFTk,

	toJSON: function () {
		return $.extend( { type: 'EOFTk' }, this );
	},

	toString: function() {
		return "";
	}
};


/* -------------------- KV -------------------- */
// A key-value pair
function KV ( k, v ) {
	this.k = k;
	this.v = v;
}



/* -------------------- Params -------------------- */
/**
 * A parameter object wrapper, essentially an array of key/value pairs with a
 * few extra methods.
 *
 * It might make sense to wrap array results of array methods such as slice
 * into a params object too, so that users are not surprised by losing the
 * custom methods. Alternatively, the object could be made more abstract with
 * a separate .array method that just returns the plain array.
 */
function Params ( env, params ) {
	this.env = env;
	this.push.apply( this, params );
}

Params.prototype = [];

Params.prototype.constructor = Params;

Params.prototype.toString = function () {
	return this.slice(0).toString();
};

Params.prototype.dict = function () {
	var res = {};
	for ( var i = 0, l = this.length; i < l; i++ ) {
		var kv = this[i],
			key = this.env.tokensToString( kv.k ).trim();
		res[key] = kv.v;
	}
	//console.warn( 'KVtoHash: ' + JSON.stringify( res ));
	return res;
};

Params.prototype.named = function () {
	var n = 1,
		out = {};
	for ( var i = 0, l = this.length; i < l; i++ ) {
		// FIXME: Also check for whitespace-only named args!
		var k = this[i].k;
		if ( k.constructor === String ) {
			k = k.trim();
		}
		if ( ! k.length ) {
			out[n.toString()] = this[i].v;
			n++;
		} else if ( k.constructor === String ) {
			out[k] = this[i].v;
		} else {
			out[this.env.tokensToString( k ).trim()] = this[i].v;
		}
	}
	return out;
};

/**
 * Expand a slice of the parameters using the supplied get options.
 */
Params.prototype.getSlice = function ( options, start, end ) {
	var args = this.slice( start, end ),
		cb = options.cb;
	//console.warn( JSON.stringify( args ) );
	async.map( 
			args,
			function( kv, cb2 ) {
				if ( kv.v.constructor === String ) {
					// nothing to do
					cb2( null, kv );
				} else if ( kv.v.constructor === Array &&
					// remove String from Array
					kv.v.length === 1 && kv.v[0].constructor === String ) {
						cb2( null, new KV( kv.k, kv.v[0] ) );
				} else {
					// Expand the value
					var o2 = $.extend( {}, options );
					// add in the key
					o2.cb = function ( v ) {
						cb2( null, new KV( kv.k, v ) );
					};
					kv.v.get( o2 );
				}
			},
			function( err, res ) {
				if ( err ) {
					console.trace();
					throw JSON.stringify( err );
				}
				//console.warn( 'getSlice res: ' + JSON.stringify( res ) );
				cb( res );
			});
};

/* -------------------- ParserValue -------------------- */
/**
 * A chunk. Wraps a source chunk of tokens with a reference to a frame for
 * lazy and shared transformations. Do not use directly- use
 * frame.newParserValue instead!
 */
function ParserValue ( source, frame ) {
	if ( source.constructor === ParserValue ) {
		Object.defineProperty( this, 'source', 
				{ value: source.source, enumerable: false } );
	} else {
		Object.defineProperty( this, 'source', 
				{ value: source, enumerable: false } );
	}
	Object.defineProperty( this, 'frame', 
			{ value: frame, enumerable: false } );
}

ParserValue.prototype = {};

ParserValue.prototype._defaultTransformOptions = {
	type: 'text/x-mediawiki/expanded'
};

ParserValue.prototype.toJSON = function() {
	return this.source;
};

ParserValue.prototype.get = function( options, cb ) {
	if ( ! options ) {
		options = $.extend({}, this._defaultTransformOptions);
	} else if ( options.type === undefined ) {
		options.type = this._defaultTransformOptions.type;
	}

	// convenience cb override for async-style functions that pass a cb as the
	// last argument
	if ( cb === undefined ) {
		cb = options.cb;
	}

	var maybeCached;
	var source = this.source;
	if ( source.constructor === String ) {
		maybeCached = source;
	} else {
		// try the cache
		maybeCached = source.cache && source.cache.get( this.frame, options );
	}
	if ( maybeCached !== undefined ) {
		if ( cb ) {
			cb ( maybeCached );
		} else {
			return maybeCached;
		}
	} else {
		if ( ! options.cb ) {
			console.trace();
			throw "Chunk.get: Need to expand asynchronously, but no cb provided! " +
				JSON.stringify( this, null, 2 );
		}
		options.cb = cb;
		this.frame.expand( source, options );
	}
};

ParserValue.prototype.length = function () {
	return this.source.length;
};


// TODO: don't use globals!
if (typeof module == "object") {
	module.exports = {};
	global.TagTk = TagTk;
	global.EndTagTk = EndTagTk;
	global.SelfclosingTagTk = SelfclosingTagTk;
	global.NlTk = NlTk;
	global.CommentTk = CommentTk;
	global.EOFTk = EOFTk;
	global.KV = KV;
	global.Params = Params;
	global.ParserValue = ParserValue;
}
