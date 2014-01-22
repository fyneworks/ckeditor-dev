'use strict';

( function() {
	CKEDITOR.plugins.add( 'drupalimagecaption', {
		requires: 'widget,image2',

		beforeInit: function( editor ) {
			editor.on( 'widgetDefinition', function( evt ) {
				var def = evt.data;

				if ( def.name != 'image' )
					return;

				def.upcast = function( element, data ) {
					if ( element.name != 'img' )
						return;

					// Let's de-wrap <img> from <p> created by autoParagraphing.
					if ( element.parent.name == 'p' && element.attributes[ 'data-caption' ] ) {
						console.log( 'I\'m to be replaced!', element, element.parent );
						element.parent.replaceWith( element );
					}

					// Do whatever else to the image, i.e. wrap it with figure...
				};
			} );
		}
	} );
} )();