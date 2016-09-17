module.exports = function( core, app, router, theme ) {


	app.get( '/pages', function( req, res, next ) {

		var newPath = '/';
		if ( req.query.edit )
			newPath += '?edit=1';
		res.redirect( newPath );

	} );

	app.get( '/pages/*', function( req, res, next ) {

		var path = req._parsedUrl.pathname.substr( 6 );
		var lastChar = path.substr( path.length - 1, path.length );
		if ( lastChar == '/' && path != '/' ) path = path.substr( 0, path.length - 1 );
		if ( req.query.edit == true && req.session.login ) {

			core.db.getPage( { "url == ": path, 'admin ==': 0 } ).then( function( pageData ) {

				router.sendStaticPage(
					req,
					res,
					next,
					{ "url == ": '/edit', 'admin ==': 1 },
					{ site: router.site.general, admin: router.site.admin, editPage: pageData, toasts: router.getToasts( req ) },
					true
				);

			}, function( err ) {

				res.status( 404 );
				res.send( err );

			} );

		} else {

			router.sendStaticPage(
				req,
				res,
				next,
				{ "url == ": path, 'admin ==': 0 },
				{ site: router.site.general }
			);

		}

	} );

	app.post( '/pages/*', function( req, res, next ) {

		if ( ! router.requireLogin( req, res, next ) )
			return false;

		router.emptyCache();
		var path = req._parsedUrl.pathname.substr( 6 );
		var lastChar = path.substr( path.length - 1, path.length );
		if ( lastChar == '/' && path != '/' ) path = path.substr( 0, path.length - 1 );
		var form = req.body;
		form.cache = form.cache == 1;
		form.date = ( new Date() ).getTime();
		core.db.updatePage( path, form ).then( function( err ) {

			res.send( { status: 1, error: err, pageURL: path } );

		}, function( err ) {

			res.send( { status: 0, error: err } );

		} );

	} );

	app.put( '/pages/*', function( req, res, next ) {

		if ( ! router.requireLogin( req, res, next ) )
			return false;

		var path = req._parsedUrl.pathname.substr( 6 );
		var lastChar = path.substr( path.length - 1, path.length );
		if ( lastChar == '/' && path != '/' ) path = path.substr( 0, path.length - 1 );

		var form = req.body;
		form.url = path;
		form.admin = 0;
		form.cache = form.cache == 1;

		if ( ! form.data || ! form.title ) {

			res.status( 400 );
			res.send( { status: 0, error: "Title and data field must be filled" } );
			return false;

		}

		core.db.insertPage( form ).then( function() {

			res.status( 201 );
			res.send( { status: 1 } );

		}, function( err ) {

			res.status( 400 );
			res.send( { status: 0, error: err.message } );

		} );

	} );

	app.delete( '/pages/*', function( req, res, next ) {

		if ( ! router.requireLogin( req, res, next ) )
			return false;

		router.emptyCache();
		var path = req._parsedUrl.pathname.substr( 6 );
		var lastChar = path.substr( path.length - 1, path.length );
		if ( lastChar == '/' && path != '/' ) path = path.substr( 0, path.length - 1 );

		core.db.deletePage( path ).then( function( err ) {

			res.status( 200 );
			res.send( { status: 1, error: err } );

		}, function( err ) {

			res.status( 400 );
			res.send( { status: 0, error: err } );

		} );

	} );

	app.get( '/', function( req, res, next ) {

		if ( req.query.edit == true  && req.session.login ) {

			core.db.getPage( { "url == ": '/', 'admin ==': 0 } ).then( function( pageData ) {

				router.sendStaticPage(
					req,
					res,
					next,
					{ "url == ": '/edit', 'admin ==': 1 },
					{ site: router.site.general, admin: router.site.admin, editPage: pageData },
					true
				);

			}, function( err ) {

				res.status( 404 );
				res.send( err );

			} );

		} else {

			router.sendStaticPage(
				req,
				res,
				next,
				{ "url == ": '/', 'admin ==': 0 },
				{ site: router.site.general }
			);

		}

	} );

	app.post( '/', function( req, res, next ) {

		router.emptyCache();
		var path = req._parsedUrl.pathname.substr( 6 );
		path = '/';
		var lastChar = path.substr( path.length - 1, path.length );
		if ( lastChar == '/' && path != '/' ) path = path.substr( 0, path.length - 1 );
		var form = req.body;
		form.cache = form.cache == 1;
		form.date = ( new Date() ).getTime();
		core.db.updatePage( path, form ).then( function( err ) {

			res.send( { status: 1, error: err, pageURL: path } );

		}, function( err ) {

			res.send( { status: 0, error: err } );

		} );

	} );

};