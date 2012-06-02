/**
 * DataModel transaction processor.
 *
 * This class reads operations from a transaction and applies them one by one. It's not intended
 * to be used directly; use the static functions ve.dm.TransactionProcessor.commit() and .rollback()
 * instead.
 *
 * NOTE: Instances of this class are not recyclable: you can only call .process() on them once.
 *
 * @class
 * @constructor
 */
ve.dm.TransactionProcessor = function( doc, transaction, reversed ) {
	// Properties
	this.document = doc;
	this.operations = transaction.getOperations();
	this.synchronizer = new ve.dm.DocumentSynchronizer( doc );
	this.reversed = reversed;
	/*
	 * Linear model offset that we're currently at. Operations in the transaction are ordered, so
	 * the cursor only ever moves forward.
	 */
	this.cursor = 0;
	/*
	 * Set and clear are lists of annotations which should be added or removed to content being
	 * inserted or retained. The format of these objects is { hash: annotationObjectReference }
	 * where hash is the result of ve.getHash( annotationObjectReference ).
	 */
	this.set = {};
	this.clear = {};
};

/* Static methods */

/**
 * Commit a transaction to a document.
 *
 * @param {ve.dm.Document} doc Document object to apply the transaction to
 * @param {ve.dm.Transaction} transaction Transaction to apply
 */
ve.dm.TransactionProcessor.commit = function( doc, transaction ) {
	new ve.dm.TransactionProcessor( doc, transaction, false ).process();
};

/**
 * Roll back a transaction; this applies the transaction to the document in reverse.
 *
 * @param {ve.dm.Document} doc Document object to apply the transaction to
 * @param {ve.dm.Transaction} transaction Transaction to apply
 */
ve.dm.TransactionProcessor.rollback = function( doc, transaction ) {
	new ve.dm.TransactionProcessor( doc, transaction, true ).process();
};

/* Methods */

ve.dm.TransactionProcessor.prototype.nextOperation = function() {
	return this.operations[this.operationIndex++] || false;
};

/**
 * Executes an operation.
 *
 * @param {Object} op Operation object to execute
 * @throws 'Invalid operation error. Operation type is not supported'
 */
ve.dm.TransactionProcessor.prototype.executeOperation = function( op ) {
	if ( op.type in this ) {
		this[op.type]( op );
	} else {
		throw 'Invalid operation error. Operation type is not supported: ' + operation.type;
	}
};

/**
 * Processes all operations.
 *
 * When all operations are done being processed, the document will be synchronized.
 */
ve.dm.TransactionProcessor.prototype.process = function() {
	var op;
	// This loop is factored this way to allow operations to be skipped over or executed
	// from within other operations
	this.operationIndex = 0;
	while ( ( op = this.nextOperation() ) ) {
		this.executeOperation( op );
	}
	this.synchronizer.synchronize();
};

/**
 * Apply the current annotation stacks. This will set all annotations in this.set and clear all
 * annotations in this.clear on the data between the offsets this.cursor and this.cursor + to
 *
 * @param {Number} to Offset to stop annotating at. Annotating starts at this.cursor
 * @throws 'Invalid transaction, can not annotate a branch element'
 * @throws 'Invalid transaction, annotation to be set is already set'
 * @throws 'Invalid transaction, annotation to be cleared is not set'
 */
ve.dm.TransactionProcessor.prototype.applyAnnotations = function( to ) {
	if ( ve.isEmptyObject( this.set ) && ve.isEmptyObject( this.clear ) ) {
		return;
	}
	var item,
		element,
		annotated,
		annotations,
		hash,
		empty;
	for ( var i = this.cursor; i < to; i++ ) {
		item = this.document.data[i];
		element = item.type !== undefined;
		if ( element && ve.dm.nodeFactory.canNodeHaveChildren( item.type ) ) {
			throw 'Invalid transaction, can not annotate a branch element';
		}
		annotated = element ? 'annotations' in item : ve.isArray( item );
		annotations = annotated ? ( element ? item.annotations : item[1] ) : {};
		// Set and clear annotations
		for ( hash in this.set ) {
			if ( hash in annotations ) {
				throw 'Invalid transaction, annotation to be set is already set';
			}
			annotations[hash] = this.set[hash];
		}
		for ( hash in this.clear ) {
			if ( !( hash in annotations ) ) {
				throw 'Invalid transaction, annotation to be cleared is not set';
			}
			delete annotations[hash];
		}
		// Auto initialize/cleanup
		if ( !ve.isEmptyObject( annotations ) && !annotated ) {
			if ( element ) {
				// Initialize new element annotation
				item.annotations = annotations;
			} else {
				// Initialize new character annotation
				this.document.data[i] = [item, annotations];
			}
		} else if ( ve.isEmptyObject( annotations ) && annotated ) {
			if ( element ) {
				// Cleanup empty element annotation
				delete item.annotations;
			} else {
				// Cleanup empty character annotation
				this.document.data[i] = item[0];
			}
		}
	}
	this.synchronizer.pushAnnotation( new ve.Range( this.cursor, to ) );
};

