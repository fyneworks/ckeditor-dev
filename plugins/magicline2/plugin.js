/**
 * @license Copyright (c) 2003-2013, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.html or http://ckeditor.com/license
 */

'use strict';

(function() {
	CKEDITOR.plugins.add( 'magicline2', {
		lang: 'en', // %REMOVE_LINE_CORE%

		onLoad: function( editor ) {
		},

		init: function( editor ) {
			var detector = CKEDITOR.plugins.magicline2.lineDetector;

			editor.on( 'contentDom', addListeners, this );

			function addListeners() {
				var editable = editor.editable(),
					inline = editable.isInline(),
					doc = editor.document,

					target, oldTarget;

				editable.attachListener( inline ? editable : doc, 'mousemove', function( evt ) {
					if ( editor.mode != 'wysiwyg' || editor.readOnly )
						return;

					target = evt.data.getTarget();

					if ( !target.equals( oldTarget ) ) {
						detector( target )( new CKEDITOR.dom.text( '-------------' ) );
						oldTarget = target;
					}
				} );
			}
		},

		afterInit: function( editor ) {
		}
	} );

	var positives = { table:1,hr:1,div:1,ul:1,ol:1,dl:1,form:1,blockquote:1 };
	var floats = { left:1,right:1,center:1 };
	var positions = { absolute:1,fixed:1,relative:1 };

	var isWhitespaces = CKEDITOR.dom.walker.whitespaces();

	function isFloated( el ) {
		return !!( floats[ el.getComputedStyle( 'float' ) ] || floats[ el.getAttribute( 'align' ) ] )
	}

	function isPositioned( el ) {
		return !!positions[ el.getComputedStyle( 'position' ) ];
	}

	function isElement( node ) {
		return node && node.type == CKEDITOR.NODE_ELEMENT;
	}

	function isText( node ) {
		return node && node.type == CKEDITOR.NODE_TEXT;
	}

	function isFunction( fn ) {
		return fn && fn.call && fn.apply;
	}

	// * Any element belonging to positives that is not floated and not positioned.

	// * Any non-empty text
	// * Any element that is not floated and not positioned.

	// False if line negative.
	// Element if line positive.
	// Null when neither.
	function createLookupFn( fn ) {
		return function( el ) {
			// If starting element is not positive, it doesn't
			// interact with any other element.
			if ( !el.is( positives ) || isFloated( el ) || isPositioned( el ) )
				return false;

			var node = el;

			while ( ( node = node[ fn ]() ) ) {
				if ( isElement( node ) ) {
					if ( !isFloated( node ) && !isPositioned( node ) ) {
						if ( node.is( positives ) )
							return node;
						return
							false;
					}
				} else if ( isText( node ) ) {
					if ( !isWhitespaces( node ) )
						return false;
				}
			}

			return null;
		}
	}

	var getNextPositiveOrNegative = createLookupFn( 'getNext' );
	var getPreviousPositiveOrNegative = createLookupFn( 'getPrevious' );

	var rules = {
		'element is first block of parent': function( el ) {
			if ( getPreviousPositiveOrNegative( el ) === null ) {
				return function( line ) {
					line.insertBefore( el );
				}
			}
		},

		'element is last block of parent': function( el ) {
			if ( getNextPositiveOrNegative( el ) === null ) {
				return function( line ) {
					line.insertAfter( el );
				}
			}
		},

		'next block found is positive': function( el ) {
			if ( getNextPositiveOrNegative( el ) ) {
				return function( line ) {
					line.insertAfter( el );
				}
			}
		},

		'previous block found is positive': function( el ) {
			if ( getPreviousPositiveOrNegative( el ) ) {
				return function( line ) {
					line.insertBefore( el );
				}
			}
		}
	};

	// var editor = CKEDITOR.instances.editor1;
	// var doc = editor.document;

	// var s = new Date().getTime();

	// var els = new CKEDITOR.dom.nodeList( doc.$.querySelectorAll( 'table,hr,div,ul,ol,dl,form,blockquote' ) ),
	//     rects = [];

	// for ( var i = els.count(); i--; )
	//   rects.push( els.getItem( i ).$.getBoundingClientRect() );

	// console.log( 'dur:', new Date().getTime() - s, 'ms' );
	// console.log( rects );


	CKEDITOR.plugins.magicline2 = {
		lineDetector: function( el, limit ) {
			var fns = [],
				fn;

			// TODO: to be converted into editable checker and removed
			if ( el.equals( limit ) )
				return;

			do {
				for ( var r in rules ) {
					fn = rules[ r ]( el );
					fn && fns.push( fn );
				}
			} while ( ( el = el.getParent() ) && !el.equals( limit ) )

			return function( line ) {
				while ( ( fn = fns.pop() ) )
					fn( line.clone() );
			};
		}
	};
})();