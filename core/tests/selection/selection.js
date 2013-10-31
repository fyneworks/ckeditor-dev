/**
 * @license Copyright (c) 2003-2013, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 *
 * @title: Core: selection
 * @tags: editor, unit
 */

CKTESTER.test( {
	test_contructor : function() {
		// Make the DOM selection at the beginning of the document.
		var newRange = new CKEDITOR.dom.range( doc );
		newRange.moveToPosition( doc.getBody(), CKEDITOR.POSITION_AFTER_START );
		var domSel = rangy.getSelection();
		domSel.removeAllRanges();
		domSel.addRange( convertRange( newRange ) );

		// create new selection scoped in the entire document .
		var sel1 = new CKEDITOR.dom.selection( doc );
		assert.isFalse( !!sel1.isLocked, 'selection.isLock' );
		assert.areSame( doc.$, sel1.document.$, 'selection.document' );
		assert.areSame( doc.getBody().$, sel1.root.$, 'selection.root' );


		// create new selection scoped in the editable element.
		var editable = doc.getById( 'sandbox' );

		var sel2 = new CKEDITOR.dom.selection( editable );
		assert.isFalse( !!sel2.isLocked, 'selection.isLock' );
		assert.areSame( sel2.document.$, doc.$, 'selection.document' );
		assert.areSame( sel2.root.$, editable.$, 'selection.root' );

		// Check the selection fields should be empty.
		assert.areSame( CKEDITOR.SELECTION_NONE, sel2.getType(), 'selection.getType()' );
		assert.areSame( null, sel2.getStartElement(), 'selection.getStartElement()' );
		assert.areSame( null, sel2.getSelectedElement(), 'selection.getSelectedElement()' );
		assert.areSame( '', sel2.getSelectedText(), 'selection.getSelectedText()' );
		assert.areSame( 0, sel2.getRanges().length, 'selection.getRanges()' );
	},

	test_getSelection : function() {
		var sel = doc.getSelection();
		assert.isFalse( !!sel.isLocked, 'selection.isLock' );
		assert.areSame( sel.document.$, doc.$, 'selection.document' );
		assert.areSame( sel.root.$, doc.getBody().$, 'selection.boundary' );
	},

	// Test getRanges/setRanges with various selection source.
	test_ranges_manipulation : function() {
		// Text selection.
		testSelection( '<div>[foo]</div>' );
		testSelection( '<p><strong>[foo</strong>]bar</p>' );
		testSelection( '<p><strong>foo[</strong>bar]</p>' );

		// Collapsed selection
		testSelection( '<div>fo^o</div>' );
		testSelection( '<div>foo^</div>' );
		testSelection( '<div>^foo</div>' );
		testSelection( '<p><strong>foo</strong>^bar</p>' );
		testSelection( '<p><strong>foo^</strong>bar</p>' );
		testSelection( '<p><strong>^foo</strong>bar</p>' );
		testSelection( '<p>^<strong>foo</strong>bar</p>' );

		// Collapsed selection inside of empty inline is not testable.
		if ( !CKEDITOR.env.opera ) {
			testSelection( '<p><b><i>^</i></b></p>' );
			testSelection( '<p>foo<b><i>^</i></b></p>' );
		}

		testSelection( '<p><br />^bar</p>' );
		testSelection( '<p>foo<br />^bar</p>' );
		testSelection( '<ul><li>bullet line 1</li><li>bullet line 2</li></ul>^second line' );

		// Element selection.
		testSelection( '<p>[<img />]</p>' );
		testSelection( '<p>[<input />]</p>' );

		// Entire block selection (FF only).
		if ( CKEDITOR.env.gecko ) {
			testSelection( '[<p style="float:left">foo</p>]' );
			testSelection( '<div>[<p>foo</p>]</div>' );
			testSelection( '<div>[<p>foo</p><p>bar</p>]</div>' );
			testSelection( '<div>[<h1>foo</h1>]</div>' );
			testSelection( '<div>[<pre>foo</pre>]</div>' );
		}

		// Table selection.
		testSelection( '<div><table><tr><td>[foo</td><td>bar]</td></tr></table></div>' );
		testSelection( '<div><table><tr><td>[foo</td></tr><tr><td>bar]</td></tr></table></div>' );

		// Multiple selection (FF only)
		if ( CKEDITOR.env.gecko ) {
			testSelection( '<div><table><tr><td>[foo]</td><td>[bar]</td></tr></table></div>' );
			testSelection( '<div><table><tr><td>[foo]</td></tr><tr><td>[bar]</td></tr></table></div>' );
		}
	},

	test_getSelectedElement : function() {
		testSelectedElement( '[<img />]', 'img' );
		testSelectedElement( '[<hr />]', 'hr' );
		testSelectedElement( '[<b><i><img /></i>]</b>', 'img' );
	},

	test_getSelectedText : function() {
		testSelectedText( '[<b>foo</b>bar]', 'foobar' );
		testSelectedText( '[<b>foo<img /></b>bar]', 'foobar' );
	},

	test_getStartElement : function() {
		testStartElement( '<b>^foo</b>', 'b' );
		testStartElement( '<b>foo^</b>', 'b' );
		testStartElement( '<i><b>foo[</b>bar]</i>', 'i' );
		testStartElement( '<p>foo[</p><div>bar]</div>', 'p' );
		testStartElement( '[<img />]', 'img' );
	},

	test_lock_unlock : function() {
		// Make the first selection.
		var sourceRange = makeSelection( '<strong id="start">foo</strong>bar[<img />]' )[ 0 ];
		var sel = doc.getSelection();
		sel.lock();

		// Make a fresh selection to drop the previous one.
		var newRange = new CKEDITOR.dom.range( doc );
		newRange.selectNodeContents( doc.getById( 'start' ) );
		var domSel = rangy.getSelection();
		domSel.removeAllRanges();
		domSel.addRange( convertRange( newRange ) );

		var resultRange = sel.getRanges()[ 0 ];

		assert.isTrue( !!sel.isLocked, 'selection should be marked as locked.' );
		assert.isTrue( checkRangeEqual( resultRange, sourceRange ), 'get ranges result from locked selection doesn\'t match the original.' );
		assert.isTrue( sel.getStartElement().is( 'img' ), 'start element result from locked selection doesn\'t match the original.' );
		assert.isTrue( sel.getSelectedElement().is( 'img' ),'selected element result from locked selection doesn\'t match the original.' );

		sel.unlock();

		var resultRange = sel.getRanges()[ 0 ];
		assert.isFalse( !!sel.isLocked, 'selection should be marked as locked.' );
		assert.isTrue( checkRangeEqual( resultRange, newRange ), 'get ranges result from locked selection doesn\'t match the original.' );
		assert.isTrue( sel.getStartElement().is( 'strong' ), 'start element result from locked selection doesn\'t match the original.' );
	},

	'test unlock outdated selection 1' : function() {
		makeSelection( '<p>a[b<b id="bold">c]d</b></p>' );

		var sel = doc.getSelection();
		sel.lock();

		// Remove node in which one selection's end is anchored.
		doc.getById( 'bold' ).remove();

		sel.selectRanges = function() {
			assert.fail( 'selectRanges should not be called.' );
		};

		sel.unlock( true );

		assert.isTrue( true, 'No error was thrown.' );
	},

	'test unlock outdated selection 2' : function() {
		makeSelection( '<p>a<b id="bold">c[d<i>e]f</i></b></p>' );

		var sel = doc.getSelection();
		sel.lock();

		// Remove node in which both selection's ends are anchored.
		doc.getById( 'bold' ).remove();

		sel.selectRanges = function() {
			assert.fail( 'selectRanges should not be called.' );
		};

		sel.unlock( true );

		assert.isTrue( true, 'No error was thrown.' );
	},

	test_selectRanges_after_locked :function() {
		// Make the first selection.
		var sourceRange = makeSelection( '<strong id="start">foo</strong>bar[<img />]' )[ 0 ];
		var sel = doc.getSelection();
		sel.lock();

		// Blur the editable.
		var input = doc.getById( 'input_1' );
		input.focus();

		// Select a new range on locked selection.
		var newRange = new CKEDITOR.dom.range( doc );
		var el = doc.getById( 'start' );
		newRange.selectNodeContents( el );
		sel.selectRanges( [ newRange ] );

		// Check focus remains after selecting ranges.
		assert.areSame( input.$, document.activeElement, 'focus should remains in the text input' );
		// Check the new (refreshed) locked selection.
		assert.isTrue( !!sel.isLocked, 'selection should be locked still' );
		assert.areSame( el, sel.getStartElement(), 'start element of locked should match' );
		assert.areSame( CKEDITOR.SELECTION_TEXT, sel.getType(), 'selection type of locked should match' );
		assert.areSame( 'foo', CKEDITOR.tools.trim( sel.getSelectedText() ), 'selected text of locked should match' );

		// Re-focus the editable.
		doc.getById( 'sandbox' ).focus();

		// Check dom selection range takes effect.
		var domSel = rangy.getSelection();
		var domRange = convertRange( domSel.getRangeAt( 0 ) );
		checkRangeEqual( domRange, newRange, 'actual selection range should be the same' );
	},

	test_removeAllRanges : function() {
		var range = new CKEDITOR.dom.range( doc );
		range.selectNodeContents( doc.getBody() );
		range.select();

		var sel = doc.getSelection();
		sel.removeAllRanges();

		var domSel = rangy.getSelection();

		// Various ways of detecting empty selection among browsers.
		var nativeSel = sel.getNative(),
			msSelection = typeof window.getSelection != 'function';

		msSelection ?
			assert.areSame( 'None', nativeSel.type ) :
			assert.areSame( 0, domSel.rangeCount );

		// MS selection will remain a (empty) dom range collapsed at the beginning
		// at the document even after the removal.
		if ( msSelection ) {
			var startContainer = doc.getBody();
			var emptyRange = new CKEDITOR.dom.range( doc );
			emptyRange.moveToPosition( startContainer, CKEDITOR.POSITION_AFTER_START );
			checkSelection.call( sel, CKEDITOR.SELECTION_TEXT, startContainer, null, '', [ emptyRange ] );
		}
		else
			checkSelection.call( sel, CKEDITOR.SELECTION_NONE, null, null, '', 0 );
	},

	// Check ranges return from selection is properly scoped.
	'check selection ranges\' scope' : function() {
		var editable = doc.getById( 'sandbox' );
		tools.setHtmlWithSelection( editable, '<p>[foo]</p>' );
		var sel = new CKEDITOR.dom.selection( editable ),
			ranges = sel.getRanges();
		for ( var i = 0; i < ranges.length; i++ )
			assert.areSame( ranges[ i ].root, editable );
	},

	'test get only editable ranges' : function() {
		var editable = doc.getById( 'sandbox' ),
			sel, ranges;

		makeSelection( 'f[oo<span contenteditable="false">bar</span>bo]m' );
		sel = new CKEDITOR.dom.selection( editable );
		// Get only editable ranges.
		ranges = sel.getRanges( true );

		assert.areEqual( 2, ranges.length );
		assert.areSame( 'oo', ranges[ 0 ].getEnclosedNode().getText() );
		assert.areSame( 'bo', ranges[ 1 ].getEnclosedNode().getText() );
	},

	'test get only editable ranges 2' : function() {
		if ( CKEDITOR.env.ie )
			assert.ignore();

		var editable = doc.getById( 'sandbox' ),
			sel, ranges;

		makeSelection( 'x<span contenteditable="false">fo[o b]ar</span>x' );
		sel = new CKEDITOR.dom.selection( editable );
		// Get only editable ranges.
		ranges = sel.getRanges( true );

		assert.areEqual( 0, ranges.length );
	},

	'selection scrolls into view' : function() {

		function assertElementInViewport( el ) {
			var view = doc.getWindow().getViewPaneSize();
			var rect = marker.getClientRect();
			assert.isTrue( rect.top > 0 && rect.top < view.height );
		}

		var editable = doc.getById( 'sandbox' );
		var linebreaks = CKEDITOR.tools.repeat( '<br />', 100 );
		editable.setHtml( '<p>' + linebreaks + 'foo<span id="scroll_marker">bar</span></p>' );

		// MUST not using setHtmlWithSelection which will split text nodes.
		var marker = doc.getById( 'scroll_marker' );
		var range = new CKEDITOR.dom.range( editable );
		range.setStart(marker.getPrevious(), 0);
		range.setEnd(marker.getFirst(), 3);
		range.select();

		var sel = new CKEDITOR.dom.selection( editable );
		sel.scrollIntoView();

		// Check the selection is really scrolled into view.
		assertElementInViewport( marker );

		// Make sure the scrollInto view doesn't destroy the selection.
		assert.areSame( 'foobar', sel.getSelectedText() );
	}
} );