/**
 * Execute a retain operation.
 *
 * This moves the cursor by op.length and applies annotations to the characters that the cursor
 * moved over.
 *
 * @param {Object} op Operation object:
 * @param {Integer} op.length Number of elements to retain
 */
ve.dm.TransactionProcessor.prototype.retain = function( op ) {
	this.applyAnnotations( this.cursor + op.length );
	this.cursor += op.length;
};

/**
 * Execute an annotate operation.
 *
 * This adds or removes an annotation to this.set or this.clear
 *
 * @param {Object} op Operation object
 * @param {String} op.method Annotation method, either 'set' to add or 'clear' to remove
 * @param {String} op.bias Endpoint of marker, either 'start' to begin or 'stop' to end
 * @param {String} op.annotation Annotation object to set or clear from content
 * @throws 'Invalid annotation method'
 */
ve.dm.TransactionProcessor.prototype.annotate = function( op ) {
	var target, hash;
	if ( op.method === 'set' ) {
		target = this.reversed ? this.clear : this.set;
	} else if ( op.method === 'clear' ) {
		target = this.reversed ? this.set : this.clear;
	} else {
		throw 'Invalid annotation method ' + op.method;
	}
	
	hash = $.toJSON( op.annotation );
	if ( op.bias === 'start' ) {
		target[hash] = op.annotation;
	} else {
		delete target[hash];
	}
	
	// Tree sync is done by applyAnnotations()
};

/**
 * Execute an attribute operation.
 *
 * This sets the attribute named op.key on the element at this.cursor to op.to , or unsets it if
 * op.to === undefined . op.from is not checked against the old value, but is used instead of op.to
 * in reverse mode. So if op.from is incorrect, the transaction will commit fine, but won't roll
 * back correctly.
 *
 * @param {Object} op Operation object
 * @param {String} op.key: Attribute name
 * @param {Mixed} op.from: Old attribute value, or undefined if not previously set
 * @param {Mixed} op.to: New attribute value, or undefined to unset
 */
ve.dm.TransactionProcessor.prototype.attribute = function( op ) {
	var element = this.document.data[this.cursor];
	if ( element.type === undefined ) {
		throw 'Invalid element error, can not set attributes on non-element data';
	}
	var to = this.reversed ? op.from : op.to;
	var from = this.reversed ? op.to : op.from;
	if ( to === undefined ) {
		// Clear
		if ( element.attributes ) {
			delete element.attributes[op.key];
		}
	} else {
		// Automatically initialize attributes object
		if ( !element.attributes ) {
			element.attributes = {};
		}
		// Set
		element.attributes[op.key] = to;
	}

	this.synchronizer.pushAttributeChange(
		this.document.getNodeFromOffset( this.cursor + 1 ),
		op.key,
		from, to
	);
};

/**
 * Execute a replace operation.
 *
 * This replaces a range of linear model data with another at this.cursor, figures out how the model
 * tree needs to be synchronized, and queues this in the DocumentSynchronizer.
 *
 * op.remove isn't checked against the actual data (instead op.remove.length things are removed
 * starting at this.cursor), but it's used instead of op.insert in reverse mode. So if
 * op.remove is incorrect but of the right length, the transaction will commit fine, but won't roll
 * back correctly.
 *
 * @param {Object} op Operation object
 * @param {Array} op.remove Linear model data to remove
 * @param {Array} op.insert Linear model data to insert
 */
