/**
 * VisualEditor data model LinkAnnotation class.
 *
 * @copyright 2011-2012 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * DataModel annotation for a link.
 *
 * @class
 * @constructor
 * @extends {ve.dm.Annotation}
 */
ve.dm.LinkAnnotation = function () {
	// Inheritance
	ve.dm.Annotation.call( this );
};

/* Static Members */

/**
 * Converters.
 *
 * @see {ve.dm.Converter}
 * @static
 * @member
 */
ve.dm.LinkAnnotation.converters = {
	'domElementTypes': ['a'],
	'toDomElement': function ( subType, annotation ) {
		var link = document.createElement( 'a' ), key, attributes;
		// Restore html/* attributes
		// TODO this should be done for all annotations, factor this out in the new API
		attributes = annotation.data.htmlAttributes;
		for ( key in attributes ) {
			link.setAttribute( key, attributes[key] );
		}

		link.setAttribute( 'rel', 'mw:' + subType );
		if ( subType === 'WikiLink' || subType === 'SimpleWikiLink') {
			// Set href to /title
			// FIXME article path should be configurable, currently Parsoid always uses '/'
			// FIXME space -> _ is MW-specific
			link.setAttribute( 'href', '/' + annotation.data.title.replace( / /g, '_' ) );
		} else if ( subType === 'ExtLink' || subType === 'NumberedExtLink' || subType === 'UrlLink' ) {
			// Set href directly
			link.setAttribute( 'href', annotation.data.href );
		}
		return link;
	},
	'toDataAnnotation': function ( tag, element ) {
		var rel = element.getAttribute( 'rel' ) || '',
			subType = rel.split( ':' )[1] || 'unknown',
			href = element.getAttribute( 'href' ),
			retval = {
				'type': 'link/' + subType,
				'data': {}
			},
			i, attribute;
		if ( subType === 'WikiLink' || subType === 'SimpleWikiLink' ) {
			// Get title from href by stripping article path
			// FIXME article path should be configurable, currently Parsoid always uses '/'
			// FIXME _ -> space is MW-specific
			retval.data.title = href.replace( /^\//, '' ).replace( /_/g, ' ' );
		} else if ( subType === 'ExtLink' || subType === 'NumberedExtLink' || subType === 'UrlLink' ) {
			retval.data.href = href;
		}

		// Preserve HTML attributes
		// TODO this should be done for all annotations, factor this out in the new API
		retval.data.htmlAttributes = {};
		for ( i = 0; i < element.attributes.length; i++ ) {
			attribute = element.attributes[i];
			retval.data.htmlAttributes[attribute.name] = attribute.value;
		}
		return retval;
	}
};

/* Registration */

ve.dm.annotationFactory.register( 'link', ve.dm.LinkAnnotation );

/* Inheritance */

ve.extendClass( ve.dm.LinkAnnotation, ve.dm.Annotation );
