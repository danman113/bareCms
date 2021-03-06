var path = require( 'path' );
var fs = require( 'fs' );


module.exports = function( args ) {

	// Default config, with most major parts being relative to main folder structure

	var defaultConfig = {
		core: {
			pluginFolder: path.resolve( path.dirname( __dirname ), '..', './plugins/' ),
			customPluginFolder: path.resolve( path.dirname( __dirname ), '..', './plugins/' )
		},
		db: {
			filename: path.resolve( path.dirname( __dirname ), '..', './database.sql' ),
			passwordHash: path.resolve( path.dirname( __dirname ), '..', './modules/db/passwordHash.js' )
		},
		router: {
			port: 8080,
			staticURL: path.resolve( path.dirname( __dirname ), '..', './static/' ),
			staticAdminURL: path.resolve( path.dirname( __dirname ), '..', './staticAdmin/' ),
			sessionSecret: ( Math.random() * ( new Date() ).getTime() ).toString( 16 ),
			sessionName: ( Math.random() * ( new Date() ).getTime() * 2 ).toString( 16 ),
			sessionAge: 600000,
			openRegistration: true,
			sessionSecure: false,
			loginAttempts: 6,
			loginTimeout: 1000 * 60 * 30
		},
		theme: {
			folder: path.resolve( path.dirname( __dirname ), '..', './themes/' ),
			default: path.resolve( path.dirname( __dirname ), '..', './themes/' ),
			custom: path.resolve( path.dirname( __dirname ), '..', './themes/' ),
			theme: 'default',
			customTheme: 'default'
		}
	};

	// Recursively parses config, appending to default config.
	function parseArgs( argv, opt ) {

		for ( var i in argv ) {

			if ( typeof argv[ i ] != 'object' ) {

				opt[ i ] = argv[ i ];

			} else {

				opt[ i ] = opt[ i ] ? opt[ i ] : {};
				parseArgs( argv[ i ], opt[ i ] );

			}

		}
		return opt;

	}

	// Parses additional config file
	if ( args.config ) {

		try {

			var config = JSON.parse( fs.readFileSync( args.config, 'utf8' ) );
			parseArgs( config, defaultConfig );

		} catch ( e ) {

			console.log( 'Could not parse config file!' );
			console.log( 'Error: ', e );

		}

	}

	parseArgs( args, defaultConfig );

	return defaultConfig;

};
