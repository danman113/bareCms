module.exports = function( core, app, router, theme ) {
    
	app.use( '/login', function( req, res, next ) {

		res.set( 'Cache-Control', 'private, no-cache, no-store, must-revalidate' );
		next();

	} );

	app.get( '/login', function( req, res, next ) {

		var attempts = router.loginRequests[ router.getClientAddress( req ) ];

		if ( req.session.login ) {

			router.setToast( req, "You are already logged in!" );
			res.redirect( '/admin' );
			return false;

		}

		router.sendStaticPage(
			req,
			res,
			next,
			{ "url == ": '/login', 'admin != ': 0 },
			{ site: router.site.general, admin: router.site.admin, attempts: attempts, toasts: router.getToasts( req ) }
		);

	} );


	app.put( '/login', function( req, res, next ) {

		res.send( { status: 0, error: "You lack sufficient privilege to perform that action. Please login. " } );

	} );

	app.get( '/logout', function( req, res, next ) {

		if ( ! router.requireLogin( req, res, next ) )
			return false;

		delete req.session.login;

		router.setToast( req, 'You have been successfuly logged out!' );

		res.redirect( '/login' );
		

	} );

	app.post( '/login', function( req, res, next ) {

		var error = { status: 0, error: "Username/Password combination does not exist." };

		var username = req.body.username;

		var password = req.body.password;

		var attempt = router.limitAttempts( req, res, next );
		if ( ! attempt ) {

			var attempts = router.loginRequests[ router.getClientAddress( req ) ];
			res.status( 400 );
			error.error = "Too many attempts!";
			res.send( error );
			return false;

		}

		core.db.login( username, password ).then( function( pass ) {

			if ( pass ) {

				// Do cookie stuff

				router.setLogin( req, username );

				res.status( 201 );
				res.send( { status: 1 } );

			} else {

				res.status( 400 );
				res.send( error );

			}

		}, function() {

			res.status( 400 );
			res.send( error );

		} );

	} );

	app.use( '/register', function( req, res, next ) {

		res.set( 'Cache-Control', 'private, no-cache, no-store, must-revalidate' );
		next();

	} );

	app.post( '/register', function( req, res, next ) {

		var error = { status: 0, error: "Username/Password combination does not exist." };

		if ( ! core.config.router.openRegistration ) {

			error.error = "Registration not open!";
			res.send( error );

		}

		var username = req.body.username;

		var password = req.body.password;
		var password2 = req.body.password2;

		var attempt = router.limitAttempts( req, res, next );
		if ( ! attempt ) {

			var attempts = router.loginRequests[ router.getClientAddress( req ) ];
			res.status( 400 );
			error.error = "Too many attempts!";
			res.send( error );

		}

		if ( password != password2 ) {

			res.status( 400 );
			error.error = ( "Passwords not equal!" );
			res.send( error );
			return false;

		}

		var data = { username: username, password: password };

		core.db.addUser( data ).then( function() {

			res.status( 201 );
			res.send( { status: 1 } );

		}, function( err ) {

			res.status( 400 );
			error.error = err.toString();
			res.send( error );

		} );

	} );

	app.get( '/register', function( req, res, next ) {

		if ( ! core.config.router.openRegistration && ! router.requireLogin( req, res, next ) )
			return false;

		router.sendStaticPage(
			req,
			res,
			next,
			{ "url == ": '/register', 'admin !=': 0 },
			{ site: router.site.general, admin: router.site.admin }
		);

	} );

	app.delete( '/register', function( req, res, next ) {

		if ( ! router.requireLogin( req, res, next ) )
			return false;

		var error = { status: 0, error: "Username/Password combination does not exist." };

		var username = req.body.username;

		var password = req.body.password;

		var data = { username: username, password: password };

		core.db.login( username, password ).then( function( data ) {

			if ( data ) return core.db.removeUser( username );
			else throw new Error( 'User does not exists' );

		} ).then( function() {

			res.status( 201 );
			res.send( { status: 1 } );

		} ).fail( function( err ) {

			res.status( 400 );
			error.error = err.toString();
			res.send( error );

		} );

	} );

};