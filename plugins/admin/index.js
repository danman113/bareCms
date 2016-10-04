var express = require( 'express' );
var path = require( 'path' );

module.exports = function( core, app, router, theme ) {

	app.use( '/staticAdmin', function( req, res, next ) {

		if ( router.requireLogin( req, res, next ) )
			next();

	} );

	app.use(
		'/staticAdmin',
		express.static(
			path.resolve(
				core.config.router.staticAdminURL
			)
		)
	);

	app.use( [ '/admin/*', '/admin' ], function( req, res, next ) {

		res.set( 'Cache-Control', 'private, no-cache, no-store, must-revalidate' );

		if ( router.requireLogin( req, res, next ) )
			next();

	} );

	app.get( '/admin/', function( req, res, next ) {

		var re = router.getRedirect( req );
		if ( re ) {

			res.redirect( re );
			return false;

		}

		router.sendStaticPage(
			req,
			res,
			next,
			{ "url == ": '/home', 'admin !=': 0 },
			{ site: router.site.general, admin: router.site.admin, toasts: router.getToasts( req ) }
		);

	} );

	app.get( '/admin/template', function( req, res, next ) {

		router.sendStaticPage(
			req,
			res,
			next,
			{ "url == ": '/template', 'admin !=': 0 },
			{ site: router.site.general, admin: router.site.admin, toasts: router.getToasts( req ) }
		);

	} );

	app.get( '/admin/page', function( req, res, next ) {

		router.sendStaticPage(
			req,
			res,
			next,
			{ "url == ": '/page', 'admin !=': 0 },
			{ site: router.site.general, admin: router.site.admin, toasts: router.getToasts( req ) }
		);

	} );

	app.get( '/admin/templates', function( req, res, next ) {

		router.sendStaticPage(
			req,
			res,
			next,
			{ "url == ": '/templates', 'admin ==': 1 },
			{ site: router.site.general, admin: router.site.admin, toasts: router.getToasts( req ) },
			true
		);

	} );

	app.get( '/admin/navigation', function( req, res, next ) {

		core.db.getSettings().then( function( data ) {
			var settings = data;
			return core.db.get( 'pages', [ 'url', 'title' ], { 'admin ==': 0  } ).then( function( pages ){
				router.sendStaticPage(
					req,
					res,
					next,
					{ "url == ": '/navigation', 'admin ==': 1 },
					{ site: router.site.general, admin: router.site.admin, pages: pages, settings: settings, toasts: router.getToasts( req ) },
					true
				);	
			} );
		} ).fail( function( err ) {

			res.send( err );

		} );

	} );

	app.get( '/admin/settings', function( req, res, next ) {

		core.db.getSettings().then( function( data ) {

			router.sendStaticPage(
				req,
				res,
				next,
				{ "url == ": '/settings', 'admin ==': 1 },
				{ site: router.site.general, admin: router.site.admin, settings: data, toasts: router.getToasts( req ) },
				true
			);

		}, function( err ) {

			res.send( err );

		} );

	} );

	app.get( '/admin/pages', function( req, res, next ) {

		var offset = isNaN( + req.query.offset ) ? 0 : ( + req.query.offset );
		var query = { "admin == ": 0 };
		var order = { date: false };
		var search = req.query.search;
		if ( search ) {

			query[ "title LIKE $title OR url LIKE " ] = '%' + search + '%';

		}
		if ( req.query.order ) {

			order = {}
			order[ req.query.order ] = false;
			if ( req.query.by ) {

				order[ req.query.order ] = req.query.by.toLowerCase() == 'asc';

			}

		}

		// core.db._All( 'SELECT * FROM pages WHERE ((title LIKE $title OR url LIKE $url) AND admin == 0)', {$title: '%' + search + '%', $url: '%' + search + '%'} )
		core.db.get( 'pages', [ '*' ], query, order, 20, offset )
			.then( function( row ) {

				router.sendStaticPage(
					req,
					res,
					next,
					{ "url == ": '/admin/pages', 'admin !=': 0 },
					{ site: router.site.general, admin: router.site.admin, pages: row, toasts: router.getToasts( req ) }
				)

			}, function( err ) {

				res.status( 404 );
				res.send( err );

			} );

	} );


};