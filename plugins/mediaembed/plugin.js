/**
 * @license Copyright (c) 2003-2014, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

'use strict';

( function() {

	CKEDITOR.plugins.add( 'mediaembed', {
		requires: 'widget,dialog',
		lang: 'en', // %REMOVE_LINE_CORE%

		onLoad: function() {
			var dtd = CKEDITOR.dtd,
				i;
			// We need to register oembed into dtd.
			CKEDITOR._.oembedCallbacks = [];
			dtd.oembed = { '#': 1 };
			// Register oembed element as allowed child, in each tag that can contain a div.
			for ( i in dtd ) {
				if ( dtd[ i ].div )
					dtd[ i ].oembed = 1;
			}

			CKEDITOR.addCss( '.cke_widget_element.cke_loading{ background: url('+ this.path + 'images/loader.gif' + ') no-repeat; }' );
		},

		init: function( editor ) {
			var config = editor.config;

			// Note that default providers are regexfied only once.
			config.mediaEmbed_providers = config.mediaEmbed_providers ?
				regexifyPatterns( config.mediaEmbed_providers.split( ',' ) ) :
				DEFAULT_PROVIDERS;

			config.mediaEmbed_providersWhitelist = ( config.mediaEmbed_providersWhitelist && config.mediaEmbed_providersWhitelist.split( ',' ) ) || [];

			var oembedProviderUrl = new CKEDITOR.template(
					editor.config.mediaEmbed_url ||
					'//noembed.com/embed?nowrap=on&url={url}&callback={callback}'
				),
				outputStrategy = editor.config.mediaEmbed_output || 'default',
				lang = editor.lang.mediaembed;

			CKEDITOR.dialog.add( 'mediaEmbed', this.path + 'dialogs/mediaEmbed.js' );

			// Register a common part of widget definition.
			var widgetDefinition = {
				mask: true,
				dialog: 'mediaEmbed',
				button: lang.button,
				template: '<div></div>',

				data: function() {
					// In some cases we can skip reloading the content if it's already there, or
					// if data.url is not given.
					if ( this.data.skipReload || !this.data.url )
						return;

					// We expect only URL to be changed, so we can reload the content.
					this.reloadContent();
				},

				// Performs a query to reload widget content, fetching it from
				// oembed service.
				reloadContent: function() {
					var that = this;

					// Mark as loading.
					this.element.addClass( 'cke_loading' );

					// Create actual callback for JSONP.
					CKEDITOR._.oembedCallbacks.push( function( result ) {

						// Youtube adjustment to insert flash with wmode=transparent.
						if ( result.provider_name == 'YouTube' )
							result.html = result.html.replace( youTubeRegex, '$1&wmode=transparent' );

						var resultMarkup = result.html,
							encodedError;

						editor.fire( 'lockSnapshot' );
						that.element.removeClass( 'cke_loading' );

						if ( result.html === undefined ) {
							// Notify that content-fetching error occured.
							that.data.error = 1;
							resultMarkup = lang.oembedContentUnavailable;
							// If error message is provided lets append it.
							if ( result.error ) {
								encodedError = CKEDITOR.tools.htmlEncode( result.error );
								resultMarkup += ' ' + lang.oembedContentUnavailableMsg.replace( /%s/g, encodedError );
							}
						}
						that.element.setHtml( resultMarkup );
						editor.fire( 'unlockSnapshot' );

						// Remove script element.
						script.remove();

						that.fire( 'contentLoaded', result );
					} );

					// Create a script tag, which will perform JSONP request.
					var scriptSrc = oembedProviderUrl.output( {
							url: encodeURIComponent( this.data.url ),
							callback: 'CKEDITOR._.oembedCallbacks[' + ( CKEDITOR._.oembedCallbacks.length - 1 ) + ']'
						} ),
						script = new CKEDITOR.dom.element( 'script' );

					script.setAttribute( 'src' , scriptSrc );
					CKEDITOR.document.getBody().append( script );
				}
			};

			// Override/extend widget definition with current strategy members.
			CKEDITOR.tools.extend( widgetDefinition, CKEDITOR.plugins.mediaembed.outputStrategies[ outputStrategy ], true );
			editor.widgets.add( 'mediaEmbed', widgetDefinition );

			// Register a callback which will prevent filtering content inside mediaembed widget.
			// It's required only for default strategy, because oembed strat contains only text node.
			outputStrategy == 'default' && editor.filter.addElementCallback( function( el ) {
				if ( el.attributes[ 'data-oembed-url' ] )
					return CKEDITOR.FILTER_SKIP_TREE;
			} );

			// Handling paste event, to convert paste URL into a widget.
			editor.on( 'paste', function( evt ) {

				if ( config.mediaEmbed_disablePasteUpcast )
					return;

				var data = evt.data.dataValue,
					publicNamespace = CKEDITOR.plugins.mediaembed,
					url = extractUrlFromPaste( data ),
					provider = url && publicNamespace.getProviderByUrl( url, evt.editor );

				if ( !provider )
					return;

				// This afterPaste listener, will do all the job - adding extra
				// snapshot with link as a plain text (or anchor) in IE case, and
				// after that, converting it into a widget.
				evt.editor.once( 'afterPaste', function( evt ) {
					editor.fire( 'lockSnapshot', { dontUpdate: true } );

					var rng = editor.getSelection().getRanges()[ 0 ],
						// Determine boundaries.
						iterationWrapper = rng.getCommonAncestor(),
						boundarySeen = false,
						boundaryTextNode = rng.getBoundaryNodes().endNode,
						nodeToRemove;

					if ( iterationWrapper.type == CKEDITOR.NODE_TEXT )
						iterationWrapper = iterationWrapper.getParent();

					iterationWrapper.forEach( function( node ) {
						// Boundary already seen, no need to continue.
						if ( boundarySeen )
							return false;

						// Confirm if given node does contain pasted URL (as a text).
						if ( node.getText && node.getText() == url )
							nodeToRemove = node;

						// We should check if endContainer was faced, if so, it
						// should stop searching.
						if ( node.equals( boundaryTextNode ) )
							boundarySeen = true;

					}, null , false );

					if ( nodeToRemove ) {
						rng.selectNodeContents( nodeToRemove );
						// Now lets remove contents of created range.
						rng.deleteContents();
					}

					editor.fire( 'unlockSnapshot' );
					// Insert decorated URL.
					editor.insertHtml( publicNamespace.pasteDecorator[ outputStrategy ]( url ) );
					editor.fire( 'updateSnapshot' );
				} );
			} );

			editor.addContentsCss && editor.addContentsCss( this.path + ( config.mediaEmbed_styles || 'styles/combined_gist.min.css' ) );
		}
	} );

	// Whenever you change providers, please reflect changes to list included in
	// config.mediaEmbed_providersWhitelist to keep it in sync.
	var DEFAULT_PROVIDERS = [{"patterns":["http://(?:www\\.)?xkcd\\.com/\\d+/?"],"name":"XKCD"},{"patterns":["https?://soundcloud.com/.*/.*"],"name":"SoundCloud"},{"patterns":["http://(?:www\\.)?flickr\\.com/.*"],"name":"Flickr"},{"patterns":["http://www\\.ted\\.com/talks/.+\\.html"],"name":"TED"},{"patterns":["http://(?:www\\.)?theverge\\.com/\\d{4}/\\d{1,2}/\\d{1,2}/\\d+/[^/]+/?$"],"name":"The Verge"},{"patterns":["http://.*\\.viddler\\.com/.*"],"name":"Viddler"},{"patterns":["https?://(?:www\\.)?wired\\.com/[^/]+/\\d+/\\d+/[^/]+/?$"],"name":"Wired"},{"patterns":["http://www\\.theonion\\.com/articles/[^/]+/?"],"name":"The Onion"},{"patterns":["http://yfrog\\.com/[0-9a-zA-Z]+/?$"],"name":"YFrog"},{"patterns":["https?://(?:www.)?skitch.com/([^/]+)/[^/]+/.+","http://skit.ch/[^/]+"],"name":"Skitch"},{"patterns":["https?://(alpha|posts|photos)\\.app\\.net/.*"],"name":"ADN"},{"patterns":["https?://gist\\.github\\.com/(?:[-0-9a-zA-Z]+/)?([0-9a-fA-f]+)"],"name":"Gist"},{"patterns":["https?://www\\.(dropbox\\.com/s/.+\\.(?:jpg|png|gif))","https?://db\\.tt/[a-zA-Z0-9]+"],"name":"Dropbox"},{"patterns":["https?://[^\\.]+\\.wikipedia\\.org/wiki/(?!Talk:)[^#]+(?:#(.+))?"],"name":"Wikipedia"},{"patterns":["http://www.traileraddict.com/trailer/[^/]+/trailer"],"name":"TrailerAddict"},{"patterns":["http://lockerz\\.com/[sd]/\\d+"],"name":"Lockerz"},{"patterns":["http://trailers\\.apple\\.com/trailers/[^/]+/[^/]+"],"name":"iTunes Movie Trailers"},{"patterns":["http://bash\\.org/\\?(\\d+)"],"name":"Bash.org"},{"patterns":["http://arstechnica\\.com/[^/]+/\\d+/\\d+/[^/]+/?$"],"name":"Ars Technica"},{"patterns":["http://imgur\\.com/gallery/[0-9a-zA-Z]+"],"name":"Imgur"},{"patterns":["http://www\\.asciiartfarts\\.com/[0-9]+\\.html"],"name":"ASCII Art Farts"},{"patterns":["http://www\\.monoprice\\.com/products/product\\.asp\\?.*p_id=\\d+"],"name":"Monoprice"},{"patterns":["https?://(?:[^\\.]+\\.)?youtube\\.com/watch/?\\?(?:.+&)?v=([^&]+)","https?://youtu\\.be/([a-zA-Z0-9_-]+)"],"name":"YouTube"},{"patterns":["https?://github\\.com/([^/]+)/([^/]+)/commit/(.+)","http://git\\.io/[_0-9a-zA-Z]+"],"name":"Github Commit"},{"patterns":["https?://open\\.spotify\\.com/(track|album)/([0-9a-zA-Z]{22})"],"name":"Spotify"},{"patterns":["https?://path\\.com/p/([0-9a-zA-Z]+)$"],"name":"Path"},{"patterns":["http://www.funnyordie.com/videos/[^/]+/.+"],"name":"Funny or Die"},{"patterns":["http://(?:www\\.)?twitpic\\.com/([^/]+)"],"name":"Twitpic"},{"patterns":["https?://www\\.giantbomb\\.com/videos/[^/]+/\\d+-\\d+/?"],"name":"GiantBomb"},{"patterns":["http://(?:www\\.)?beeradvocate\\.com/beer/profile/\\d+/\\d+"],"name":"Beer Advocate"},{"patterns":["http://(?:www\\.)?imdb.com/title/(tt\\d+)"],"name":"IMDB"},{"patterns":["http://cl\\.ly/(?:image/)?[0-9a-zA-Z]+/?$"],"name":"CloudApp"},{"patterns":["http://www\\.hulu\\.com/watch/.*"],"name":"Hulu"},{"patterns":["https?://(?:www\\.)?twitter\\.com/(?:#!/)?[^/]+/status(?:es)?/(\\d+)/?$","http://t\\.co/[a-zA-Z0-9]+"],"name":"Twitter"},{"patterns":["https?://(?:www\\.)?vimeo\\.com/.+"],"name":"Vimeo"},{"patterns":["http://www\\.amazon\\.com/(?:.+/)?[gd]p/(?:product/)?(?:tags-on-product/)?([a-zA-Z0-9]+)","http://amzn\\.com/([^/]+)"],"name":"Amazon"},{"patterns":["http://qik\\.com/video/.*"],"name":"Qik"},{"patterns":["http://www\\.rdio\\.com/#/artist/[^/]+/album/[^/]+/?","http://www\\.rdio\\.com/#/artist/[^/]+/album/[^/]+/track/[^/]+/?","http://www\\.rdio\\.com/#/people/[^/]+/playlists/\\d+/[^/]+"],"name":"Rdio"},{"patterns":["http://www\\.slideshare\\.net/.*/.*"],"name":"SlideShare"},{"patterns":["http://imgur\\.com/([0-9a-zA-Z]+)$"],"name":"Imgur"},{"patterns":["https?://instagr(?:\\.am|am\\.com)/p/.+"],"name":"Instagram"},{"patterns":["http://www\\.twitlonger\\.com/show/[a-zA-Z0-9]+","http://tl\\.gd/[^/]+"],"name":"Twitlonger"},{"patterns":["https?://vine.co/v/[a-zA-Z0-9]+"],"name":"Vine"},{"patterns":["http://www\\.urbandictionary\\.com/define\\.php\\?term=.+"],"name":"Urban Dictionary"},{"patterns":["http://picplz\\.com/user/[^/]+/pic/[^/]+"],"name":"Picplz"},{"patterns":["https?://(?:www\\.)?twitter\\.com/(?:#!/)?[^/]+/status(?:es)?/(\\d+)/photo/\\d+(?:/large|/)?$","https?://pic\\.twitter\\.com/.+"],"name":"Twitter"}],
		ieClipboardRegex = /<a href="(.+)">.+<\/a>/i,
		youTubeRegex = /(src="https?:\/\/www\.youtube\.com[^"]+)/g;

	// Regexify DEFAULT_PROVIDERS right at the start.
	regexifyPatterns( DEFAULT_PROVIDERS );

	/**
	 * @class CKEDITOR.plugins.mediaembed
	 * @singleton
	 */
	CKEDITOR.plugins.mediaembed = {};

	/**
	* Returns provider object for given URL if any found.
	*
	* @member CKEDITOR.plugins.mediaembed
	* @param {String} url Oembed URL to match against known patterns.
	* @param {CKEDITOR.editor} editor
	* @returns {Object/null} Matched provider or `null` if not found.
	*/
	CKEDITOR.plugins.mediaembed.getProviderByUrl = function( url, editor ) {
		var config = editor.config,
			PROVIDERS = config.mediaEmbed_providers,
			providersWhitelist = config.mediaEmbed_providersWhitelist,
			provider, patterns, i, j;

		for ( i = 0; i < PROVIDERS.length; ++i ) {
			provider = PROVIDERS[ i ];
			patterns = provider.patterns;

			if ( providersWhitelist.length && CKEDITOR.tools.indexOf( providersWhitelist, provider.name ) === -1 )
				continue;

			for ( j = 0; j < patterns.length; ++j ) {
				if ( url.match( patterns[ j ] ) )
					return provider;
			}
		}
	};

	/**
	 * Definies output methods. These basically contains {@link CKEDITOR.plugins.widget.definition},
	 * indexed by strategy name.
	 *
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
				var ret = new CKEDITOR.htmlParser.element( 'oembed' );
				ret.add( new CKEDITOR.htmlParser.text( this.data.url ) );
				return ret;
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
				// Content preserving - if content is already loaded there is no need to fire
				// extra http request). Occurs when:
				// - element has at least child
				// - and that child can not be whitespace-only/empty text node
				if ( children.length && ( children[ 0 ].type != CKEDITOR.NODE_TEXT || CKEDITOR.tools.trim( children[ 0 ].value ) ) ) {
					data.skipReload = 1;
					return element;
				}

				ret = new CKEDITOR.htmlParser.element( 'div' );
				element.replaceWith( ret );
				return ret;
			},
			downcast: function( el ) {
				el.attributes[ 'data-oembed-url' ] = this.data.url;

				// If an error occured, or it was loading (content not loaded yet)
				// we want to erease its inner HTML, so system
				// will attempt to redownload it next occasion.
				if ( this.data.error || this.element.hasClass( 'cke_loading' ) )
					el.children = [];

				return el;
			}
		}
	};

	/**
	 * Paste decorator allows for transforming matched oembed URL, into tag
	 * which may be upcasted to a widget.
	 *
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

	// @param {Object} providersArray Array containing providers to be regexified.
	function regexifyPatterns( providersArray ) {
		var PROVIDERS = providersArray,
			provider, patterns, i, j;

		for ( i = 0; i < PROVIDERS.length; ++i ) {
			provider = PROVIDERS[ i ];
			patterns = provider.patterns;

			for ( j = 0; j < patterns.length; ++j )
				patterns[ j ] = new RegExp( '^' + patterns[ j ] );
		}
	}

	/**
	 * An event fired when a widget instance got response from oembed provider, containing
	 * object returned with JSONP callback.
	 *
	 * @since 4.4
	 * @event contentLoaded
	 * @param {Object} result Oembed provider response.
	 */

	/**
	 * If set to `true` mediaembed will not automatically insert the link`s content on paste.
	 *
	 * @since 4.4
	 * @cfg {Boolean} [mediaEmbed_disablePasteUpcast=false]
	 * @member CKEDITOR.config
	 */

	/**
	 * Defines which output strategy should be used. We might use multiple strategies, to
	 * change output markup.
	 *
	 * Strategies implementations are defined in:
	 *
	 * * {@link CKEDITOR.plugins.mediaembed#outputStrategies} - allows to override widget definition members
	 * * {@link CKEDITOR.plugins.mediaembed#pasteDecorator} - used to decoreate pasted (positively matched) URL
	 *
	 * @since 4.4
	 * @cfg {String} [mediaEmbed_output='default']
	 * @member CKEDITOR.config
	 */

	/**
	 * Comma separated string, allows to explicitly specify a list of content providers that
	 * should be handled in mediaembed plugin. Empty string means no filtering.
	 *
	 * **Default providers list**: ADN, ASCII Art Farts, Amazon, Ars Technica, Bash.org, Beer Advocate, CloudApp, Dropbox, Flickr, Funny or Die, GiantBomb, Gist, Github Commit, Hulu, IMDB, Imgur, Imgur, Instagram, Lockerz, Monoprice, Path, Picplz, Qik, Rdio, Skitch, SlideShare, SoundCloud, Spotify, TED, The Onion, The Verge, TrailerAddict, Twitlonger, Twitpic, Twitter, Twitter, Urban Dictionary, Viddler, Vimeo, Vine, Wikipedia, Wired, XKCD, YFrog, YouTube, iTunes Movie Trailers
	 *
	 * Example:
	 *
	 *		config.mediaEmbed_providersWhitelist = 'Wikipedia,Twitter,YouTube,Vimeo,Ars Technica,Flickr';
	 *
	 * @since 4.4
	 * @cfg {String} [mediaEmbed_providersWhitelist='']
	 * @member CKEDITOR.config
	 */

	/**
	 * Path to stylesheet with CSS to style mediaembed content, relative to plugin directory.
	 *
	 * @since 4.4
	 * @cfg {String} [mediaEmbed_styles='styles/combined_gist.css']
	 * @member CKEDITOR.config
	 */

	/**
	 * Array of available providers with their RegExps. Each provider object should have following
	 * format:
	 *
	 *		{
	 *			name: 'Twitter',
	 *			patterns: [
	 *				'https?://(?:www\\.)?twitter\\.com/(?:#!/)?[^/]+/status(?:es)?/(\\d+)/?',
	 *				'http://t\\.co/[a-zA-Z0-9]+'
	 *			]
	 *		}
	 *
	 *  If setting is not set, default list of providers will be applied.
	 *
	 * @since 4.4
	 * @cfg {Array} [mediaEmbed_providers]
	 * @member CKEDITOR.config
	 */

	/**
	 * URL to oembed service. When URL is matched positively against any provider RegExp, plugin will
	 * query given URL for oembed content.
	 *
	 * Template parameters:
	 *
	 * * **url** - matched media content URL
	 * * **callback** - name of function which needs to be called by returned javascript content
	 *
	 * @since 4.4
	 * @cfg {String} [mediaEmbed_url='//noembed.com/embed?nowrap=on&url={url}&callback={callback}']
	 * @member CKEDITOR.config
	 */
} )();