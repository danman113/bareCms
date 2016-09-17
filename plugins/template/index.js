module.exports = function( core, app, router, theme ) {

    app.use( '/template/*', function( req, res, next ) {

		if ( router.requireLogin( req, res, next ) )
			next();

	} );

	app.put( '/template/:id', function( req, res, next ) {

		var key = req.params.id;
		var form = req.body;


		if ( ! form.data ) {

			res.status( 400 );
			res.send( { status: 0, error: "Template must contain string" } );
			return false;

		}

		core.theme.setTemplateFromString( key, form.data, function( err ) {

			if ( err ) {

				res.status( 400 );
				res.send( { status: 0, error: err.message } );

			} else {

				core.theme.initTemplates( function( err ) {

					if ( err ) {

						res.status( 400 );
						res.send( { status: 0, error: err.message } );

					} else {

						res.status( 201 );
						res.send( { status: 1 } );

					}

				} );

			}

		} );

	} );

	app.post( '/template/:id', function( req, res, next ) {

		var key = req.params.id;
		var form = req.body;


		if ( ! form.data ) {

			res.status( 400 );
			res.send( { status: 0, error: "Template must contain string" } );
			return false;

		}

		core.theme.setTemplateFromString( key, form.data, function( err ) {

			if ( err ) {

				res.status( 400 );
				res.send( { status: 0, error: err.message } );

			} else {

				core.theme.initTemplates( function( err ) {

					if ( err ) {

						res.status( 400 );
						res.send( { status: 0, error: err.message } );

					} else {

						router.emptyCache();
						res.status( 201 );
						res.send( { status: 1 } );

					}

				} );

			}

		} );

	} );

	app.delete( '/template/:id', function( req, res, next ) {

		router.emptyCache();
		var key = req.params.id;

		core.theme.deleteTemplate( key, function( err ) {

			if ( err ) {

				res.status( 400 );
				res.send( { status: 0, error: err.message } );

			} else {

				core.theme.initTemplates( function( err ) {

					if ( err ) {

						res.status( 400 );
						res.send( { status: 0, error: err.message } );

					} else {

						res.status( 201 );
						res.send( { status: 1 } );

					}

				} );

			}

		} );

	} );

	app.get( '/template/:id', function( req, res, next ) {

		var key = req.params.id;
		core.db.getPage( { "title == ": key, 'admin != ': 0, "url LIKE ": "__template__%" } ).then( function( pageData ) {

			router.sendStaticPage(
				req,
				res,
				next,
				{ "url == ": '/editTemplate', 'admin ==': 1 },
				{ site: router.site.general, admin: router.site.admin, editPage: pageData, toasts: router.getToasts( req ) },
				true
			);

		}, function( err ) {

			res.status( 404 );
			res.send( err );

		} );

	} );

};