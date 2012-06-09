/**
 * A very basic parser / serializer web service.
 */

/**
 * Config section
 *
 * Could move this to a separate file later.
 */

// default to en.wikipedia.org
var defaultInterwiki = 'en';
// alternative: default to www.mediawiki.org
//var defaultInterwiki = 'mw';

/**
 * End config section
 */

// global includes
var express = require('express'),
	jsDiff = require('diff'),
	html5 = require('html5');

// local includes
var mp = '../modules/parser/';

var ParserPipelineFactory = require(mp + 'mediawiki.parser.js').ParserPipelineFactory,
	ParserEnv = require(mp + 'mediawiki.parser.environment.js').MWParserEnvironment,
	WikitextSerializer = require(mp + 'mediawiki.WikitextSerializer.js').WikitextSerializer,
	TemplateRequest = require(mp + 'mediawiki.ApiRequest.js').TemplateRequest;

var env = new ParserEnv( { 
	// stay within the 'proxied' content, so that we can click around
	wgScriptPath: '/', //http://en.wikipedia.org/wiki', 
	wgScriptExtension: '.php',
	// XXX: add options for this!
	wgUploadPath: 'http://upload.wikimedia.org/wikipedia/commons',
	fetchTemplates: true,
	// enable/disable debug output using this switch	
	debug: false,
	trace: false,
	maxDepth: 40
} );

// add mediawiki.org
env.addInterwiki( 'mw', 'http://www.mediawiki.org/w' );

// add localhost and make it the default
env.addInterwiki( 'localhost', 'http://localhost/mediawiki' );
defaultInterwiki = 'localhost';

var parserPipelineFactory = new ParserPipelineFactory( env );
//var parser = parserPipelineFactory.makePipeline( 'text/x-mediawiki/full' );


var app = express.createServer();
app.use(express.bodyParser());

app.get('/', function(req, res){
	res.write('<body><h3>Welcome to the alpha test web service for the ' +
		'<a href="http://www.mediawiki.org/wiki/Parsoid">Parsoid project<a>.</h3>');
	res.write( '<p>Usage: <ul><li>GET /title for the DOM. ' +
		'Example: <strong><a href="/Main_Page">Main Page</a></strong>');
	res.write('<li>POST a DOM as parameter "content" to /title for the wikitext</ul>');
	res.write('<p>There are also some tools for experiments:<ul>');
	res.write('<li>Round-trip test pages from the English Wikipedia: ' +
		'<strong><a href="/_rt/Help:Magic">/_rt/Help:Magic</a></strong></li>');
	res.write('<li><strong><a href="/_rtform/">WikiText -&gt; HTML DOM -&gt; WikiText round-trip form</a></strong></li>');
	res.write('<li><strong><a href="/_wikitext/">WikiText -&gt; HTML DOM form</a></strong></li>' +
			'<li><strong><a href="/_html/">HTML DOM -&gt; WikiText form</a></strong></li>');
	res.write('</ul>');
	res.end('<p>We are currently focusing on round-tripping of basic formatting like inline/bold, headings, lists, tables and links. Templates, citations and thumbnails are not expected to round-trip properly yet. <strong>Please report issues you see at <a href="http://www.mediawiki.org/w/index.php?title=Talk:Parsoid/Todo&action=edit&section=new">:mw:Talk:Parsoid/Todo</a>. Thanks!</strong></p>');
});

