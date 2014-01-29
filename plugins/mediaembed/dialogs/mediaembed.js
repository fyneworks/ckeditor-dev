/**
 * @license Copyright (c) 2003-2013, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

'use strict';

CKEDITOR.dialog.add( 'mediaembed', function( editor ) {
	var lang = editor.lang.mediaembed,
		pluginNamespace = CKEDITOR.plugins.mediaembed;

	return {
		title: lang.title,
		minWidth: 350,
		minHeight: 50,
		contents: [
			{
				id: 'info',
				elements: [
					{
						type: 'text',
						id: 'url',
						label: lang.url,
						setup: function( widget ) {
							this.setValue( widget.data.url );
						},
						validate: CKEDITOR.dialog.validate.functions( function( val ) {
							return !!pluginNamespace.getProviderByUrl( val, editor );
						}, lang.invalidUrl ),
						commit: function( widget ) {
							widget.setData( 'url', this.getValue() );
						}
					}
				]
			}
		]
	};
} );