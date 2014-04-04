/**
 * @license Copyright (c) 2003-2013, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

'use strict';

( function() {

	var PROVIDERS = [{"patterns":["http://(?:www\\.)?xkcd\\.com/\\d+/?"],"name":"XKCD"},{"patterns":["https?://soundcloud.com/.*/.*"],"name":"SoundCloud"},{"patterns":["http://(?:www\\.)?flickr\\.com/.*"],"name":"Flickr"},{"patterns":["http://www\\.ted\\.com/talks/.+\\.html"],"name":"TED"},{"patterns":["http://(?:www\\.)?theverge\\.com/\\d{4}/\\d{1,2}/\\d{1,2}/\\d+/[^/]+/?$"],"name":"The Verge"},{"patterns":["http://.*\\.viddler\\.com/.*"],"name":"Viddler"},{"patterns":["https?://(?:www\\.)?wired\\.com/[^/]+/\\d+/\\d+/[^/]+/?$"],"name":"Wired"},{"patterns":["http://www\\.theonion\\.com/articles/[^/]+/?"],"name":"The Onion"},{"patterns":["http://yfrog\\.com/[0-9a-zA-Z]+/?$"],"name":"YFrog"},{"patterns":["https?://(?:www.)?skitch.com/([^/]+)/[^/]+/.+","http://skit.ch/[^/]+"],"name":"Skitch"},{"patterns":["https?://(alpha|posts|photos)\\.app\\.net/.*"],"name":"ADN"},{"patterns":["https?://gist\\.github\\.com/(?:[-0-9a-zA-Z]+/)?([0-9a-fA-f]+)"],"name":"Gist"},{"patterns":["https?://www\\.(dropbox\\.com/s/.+\\.(?:jpg|png|gif))","https?://db\\.tt/[a-zA-Z0-9]+"],"name":"Dropbox"},{"patterns":["https?://[^\\.]+\\.wikipedia\\.org/wiki/(?!Talk:)[^#]+(?:#(.+))?"],"name":"Wikipedia"},{"patterns":["http://www.traileraddict.com/trailer/[^/]+/trailer"],"name":"TrailerAddict"},{"patterns":["http://lockerz\\.com/[sd]/\\d+"],"name":"Lockerz"},{"patterns":["http://trailers\\.apple\\.com/trailers/[^/]+/[^/]+"],"name":"iTunes Movie Trailers"},{"patterns":["http://bash\\.org/\\?(\\d+)"],"name":"Bash.org"},{"patterns":["http://arstechnica\\.com/[^/]+/\\d+/\\d+/[^/]+/?$"],"name":"Ars Technica"},{"patterns":["http://imgur\\.com/gallery/[0-9a-zA-Z]+"],"name":"Imgur"},{"patterns":["http://www\\.asciiartfarts\\.com/[0-9]+\\.html"],"name":"ASCII Art Farts"},{"patterns":["http://www\\.monoprice\\.com/products/product\\.asp\\?.*p_id=\\d+"],"name":"Monoprice"},{"patterns":["https?://(?:[^\\.]+\\.)?youtube\\.com/watch/?\\?(?:.+&)?v=([^&]+)","https?://youtu\\.be/([a-zA-Z0-9_-]+)"],"name":"YouTube"},{"patterns":["https?://github\\.com/([^/]+)/([^/]+)/commit/(.+)","http://git\\.io/[_0-9a-zA-Z]+"],"name":"Github Commit"},{"patterns":["https?://open\\.spotify\\.com/(track|album)/([0-9a-zA-Z]{22})"],"name":"Spotify"},{"patterns":["https?://path\\.com/p/([0-9a-zA-Z]+)$"],"name":"Path"},{"patterns":["http://www.funnyordie.com/videos/[^/]+/.+"],"name":"Funny or Die"},{"patterns":["http://(?:www\\.)?twitpic\\.com/([^/]+)"],"name":"Twitpic"},{"patterns":["https?://www\\.giantbomb\\.com/videos/[^/]+/\\d+-\\d+/?"],"name":"GiantBomb"},{"patterns":["http://(?:www\\.)?beeradvocate\\.com/beer/profile/\\d+/\\d+"],"name":"Beer Advocate"},{"patterns":["http://(?:www\\.)?imdb.com/title/(tt\\d+)"],"name":"IMDB"},{"patterns":["http://cl\\.ly/(?:image/)?[0-9a-zA-Z]+/?$"],"name":"CloudApp"},{"patterns":["http://www\\.hulu\\.com/watch/.*"],"name":"Hulu"},{"patterns":["https?://(?:www\\.)?twitter\\.com/(?:#!/)?[^/]+/status(?:es)?/(\\d+)/?$","http://t\\.co/[a-zA-Z0-9]+"],"name":"Twitter"},{"patterns":["https?://(?:www\\.)?vimeo\\.com/.+"],"name":"Vimeo"},{"patterns":["http://www\\.amazon\\.com/(?:.+/)?[gd]p/(?:product/)?(?:tags-on-product/)?([a-zA-Z0-9]+)","http://amzn\\.com/([^/]+)"],"name":"Amazon"},{"patterns":["http://qik\\.com/video/.*"],"name":"Qik"},{"patterns":["http://www\\.rdio\\.com/#/artist/[^/]+/album/[^/]+/?","http://www\\.rdio\\.com/#/artist/[^/]+/album/[^/]+/track/[^/]+/?","http://www\\.rdio\\.com/#/people/[^/]+/playlists/\\d+/[^/]+"],"name":"Rdio"},{"patterns":["http://www\\.slideshare\\.net/.*/.*"],"name":"SlideShare"},{"patterns":["http://imgur\\.com/([0-9a-zA-Z]+)$"],"name":"Imgur"},{"patterns":["https?://instagr(?:\\.am|am\\.com)/p/.+"],"name":"Instagram"},{"patterns":["http://www\\.twitlonger\\.com/show/[a-zA-Z0-9]+","http://tl\\.gd/[^/]+"],"name":"Twitlonger"},{"patterns":["https?://vine.co/v/[a-zA-Z0-9]+"],"name":"Vine"},{"patterns":["http://www\\.urbandictionary\\.com/define\\.php\\?term=.+"],"name":"Urban Dictionary"},{"patterns":["http://picplz\\.com/user/[^/]+/pic/[^/]+"],"name":"Picplz"},{"patterns":["https?://(?:www\\.)?twitter\\.com/(?:#!/)?[^/]+/status(?:es)?/(\\d+)/photo/\\d+(?:/large|/)?$","https?://pic\\.twitter\\.com/.+"],"name":"Twitter"}],
		ieClipboardRegex = /<a href="(.+)">.+<\/a>/i;
	regexifyPatterns();

	CKEDITOR.plugins.add( 'mediaembed', {
		requires: 'widget,dialog',
		lang: 'en', // %REMOVE_LINE_CORE%

		onLoad: function() {
			CKEDITOR._.oembedCallbacks = [];
			CKEDITOR.dtd.oembed = {};
			CKEDITOR.dtd.$block.oembed = 1;
		},

		init: function( editor ) {
			var oembedProviderUrl = new CKEDITOR.template(
					editor.config.oembedProviderUrl ||
					'//noembed.com/embed?nowrap=on&url={url}&callback={callback}'
				),
				loadingImageUrl = this.path + 'images/loader.gif',
				outputStrategy = editor.config.mediaembed_output || 'default';

			CKEDITOR.dialog.add( 'mediaembed', this.path + 'dialogs/mediaembed.js' );

			var widgetDefinition = {
				mask: true,
				dialog: 'mediaembed',
				button: editor.lang.mediaembed.button,
				template: '<div></div>',

				data: function() {

					// In some cases we can skip reloading the content if it's already there.
					if ( this.data.skipReload ) {
						return;
					}

					var that = this;

					// Insert loading icon.
					this.element.setHtml( '<img src="' + loadingImageUrl + '" />' );

					CKEDITOR._.oembedCallbacks.push( function( result ) {
						editor.fire( 'lockSnapshot' );
						that.element.setHtml( result.html );
						editor.fire( 'unlockSnapshot' );
					} );

					var scriptSrc = oembedProviderUrl.output( {
							url: encodeURIComponent( this.data.url ),
							callback: 'CKEDITOR._.oembedCallbacks[' + ( CKEDITOR._.oembedCallbacks.length - 1 ) + ']'
						} ),
						script = new CKEDITOR.dom.element( 'script' );

					script.setAttribute( 'src' , scriptSrc );
					CKEDITOR.document.getBody().append( script );
				}
			};

			// Override widget definition with current strategy members.
			CKEDITOR.tools.extend( widgetDefinition, CKEDITOR.plugins.mediaembed.outputStrategies[ outputStrategy ], true );
			editor.widgets.add( 'mediaembed', widgetDefinition );

			editor.on( 'paste', function( evt ) {
				var data = evt.data.dataValue,
					publicNamespace = CKEDITOR.plugins.mediaembed,
					url = extractUrlFromPaste( data ),
					provider = url && publicNamespace.getProviderByUrl( url );

				if ( !provider )
					return;

				evt.data.dataValue = publicNamespace.pasteDecorator[ outputStrategy ]( url );
			} );
		}
	} );

	/**
	 * @class CKEDITOR.plugins.mediaembed
	 */
	CKEDITOR.plugins.mediaembed = {};

	/**
	* Returns provider object for given url if any found.
	* @member CKEDITOR.plugins.mediaembed
	* @param {String} url Oembed url to match against known patterns.
	* @returns {Object/null} Matched provider or `null` if not found.
	*/
	CKEDITOR.plugins.mediaembed.getProviderByUrl = function( url ) {
		var provider, patterns, i, j;

		for ( i = 0; i < PROVIDERS.length; ++i ) {
			provider = PROVIDERS[ i ];
			patterns = provider.patterns;

			for ( j = 0; j < patterns.length; ++j ) {
				if ( url.match( patterns[ j ] ) )
					return provider;
			}
		}
	};

	/**
	 * Definies output methods. These basically contains {@link CKEDITOR.plugins.widget.definition},
	 * indexed by strategy name.
	 * @member CKEDITOR.plugins.mediaembed
	 */
	CKEDITOR.plugins.mediaembed.outputStrategies = {
		oembed: {
			allowedContent: 'oembed',
			requiredContent: 'oembed',
			upcast: function( element, data ) {
				if ( element.name != 'oembed' )
					return;

				var text = element.children[ 0 ];

				if ( text && text.type == CKEDITOR.NODE_TEXT && text.value ) {
					data.url = text.value;
					var div = new CKEDITOR.htmlParser.element( 'div' );
					element.replaceWith( div );
					return div;
				}
			},
			downcast: function() {
				return new CKEDITOR.htmlParser.fragment.fromHtml( this.data.url, 'oembed' );
			}
		},
		'default': {
			allowedContent: 'div[data-oembed-url]',
			requiredContent: 'div[data-oembed-url]',
			upcast: function( element, data ) {
				if ( element.name != 'div' || !element.attributes[ 'data-oembed-url' ] )
					return;

				var children = element.children,
					ret;
				data.url = element.attributes[ 'data-oembed-url' ];

				// If element has at least child, and we need to ensure that it's not a whitespace text node.
				if ( children.length && ( children[0].type != CKEDITOR.NODE_TEXT || CKEDITOR.tools.trim( children[0].value ) ) ) {
					// Reloading oembed content may be skipped.
					data.skipReload = 1;
					return element;
				}

				ret = new CKEDITOR.htmlParser.element( 'div' );
				element.replaceWith( ret );
				return ret;
			},
			downcast: function() {
				var ret = new CKEDITOR.htmlParser.fragment.fromHtml( this.element.getHtml(), 'div' );
				ret.attributes[ 'data-oembed-url' ] = this.data.url;
				return ret;
			}
		}
	};
	/**
	 * Paste decorator allows for transforming matched oembed url, into tag
	 * which may be upcasted to a widget.
	 * @member CKEDITOR.plugins.mediaembed
	 */
	CKEDITOR.plugins.mediaembed.pasteDecorator = {
		oembed: function( url ) {
			return '<oembed>' + CKEDITOR.tools.htmlEncode( url ) + '</oembed>';
		},
		'default': function( url ) {
			return '<div data-oembed-url="'+ url +'"></div>';
		}
	};

	function extractUrlFromPaste( html ) {

		if ( CKEDITOR.env.ie ) {
			// Ie wrapps it inside a link.
			var ieMatch = html.match( ieClipboardRegex );
			if ( ieMatch )
				html = ieMatch[ 1 ];
		}

		return html;
	}

	function regexifyPatterns() {
		var provider, patterns, i, j;

		for ( i = 0; i < PROVIDERS.length; ++i ) {
			provider = PROVIDERS[ i ];
			patterns = provider.patterns;

			for ( j = 0; j < patterns.length; ++j )
				patterns[ j ] = new RegExp( '^' + patterns[ j ] );
		}
	}

} )();