var htmlSpecialChars = function ( s ) {
	return s.replace(/&/g,'&amp;')
		.replace(/</g,'&lt;')
		.replace(/"/g,'&quot;')
		.replace(/'/g,'&#039;');
};

var textarea = function ( res, content ) {
	res.write('<form method=POST><textarea name="content" cols=90 rows=9>');
	res.write( ( content &&
					htmlSpecialChars( content) ) ||
			'');
	res.write('</textarea><br><input type="submit"></form>');
};



/**
 * Form-based HTML DOM -> wikitext interface for manual testing
 */
app.get(/\/_html\/(.*)/, function(req, res){
	env.pageName = req.params[0];
	res.setHeader('Content-Type', 'text/html; charset=UTF-8');
	res.write( "Your HTML DOM:" );
	textarea( res );
	res.end('');
});
app.post(/\/_html\/(.*)/, function(req, res){
	env.pageName = req.params[0];
	res.setHeader('Content-Type', 'text/html; charset=UTF-8');
	var p = new html5.Parser();
	p.parse( '<html><body>' + req.body.content.replace(/\r/g, '') + '</body></html>' );
	res.write('<pre style="background-color: #efefef">');
	new WikitextSerializer({env: env}).serializeDOM( 
		p.tree.document.childNodes[0].childNodes[1], 
		function( c ) {
			res.write( htmlSpecialChars( c ) );
		});
	res.write('</pre>');
	res.write( "<hr>Your HTML DOM:" );
	textarea( res, req.body.content.replace(/\r/g, '') );
	res.end('');
});

/**
 * Form-based wikitext -> HTML DOM interface for manual testing
 */
app.get(/\/_wikitext\/(.*)/, function(req, res){
	env.pageName = req.params[0];
	res.setHeader('Content-Type', 'text/html; charset=UTF-8');
	res.write( "Your wikitext:" );
	textarea( res );
	res.end('');
});
app.post(/\/_wikitext\/(.*)/, function(req, res){
	env.pageName = req.params[0];
	res.setHeader('Content-Type', 'text/html; charset=UTF-8');
	var parser = parserPipelineFactory.makePipeline( 'text/x-mediawiki/full' );
	parser.on('document', function ( document ) {
		res.write(document.body.innerHTML);
		//res.write('<form method=POST><input name="content"></form>');
		//res.end("hello world\n" + req.method + ' ' + req.params.title);
		res.write( "<hr>Your wikitext:" );
		textarea( res, req.body.content.replace(/\r/g, '') );
		res.end('');
	});
	try {
		res.setHeader('Content-Type', 'text/html; charset=UTF-8');
		console.log('starting parsing of ' + req.params[0]);
		// FIXME: This does not handle includes or templates correctly
		parser.process( req.body.content.replace(/\r/g, '') );
	} catch (e) {
		console.log( e );
		res.write( e );
	}
});

/**
 * Perform word-based diff on a line-based diff. The word-based algorithm is
 * practically unusable for inputs > 5k bytes, so we only perform it on the
 * output of the more efficient line-based diff.
 */
var refineDiff = function( diff ) {
	// Attempt to accumulate consecutive add-delete pairs
	// with short text separating them (short = 2 chars right now)
	//
	// This is equivalent to the <b><i> ... </i></b> minimization
	// to expand range of <b> and <i> tags, except there is no optimal
	// solution except as determined by heuristics ("short text" = <= 2 chars).
	function mergeConsecutiveSegments(wordDiffs) {
		var n        = wordDiffs.length;
		var currIns  = null, currDel = null;
		var newDiffs = [];
		for (var i = 0; i < n; i++) {
			var d    = wordDiffs[i];
			var dVal = d.value;
			if (d.added) {
				// Attempt to accumulate
				if (currIns === null) {
					currIns = d;
				} else {
					currIns.value = currIns.value + dVal;
				}
			} else if (d.removed) {
				// Attempt to accumulate
				if (currDel === null) {
					currDel = d;
				} else {
					currDel.value = currDel.value + dVal;
				}
			} else if (((dVal.length < 4) || !dVal.match(/\s/)) && currIns && currDel) {
				// Attempt to accumulate
				currIns.value = currIns.value + dVal;
				currDel.value = currDel.value + dVal;
			} else {
				// Accumulation ends. Purge!
				if (currIns !== null) {
					newDiffs.push(currIns);
					currIns = null;
				}
				if (currDel !== null) {
					newDiffs.push(currDel);
					currDel = null;
				}
				newDiffs.push(d);
			}
		}

		// Purge buffered diffs
		if (currIns !== null) newDiffs.push(currIns);
		if (currDel !== null) newDiffs.push(currDel);

		return newDiffs;
	}

	var added = null,
		out = [];
	for ( var i = 0, l = diff.length; i < l; i++ ) {
		var d = diff[i];
		if ( d.added ) {
			if ( added ) {
				out.push( added );
			}
			added = d;
		} else if ( d.removed ) {
			if ( added ) {
				var fineDiff = jsDiff.diffChars( d.value, added.value );
				fineDiff = mergeConsecutiveSegments(fineDiff);
				out.push.apply( out, fineDiff );
				added = null;
			} else {
				out.push( d );
			}
		} else {
			if ( added ) {
				out.push( added );
				added = null;
			}
			out.push(d);
		}
	}
	if ( added ) {
		out.push(added);
	}
	return out;
};

var roundTripDiff = function ( req, res, src, document ) {
	res.write('<html><head><style>ins { background: #ff9191; text-decoration: none; } del { background: #99ff7e; text-decoration: none }; </style></head><body>');
	res.write( '<h2>Wikitext parsed to HTML DOM</h2><hr>' );
	res.write(document.body.innerHTML + '<hr>');
	res.write( '<h2>HTML DOM converted back to Wikitext</h2><hr>' );
	var out = new WikitextSerializer({env: env}).serializeDOM( document.body );
	res.write('<pre>' + htmlSpecialChars( out ) + '</pre><hr>');
	res.write( '<h2>Diff between original Wikitext (green) and round-tripped wikitext (red)</h2><hr>' );
	var patch;
	src = src.replace(/\n(?=\n)/g, '\n ');
	out = out.replace(/\n(?=\n)/g, '\n ');
	//console.log(JSON.stringify( jsDiff.diffLines( out, src ) ));
	//patch = jsDiff.convertChangesToXML( jsDiff.diffLines( out, src ) );
	patch = jsDiff.convertChangesToXML( refineDiff( jsDiff.diffLines( src, out ) ) );
	res.write( '<pre>' + patch);
	// Add a 'report issue' link
	res.end('<hr><h2>'+
			'<a style="color: red" ' +
			'href="http://www.mediawiki.org/w/index.php?title=Talk:Parsoid/Todo' +
			'&action=edit&section=new&preloadtitle=' +
			'Issue%20on%20http://parsoid.wmflabs.org' + req.url + '">' +
			'Report a parser issue in this page</a> at ' +
			'<a href="http://www.mediawiki.org/wiki/Talk:Parsoid/Todo">'+
			'[[:mw:Talk:Parsoid/Todo]]</a></h2><hr>');
};

var parse = function ( req, res, cb, src ) {
	var parser = parserPipelineFactory.makePipeline( 'text/x-mediawiki/full' );
	parser.on('document', cb.bind( null, req, res, src ) );
	try {
		res.setHeader('Content-Type', 'text/html; charset=UTF-8');
		parser.process( src );
	} catch (e) {
		console.log( e );
		res.end( e );
	}
};

/**
 * Round-trip article testing
 */
app.get( new RegExp('/_rt/(?:(?:(?:' + env.interwikiRegexp + '):+)?(' + env.interwikiRegexp + '):)?(.*)') , function(req, res){
	env.pageName = req.params[1];
	if ( req.params[0] ) {
		env.wgScriptPath = '/_rt/' + req.params[0] + ':';
		env.wgScript = env.interwikiMap[req.params[0]];
	} else {
		env.wgScriptPath = '/_rt/';
		env.wgScript = env.interwikiMap[defaultInterwiki];
	}

	if ( env.pageName === 'favicon.ico' ) {
		res.end( 'no favicon yet..' );
		return;
	}

	var target = env.resolveTitle( env.normalizeTitle( env.pageName ), '' );
	
	console.log('starting parsing of ' + target);
	var tpr = new TemplateRequest( env, target );
	tpr.once('src', parse.bind( null, req, res, roundTripDiff ));
});

/**
 * Form-based round-tripping for manual testing
 */
app.get(/\/_rtform\/(.*)/, function(req, res){
	env.pageName = req.params[0];
	res.setHeader('Content-Type', 'text/html; charset=UTF-8');
	res.write( "Your wikitext:" );
	textarea( res );
	res.end('');
});
app.post(/\/_rtform\/(.*)/, function(req, res){
	env.pageName = req.params[0];
	res.setHeader('Content-Type', 'text/html; charset=UTF-8');
	var parser = parserPipelineFactory.makePipeline( 'text/x-mediawiki/full' );

	// we don't care about \r, and normalize everything to \n
	parse( req, res, roundTripDiff, req.body.content.replace(/\r/g, ''));
});

/**
 * Regular article parsing
 */
app.get(new RegExp( '/(?:(?:(?:' + env.interwikiRegexp + '):+)?(' + env.interwikiRegexp + '):)?(.*)' ), function(req, res){
	env.pageName = req.params[1];
	if ( req.params[0] ) {
		env.wgScriptPath = '/' + req.params[0] + ':';
		env.wgScript = env.interwikiMap[req.params[0]];
	} else {
		env.wgScriptPath = '/';
		env.wgScript = env.interwikiMap[defaultInterwiki];
	}
	if ( env.pageName === 'favicon.ico' ) {
		res.end( 'no favicon yet..');
		return;
	}
	var target = env.resolveTitle( env.normalizeTitle( env.pageName ), '' );

	console.log('starting parsing of ' + target);
	var tpr = new TemplateRequest( env, target );
	tpr.once('src', parse.bind( null, req, res, function ( req, res, src, document ) {
		res.end(document.body.innerHTML);
	}));
});

/**
 * Regular article serialization using POST
 */
app.post(/\/(.*)/, function(req, res){
	env.pageName = req.params[0];
	env.wgScriptPath = '/';
	res.setHeader('Content-Type', 'text/x-mediawiki; charset=UTF-8');
	var p = new html5.Parser();
	p.parse( req.body.content );
	new WikitextSerializer({env: env}).serializeDOM( 
		p.tree.document.childNodes[0].childNodes[1], 
		res.write.bind( res ) );
	res.end('');
});

module.exports = app;
