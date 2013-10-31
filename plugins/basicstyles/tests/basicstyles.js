/**
 * @license Copyright (c) 2003-2013, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 *
 * @title: Plugin: basicstyles
 * @tags: editor, unit
 * @plugins: basicstyles, toolbar
 */

CKTESTER.editor = { config : { autoParagraph : false } };

CKTESTER.test( {
	'test apply range style across input element': function() {
		var bot = this.editorBot;
		bot.editor.filter.allow( 'input[type]' );
		bot.setHtmlWithSelection( 'te[xt<input type="button" />te]xt' );
		bot.execCommand( 'bold' );
		assert.areSame( 'te<strong>xt<input type="button" />te</strong>xt', bot.getData( false, true ) );
	}
} );