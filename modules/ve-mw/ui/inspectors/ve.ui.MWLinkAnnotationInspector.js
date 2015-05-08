/*!
 * VisualEditor UserInterface LinkAnnotationInspector class.
 *
 * @copyright 2011-2015 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * Inspector for applying and editing labeled MediaWiki internal and external links.
 *
 * @class
 * @extends ve.ui.LinkAnnotationInspector
 *
 * @constructor
 * @param {Object} [config] Configuration options
 */
ve.ui.MWLinkAnnotationInspector = function VeUiMWLinkAnnotationInspector( config ) {
	// Parent constructor
	ve.ui.MWLinkAnnotationInspector.super.call( this, config );
};

/* Inheritance */

OO.inheritClass( ve.ui.MWLinkAnnotationInspector, ve.ui.LinkAnnotationInspector );

/* Static properties */

ve.ui.MWLinkAnnotationInspector.static.name = 'link';

ve.ui.MWLinkAnnotationInspector.static.modelClasses = [
	ve.dm.MWExternalLinkAnnotation,
	ve.dm.MWInternalLinkAnnotation
];

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.MWLinkAnnotationInspector.prototype.initialize = function () {
	var overlay = this.manager.getOverlay();

	// Properties
	this.allowProtocolInInternal = false;
	this.internalAnnotationInput = new ve.ui.MWInternalLinkAnnotationWidget( {
		// Sub-classes may want to know where to position overlays
		$overlay: overlay ? overlay.$element : this.$frame
	} );
	this.externalAnnotationInput = new ve.ui.MWExternalLinkAnnotationWidget();

	this.linkTypeSelect = new OO.ui.TabSelectWidget( {
		classes: [ 've-ui-mwLinkAnnotationInspector-linkTypeSelect' ],
		items: [
			new OO.ui.TabOptionWidget( { data: 'internal', label: ve.msg( 'visualeditor-linkinspector-button-link-internal' ) } ),
			new OO.ui.TabOptionWidget( { data: 'external', label: ve.msg( 'visualeditor-linkinspector-button-link-external' ) } )
		]
	} );

	// Events
	this.linkTypeSelect.connect( this, { select: 'onLinkTypeSelectSelect' } );
	this.internalAnnotationInput.connect( this, { change: 'onInternalLinkChange' } );

	// Parent method
	ve.ui.MWLinkAnnotationInspector.super.prototype.initialize.call( this );

	// Initialization
	this.form.$element.prepend( this.linkTypeSelect.$element );
};

/**
 * Check if the current input mode is for external links
 *
 * @return {boolean} Input mode is for external links
 */
ve.ui.MWLinkAnnotationInspector.prototype.isExternal = function () {
	var item = this.linkTypeSelect.getSelectedItem();
	return item && item.getData() === 'external';
};

ve.ui.MWLinkAnnotationInspector.prototype.onInternalLinkChange = function ( annotation ) {
	var title,
		href = annotation ? annotation.getAttribute( 'title' ) : '';

	if ( ve.init.platform.getExternalLinkUrlProtocolsRegExp().test( href ) ) {
		// Check if the 'external' link is in fact a page on the same wiki
		// e.g. http://en.wikipedia.org/wiki/Target -> Target
		title = ve.dm.MWInternalLinkAnnotation.static.getTargetDataFromHref(
			href,
			ve.init.target.doc
		).title;
		if ( title !== href ) {
			this.internalAnnotationInput.text.setValue( title );
			return;
		}
	}

	if (
		!this.allowProtocolInInternal &&
		ve.init.platform.getExternalLinkUrlProtocolsRegExp().test( href )
	) {
		this.linkTypeSelect.selectItem( this.linkTypeSelect.getItemFromData( 'external' ) );
	}
};

/**
 * @inheritdoc
 */
ve.ui.MWLinkAnnotationInspector.prototype.createAnnotationInput = function () {
	return this.isExternal() ? this.externalAnnotationInput : this.internalAnnotationInput;
};

/**
 * @inheritdoc
 */
