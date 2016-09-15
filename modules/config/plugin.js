var q = require( 'q' );
var path = require( 'path' );
var fs = require( 'fs' );

module.exports = function( core, callback ) {

	var loadorderFile = 'loadorder.json';
	var plugins = [];

	// Checks plugin folder for loadorder, then reads/parses it.
	try {

		var files = fs.readdirSync( path.resolve( core.config.core.pluginFolder ) );
		var loadOrder = {};
		if ( files.indexOf( loadorderFile ) >= 0 ) {

			loadOrder = JSON.parse(
				fs.readFileSync(
					path.resolve(
						core.config.core.pluginFolder,
						loadorderFile
					),
					'utf8'
				)
			);

		}

	} catch ( e ) {

		console.log( 'Error parsing loadorder or plugin directory' );
		console.log( e );
		callback( null );
		return;

	}

	for ( var i = 0; i < files.length; i ++ ) {

		var file = files[ i ];
		if ( file.indexOf( '.' ) == - 1 ) {

			var fn = null;
			try {

				fn = require(
					path.resolve(
						core.config.core.pluginFolder,
						file,
						'index.js'
					)
				);

			} catch ( e ) {

				console.log( 'Could not load plugin: ' + file );
				console.log( e );
				continue;

			}
			console.log( 'Loaded plugin: ' + file );
			var plugin = { run: fn, loadOrder: 0, name: file };
			if ( file in loadOrder ) {

				plugin.loadOrder = loadOrder[ file ];

			}
			plugins.push( plugin );

		}

	}

	plugins.sort( function( a, b ) {

		return a.loadOrder - b.loadOrder;

	} )

	var pluginManager = {};
	pluginManager.plugins = plugins;

	pluginManager.startPlugins = function( core, app ) {

		for ( var i = 0; i < plugins.length; i ++ ) {

			var plugin = plugins[ i ];
			if ( plugin.loadOrder < 0 ) {

				console.log( 'Starting plugin: ', plugin.name );
				plugin.run( core, app );

			}

		}

	}

	pluginManager.endPlugins = function( core, app ) {

		for ( var i = 0; i < plugins.length; i ++ ) {

			var plugin = plugins[ i ];
			if ( plugin.loadOrder >= 0 ) {

				console.log( 'Starting plugin: ', plugin.name );
				plugin.run( core, app );

			}

		}

	}

	callback( null );

	return pluginManager;
	// Read conf directory, read loadorder.json if you can. Make a list of
	// functions to call with core, app, as arguments.

};