ve.dm.TransactionProcessor.prototype.replace = function( op ) {
	var	remove = this.reversed ? op.insert : op.remove,
		insert = this.reversed ? op.remove : op.insert,
		removeIsContent = ve.dm.Document.isContentData( remove ),
		insertIsContent = ve.dm.Document.isContentData( insert ),
		node, selection;
	if ( removeIsContent && insertIsContent ) {
		// Content replacement
		// Update the linear model
		ve.batchSplice( this.document.data, this.cursor, remove.length, insert );
		this.applyAnnotations( this.cursor + insert.length );
		
		// Get the node containing the replaced content
		selection = this.document.selectNodes(
			new ve.Range( this.cursor, this.cursor + remove.length ),
			'leaves'
		);

		var	removeHasStructure = ve.dm.Document.containsElementData( remove ),
			insertHasStructure = ve.dm.Document.containsElementData( insert );
		if ( removeHasStructure || insertHasStructure ) {
			// Replacement is not exclusively text
			// Rebuild all covered nodes
			var range = new ve.Range( selection[0].nodeRange.start,
				selection[selection.length - 1].nodeRange.end );
			this.synchronizer.pushRebuild( range,
				new ve.Range( range.start, range.end + insert.length - remove.length )
			);
		} else {
			// Text-only replacement
			// Queue a resize for this node
			node = selection[0].node;
			this.synchronizer.pushResize( node, insert.length - remove.length );
		}

		// Advance the cursor
		this.cursor += insert.length;
	} else {
		// Structural replacement

		// It's possible that multiple replace operations are needed before the
		// model is back in a consistent state. This loop applies the current
		// replace operation to the linear model, then keeps applying subsequent
		// operations until the model is consistent. We keep track of the changes
		// and queue a single rebuild after the loop finishes.
		var operation = op,
			removeLevel = 0,
			insertLevel = 0,
			startOffset = this.cursor,
			adjustment = 0,
			i,
			type,
			prevCursor,
			affectedRanges = [],
			scope,
			minInsertLevel = 0,
			coveringRange,
			scopeStart,
			scopeEnd;

		while ( true ) {
			if ( operation.type == 'replace' ) {
				var	opRemove = this.reversed ? operation.insert : operation.remove,
					opInsert = this.reversed ? operation.remove : operation.insert;
				// Update the linear model for this insert
				ve.batchSplice( this.document.data, this.cursor, opRemove.length, opInsert );
				affectedRanges.push( new ve.Range( this.cursor, this.cursor + opRemove.length ) );
				prevCursor = this.cursor;
				this.cursor += opInsert.length;
				
				// Paint the removed selection, figure out which nodes were
				// covered, and add their ranges to the affected ranges list
				if ( opRemove.length > 0 ) {
					selection = this.document.selectNodes( new ve.Range(
						prevCursor - adjustment,
						prevCursor + opRemove.length - adjustment
					), 'siblings' );
					for ( i = 0; i < selection.length; i++ ) {
						// .nodeRange is the inner range, we need the
						// outer range (including opening and closing)
						if ( selection[i].node.isWrapped() ) {
							affectedRanges.push( new ve.Range(
								selection[i].nodeRange.start - 1,
								selection[i].nodeRange.end + 1
							) );
						} else {
							affectedRanges.push( selection[i].nodeRange );
						}
					}
				}

				// Walk through the remove and insert data
				// and keep track of the element depth change (level)
				// for each of these two separately. The model is
				// only consistent if both levels are zero.
				for ( i = 0; i < opRemove.length; i++ ) {
					type = opRemove[i].type;
					if ( type === undefined ) {
						// This is content, ignore
					} else if ( type.charAt( 0 ) === '/' ) {
						// Closing element
						removeLevel--;
					} else {
						// Opening element
						removeLevel++;
					}
				}
				// Keep track of the scope of the insertion
				// Normally this is the node we're inserting into, except if the
				// insertion closes elements it doesn't open (i.e. splits elements),
				// in which case it's the affected ancestor
				for ( i = 0; i < opInsert.length; i++ ) {
					type = opInsert[i].type;
					if ( type === undefined ) {
						// This is content, ignore
					} else if ( type.charAt( 0 ) === '/' ) {
						// Closing element
						insertLevel--;
						if ( insertLevel < minInsertLevel ) {
							// Closing an unopened element at a higher
							// (more negative) level than before
							// Lazy-initialize scope
							scope = scope || this.document.getNodeFromOffset( prevCursor );
							// Push the full range of the old scope as an affected range
							scopeStart = this.document.getDocumentNode().getOffsetFromNode( scope );
							scopeEnd = scopeStart + scope.getOuterLength();
							affectedRanges.push( new ve.Range( scopeStart, scopeEnd ) );
							// Update scope
							scope = scope.getParent() || scope;
						}

					} else {
						// Opening element
						insertLevel++;
					}
				}

				// Update adjustment
				adjustment += opInsert.length - opRemove.length;
			} else {
				// We know that other operations won't cause adjustments, so we
				// don't have to update adjustment
				this.executeOperation( operation );
			}

			if ( removeLevel === 0 && insertLevel === 0 ) {
				// The model is back in a consistent state, so we're done
				break;
			}

			// Get the next operation
			operation = this.nextOperation();
			if ( !operation ) {
				throw 'Unbalanced set of replace operations found';
			}
		}
		
		// From all the affected ranges we have gathered, compute a range that covers all
		// of them, and rebuild that
		coveringRange = ve.Range.newCoveringRange( affectedRanges );
		this.synchronizer.pushRebuild( coveringRange, new ve.Range( coveringRange.start,
			coveringRange.end + adjustment )
		);
	}
};
