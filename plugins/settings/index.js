var q = require( 'q' );

module.exports = function( core, app, router, theme ) {

	app.use( '/settings/*', function( req, res, next ) {

		if ( router.requireLogin( req, res, next ) )
			next();

	} );

	app.post( '/settings', function( req, res, next ) {

		var value = req.body;

		var newSettings = [];

		for ( var key in req.body ) {

			newSettings.push( core.db.updateSetting( key, req.body[ key ] ) );

		}

		q.all( newSettings ).then( function() {

			router.emptyCache();
			router.getSettings();
			res.status( 201 );
			res.send( { status: 1 } );

		}, function( err ) {

			res.status( 400 );
			res.send( { status: 0, error: err.message } );

		} );

	} );

	app.get( '/settings', function( req, res, next ) {

		core.db.getSettings().then( function( settings ) {

			res.send( settings );

		}, function( err ) {

			res.send( err );

		} );

	} );

};