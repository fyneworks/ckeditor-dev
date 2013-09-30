/**
 * @license Copyright (c) 2003-2013, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

'use strict';

(function() {

	var ALLOWED_ELEMENTS = {p:1,ul:1,ol:1,div:1};

	CKEDITOR.plugins.add( 'pullquote', {
		requires: 'widget',

		init: function( editor ) {
			editor.widgets.add( 'pullquote', {
				allowedContent: {
					'$1': {
						elements: ALLOWED_ELEMENTS,
						attributes: 'data-pullquote',
						propertiesOnly: true
					}
				},
				requiredContent: 'p[data-pullquote]',
				template: '<div class="pullquote">Quote</div>',
				editables: {
					quote: {
						selector: 'div.pullquote',
						allowedContent: {} // Nothing.
					}
				},

				upcast: function( element ) {
					var quote = element.attributes[ 'data-pullquote' ];

					if ( !quote )
						return;

					var container = new CKEDITOR.htmlParser.fragment.fromHtml( quote, 'div' );
					container.attributes[ 'class' ] = 'pullquote';
					element.parent.add( container, element.getIndex() );

					delete element.attributes[ 'data-pullquote' ];

					return container;
				},

				downcast: function( element ) {
					// Next element after wrapper.
					var next = element.parent.next;

					if ( next.type != CKEDITOR.NODE_ELEMENT || !( next.name in ALLOWED_ELEMENTS ) )
						return;

					next.attributes[ 'data-pullquote' ] = this.editables.quote.getData();
				}
			} );
		}
	} );

})();