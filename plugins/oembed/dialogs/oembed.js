/**
 * @license Copyright (c) 2003-2013, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

'use strict';

CKEDITOR.dialog.add( 'oembed', function( editor ) {
	return {
		title: 'oEmbed',
		minWidth: 350,
		minHeight: 50,
		contents: [
			{
				id: 'info',
				elements: [
					{
						type: 'text',
						id: 'url',
						label: 'URL',
						setup: function( widget ) {
							this.setValue( widget.data.url );
						},
						commit: function( widget ) {
							widget.setData( 'url', this.getValue() );
						}
					}
				]
			}
		]
	};
} );