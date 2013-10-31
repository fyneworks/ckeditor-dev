/**
 * @license Copyright (c) 2003-2013, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 *
 * @title: Plugin: ajax
 * @tags: editor, unit
 * @plugins: ajax
 */

CKTESTER.test( {
	test_load_sync : function() {
		var data = CKEDITOR.ajax.load( '../../_assets/sample.txt' );
		assert.areSame( 'Sample Text', data, 'The loaded data doesn\'t match' );
	},

	test_load_sync_404 : function() {
		var data = CKEDITOR.ajax.load( '../../_assets/404.txt' );
		assert.isNull( data );
	},

	test_load_async : function() {
		var testCase = this;
		var callback = function( data ) {
			testCase.resume( function() {
				assert.areSame( 'Sample Text', data, 'The loaded data doesn\'t match' );
			} );
		};

		// Defer loading file, because in some cases on IE7 it's done synchronously, so resume() is called before wait().
		setTimeout( function() {
			CKEDITOR.ajax.load( '../../_assets/sample.txt', callback );
		} );
		this.wait();
	},

	test_load_async_404 : function() {
		var testCase = this;
		var callback = function( data ) {
			testCase.resume( function() {
				assert.isNull( data );
			} );
		};

		CKEDITOR.ajax.load( '../../_assets/404.txt', callback );
		this.wait();
	},

	test_loadXml_sync : function() {
		var data = CKEDITOR.ajax.loadXml( '../../_assets/sample.xml' );
		assert.isInstanceOf( CKEDITOR.xml, data );
		assert.isNotNull( data.selectSingleNode( '//list/item' ), 'The loaded data doesn\'t match (null)' );
		assert.isNotUndefined( data.selectSingleNode( '//list/item' ), 'The loaded data doesn\'t match (undefined)' );
	},

	test_loadXml_sync_404 : function() {
		var data = CKEDITOR.ajax.loadXml( '../../_assets/404.xml' );
		assert.isNull( data );
	},

	test_loadXml_async : function() {
		var testCase = this;
		var callback = function( data ) {
			testCase.resume( function() {
				assert.isInstanceOf( CKEDITOR.xml, data );
				assert.isNotNull( data.selectSingleNode( '//list/item' ), 'The loaded data doesn\'t match (null)' );
				assert.isNotUndefined( data.selectSingleNode( '//list/item' ), 'The loaded data doesn\'t match (undefined)' );
			} );
		};

		// Defer loading file, because in some cases on IE7 it's done synchronously, so resume() is called before wait().
		setTimeout( function() {
			CKEDITOR.ajax.loadXml( '../../_assets/sample.xml', callback );
		} );
		this.wait();
	},

	test_loadXml_async_404 : function() {
		var testCase = this;
		var callback = function( data ) {
			testCase.resume( function() {
				assert.isNull( data );
			} );
		};

		CKEDITOR.ajax.loadXml( '../../_assets/404.xml', callback );
		this.wait();
	}
});