ve.ui.MWLinkAnnotationInspector.prototype.getSetupProcess = function ( data ) {
	return ve.ui.MWLinkAnnotationInspector.super.prototype.getSetupProcess.call( this, data )
		.next( function () {
			this.linkTypeSelect.selectItem(
				this.linkTypeSelect.getItemFromData(
					this.initialAnnotation instanceof ve.dm.MWExternalLinkAnnotation ? 'external' : 'internal'
				)
			);
			this.annotationInput.setAnnotation( this.initialAnnotation );
		}, this );
};

/**
 * @inheritdoc
 */
ve.ui.MWLinkAnnotationInspector.prototype.getTeardownProcess = function ( data ) {
	return ve.ui.MWLinkAnnotationInspector.super.prototype.getTeardownProcess.call( this, data )
		.next( function () {
			this.allowProtocolInInternal = false;
		}, this );
};

/**
 * Handle select events from the linkTypeSelect widget
 *
 * @param {OO.ui.MenuOptionWidget} item Selected item
 */
ve.ui.MWLinkAnnotationInspector.prototype.onLinkTypeSelectSelect = function () {
	var text = this.annotationInput.text.getValue(),
		isExternal = this.isExternal(),
		inputHasProtocol = ve.init.platform.getExternalLinkUrlProtocolsRegExp().test( text );

	this.annotationInput.$element.detach();

	this.annotationInput = this.createAnnotationInput();
	this.form.$element.append( this.annotationInput.$element );

	if ( isExternal ) {
		// If the user switches to external links clear the input, unless the input is URL-like
		if ( !inputHasProtocol ) {
			text = '';
		}
	} else {
		// If the user manually switches to internal links with an external link in the input, remember this
		if ( inputHasProtocol ) {
			this.allowProtocolInInternal = true;
		}
	}

	this.annotationInput.text.setValue( text ).focus();

	if ( !isExternal ) {
		this.annotationInput.text.populateLookupMenu();
	}
};

/**
 * Gets an annotation object from a fragment.
 *
 * The type of link is automatically detected based on some crude heuristics.
 *
 * @method
 * @param {ve.dm.SurfaceFragment} fragment Current selection
 * @returns {ve.dm.MWInternalLinkAnnotation|ve.dm.MWExternalLinkAnnotation|null}
 */
ve.ui.MWLinkAnnotationInspector.prototype.getAnnotationFromFragment = function ( fragment ) {
	var target = fragment.getText(),
		title = mw.Title.newFromText( target );

	// Figure out if this is an internal or external link
	if ( ve.init.platform.getExternalLinkUrlProtocolsRegExp().test( target ) ) {
		// External link
		return new ve.dm.MWExternalLinkAnnotation( {
			type: 'link/mwExternal',
			attributes: {
				href: target
			}
		} );
	} else if ( title ) {
		// Internal link

		if ( title.getNamespaceId() === 6 || title.getNamespaceId() === 14 ) {
			// File: or Category: link
			// We have to prepend a colon so this is interpreted as a link
			// rather than an image inclusion or categorization
			target = ':' + target;
		}

		return new ve.dm.MWInternalLinkAnnotation( {
			type: 'link/mwInternal',
			attributes: {
				title: target,
				// bug 62816: we really need a builder for this stuff
				normalizedTitle: ve.dm.MWInternalLinkAnnotation.static.normalizeTitle( target ),
				lookupTitle: ve.dm.MWInternalLinkAnnotation.static.getLookupTitle( target )
			}
		} );
	} else {
		// Doesn't look like an external link and mw.Title considered it an illegal value,
		// for an internal link.
		return null;
	}
};

/**
 * @inheritdoc
 */
ve.ui.MWLinkAnnotationInspector.prototype.getInsertionData = function () {
	// If this is a new external link, insert an autonumbered link instead of a link annotation (in
	// #getAnnotation we have the same condition to skip the annotating). Otherwise call parent method
	// to figure out the text to insert and annotate.
	if ( this.isExternal() ) {
		return [
			{
				type: 'link/mwNumberedExternal',
				attributes: {
					href: this.annotationInput.getHref()
				}
			},
			{ type: '/link/mwNumberedExternal' }
		];
	} else {
		return ve.ui.MWLinkAnnotationInspector.super.prototype.getInsertionData.call( this );
	}
};

/* Registration */

ve.ui.windowFactory.register( ve.ui.MWLinkAnnotationInspector );
