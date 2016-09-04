var minimist = require( 'minimist' );
var core = require( './modules/core/core.js' )();

function startDefault ( conf ){

	core.setConfig( require( './modules/config/config.js' ), conf );
	console.log( core.config );

	core.setDb( require( './modules/db/db.js' ) ).then( function() {
	
		console.log( 'db connected' );
		console.log( core.db );
		// core.db.update( 'pages', {'title != ':'admin','url = ':'asdf'},{title:'tex',data:'Look at me!',options:JSON.stringify({hi:(new Date()).getTime()})}).then(() => console.log(arguments), console.log)
		return core.setTheme( require( './modules/theme/theme.js' ) );
	
	}, function( e ) {
	
		console.log( 'Error connecting to database' );
		console.log( e );
	
	} ).then( function() {
	
		console.log( 'Theme set' );
		return core.setPlugins();
	
	}, function( err ) {
	
		console.log( 'Theme set failed', err );
	
	} ).then( function() {
	
		console.log( 'Plugin set' );
		return core.setRouter( require( './modules/router/router.js' ) );
	
	}, function( err ) {
	
		console.log( 'Plugin set failed', err );
	
	} ).then( function() {
	
		console.log( 'Router Initialized!' );
	
	}, function( err ) {
	
		console.log( 'Router failed', err );
	
	} );
}

function parseArguments() {

	var argv = minimist(process.argv.slice(2));
	console.log( argv );
	return argv;

}


if (require.main === module) {

    startDefault( parseArguments() );

} else {

	module.exports = startDefault;

}

