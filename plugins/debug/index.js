module.exports = function( core, app, router, theme ) {
	
	app.use( '/debug/*', function( req, res, next ) {

		if ( router.requireLogin( req, res, next ) )
			next();

	} );

	app.get( '/debug/db', function( req, res ) {

		var table = 'pages';
		if ( req.query.table ) table = req.query.table;

		var query = req.query.query ? req.query.query : 'SELECT * FROM ' + table;

		console.log( query );

		core.db._All( query, {} ).then( function( row ) {

			res.send( '<pre>' + JSON.stringify( row, '\n', 4 ) + '</pre>' );

		}, function( err ) {

			console.log( err );
			res.send( err );

		} );

	} );

	app.get( '/debug/db/update', function( req, res, next ) {

	} )

	app.get( '/debug/core', function( req, res ) {

		res.send( core );

	} );

	app.get( '/debug/template', function( req, res, next ) {

		var templates = [];

		for ( var i in core.theme.templateCache ) {

			templates.push( i );

		}

		res.send( templates );

	} );

	app.get( '/debug/hash', function( req, res, next ) {

		console.log( req.query.pass.length );
		console.time( 'passHash' );

		core.db.addUser( { password: req.query.pass, username: req.query.user } ).then( function( hash ) {

			console.timeEnd( 'passHash' );
			res.send( hash );

		}, function( err ) {

			console.timeEnd( 'passHash' );
			console.log( err );
			res.send( 'error' );

		} );

	} );

	app.get( '/debug/login', function( req, res, next ) {

		console.log( 'Rawr' );
		core.db.login( req.query.user, req.query.pass ).then( function( pass ) {

			res.send( pass );

		}, function( err ) {

			res.send( err.toString() );

		} );

	} );

};