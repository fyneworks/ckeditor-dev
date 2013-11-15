/**
 * @license Copyright (c) 2003-2013, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

// Tool scripts for the sample pages.
// This file can be ignored and is not required to make use of CKEditor.

(function() {
	var navigationTpl =
		'<div id="navigation">' +
			'<ul>' +
				'<li><a href="#">Like us / Follow us</a></li>' +
				'<li><a href="#">RSS</a></li>' +
				'<li><a href="#">I found a bug</a></li>' +
				'<li><a href="#">Fork us on GitHub</a></li>' +
			'</ul>' +
		'</div>',

		categoryTpl = new CKEDITOR.template(
			'<dl>' +
				'<dt><a href="{categoryUrl}">{categoryName}</a></dt>' +
				'<dd>' +
					'<ul>{categoryItems}</ul>' +
				'</dd>' +
			'</dl>'
		),

		categoryItemTpl = new CKEDITOR.template(
			'<li><a href="{itemUrl}">{itemName}</a></li>'
		),

		categoryStructure = {
			'index.html': {
				name: 'Samples index'
			},

			'foo.html': {
				name: 'Basic samples',
				samples: {
					'replacebycode.html': 'Replace by code'
				}
			},

			'bar.html': {
				name: 'Advanced samples',
				samples: {
					'datafiltering.html': 'Data filtering (ACF)'
				}
			}
		},

		menu = CKEDITOR.dom.element.createFromHtml( '<div id="menu"></div>' ),

		body = CKEDITOR.document.getBody();

	CKEDITOR.dom.element.createFromHtml( navigationTpl ).appendTo( body, true );
	menu.appendTo( body, true );

	for ( var catUrl in categoryStructure ) {
		var listHtml = '';

		for ( var itemUrl in categoryStructure[ catUrl ].samples ) {
			listHtml += categoryItemTpl.output( {
				itemUrl: itemUrl,
				itemName: categoryStructure[ catUrl ].samples[ itemUrl ]
			} );
		}

		CKEDITOR.dom.element.createFromHtml( categoryTpl.output( {
			categoryUrl: catUrl,
			categoryName: categoryStructure[ catUrl ].name,
			categoryItems: listHtml
		} ) ).appendTo( menu );
	}
})();
// %LEAVE_UNMINIFIED% %REMOVE_LINE%