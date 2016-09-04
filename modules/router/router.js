var q = require( 'q' );
var express = require( 'express' );
var path = require( 'path' );
var app = express();
var bodyParser = require( 'body-parser' );
var jade = require( 'jade' );
var fs = require( 'fs' );


module.exports = function( core, callback ) {

	var router = {
		app: app,
		cache: {},
		filters: []
	};

	var site = {
		admin: core.theme.admin,
		general: {}
	};

	router.cacheUse = function( req, res, extraData, params ) {

		var params;
		if ( params )
			path = req.url;
		else
			path = req._parsedUrl.pathname;
		extraData = extraData ? extraData : {};
		
		if ( router.cache[ path ] ) {

			if ( typeof router.cache[ path ] == 'function' ) {

				console.log( 'Dynamic cache hit' );
				var fn = router.cache[ path ];
				for ( var i in extraData ) {

					fn.data[ i ] = extraData[ i ];

				}
				router.sendPage( req, res, fn, fn.data );
				return true;

			} else {

				console.log( 'Static cache hit' );
				res.status( 200 );
				res.send( router.cache[ path ] );
				return true;

			}

		}

		return false;

	};

	router.cacheSet = function( req, res, fn, data, params ) {

		fn.data = data;
		var path;
		if ( params )
			path = req.url;
		else
			path = req._parsedUrl.pathname;
		router.cache[ path ] = fn;

	};

	router.sendPage = function( req, res, fn, data ) {

		res.status( 200 );
		
		var str = "";
		try {

			str = fn( data );

		} catch ( e ) {

			str = e.toString();

		}

		var template = data.template;
		data.pageData = str;
		
		core.theme.useTemplate( template, function( templatefn ) {
			var html = "";
			try {

				html = templatefn( data );

			} catch ( e ) {

				html = e.toString();

			}

			// console.log( html );

			res.send( html );

		} );
		

	};

	router.addFilter = function( filter, position ) {

		if ( typeof filter == 'function' ) {

			if ( position !== null && position !== undefined ) {

				router.filters.push( filter );

			} else {

				router.filters.splice( position, 0, filter );

			}

		}

	};

	router.sendStaticPage = function( req, res, next, selects, data, params ) {

		// Check Cache first
		if ( router.cacheUse( req, res, data, params ) )
			return true;

		// Get page info from db
		core.db.getPage( selects ).then( function( page ) {

			if ( page ) {

				var html = page.data;
				var template = page.template;
				for ( var i = 0; i < router.filters.length; i ++ ) {

					html = router.filters[ i ]( page );

				}

				// Compile template
				var fn;
				try {

					fn = jade.compile( page.data );

				} catch ( e ) {

					fn = function() {

						return e.toString();

					};

				}

				// Make html for static page, then send to cache/user
				if ( page.cache ) {

					for ( var point in data ) {

						page[ point ] = data[ point ];

					}

					console.log( 'Caching raw page' );
					var str = "";
					try {

						str = fn( page );

					} catch ( e ) {

						str = e.toString();

					}
					
					page.pageData = str;
					
					core.theme.useTemplate( template, function( templatefn ) {
						var html = "";
						try {
	
							html = templatefn( page );
	
						} catch ( e ) {
	
							html = e.toString();
	
						}
						
						router.cacheSet( req, res, html , params );
						router.cacheUse( req, res, null, params );

					} );
					

				} else {

					// Send function and params to cache.
					console.log( 'Caching dynamic page' );
					for ( var point in data ) {

						page[ point ] = data[ point ];

					}
					router.cacheSet( req, res, fn, page, params );
					router.cacheUse( req, res, data, params );

				}

			} else next();

		} );

	};

	router.emptyCache = function() {

		router.cache = {};
		core.theme.templateCache = {};

	};

	router.start = function() {
		
		router.initApp( app );
		app.listen( core.config.router.port );

	};

	router.initApp = function( app ) {

		core.plugins.startPlugins( core, app );

		app.use( bodyParser.json() );

		app.use( bodyParser.urlencoded( {
			extended: true
		} ) );
	
		app.use(
			'/static',
			express.static(
				path.resolve(
					core.config.router.staticURL
				)
			)
		);
	
		app.get( '/pages', function( req, res, next ) {

			var newPath = '/';
			if( req.query.edit )
				newPath += '?edit=1';
			res.redirect( newPath );
	
		} );
	
		app.get( '/pages/*', function( req, res, next ) {
	
			var path = req._parsedUrl.pathname.substr( 6 );
			var lastChar = path.substr( path.length - 1, path.length );
			if ( lastChar == '/' && path != '/' ) path = path.substr( 0, path.length - 1 );
			if ( req.query.edit == true ) {
	
				core.db.getPage( { "url == ": path, 'admin ==': 0 } ).then( function( pageData ) {
	
					router.sendStaticPage(
						req,
						res,
						next,
						{ "url == ": '/edit', 'admin ==': 1 },
						{ site: site.general, admin: site.admin, editPage: pageData },
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
					{ site: site.general }
				);
	
			}
	
		} );
	
		app.post( '/pages/*', function( req, res, next ) {
	
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

			if ( req.query.edit == true ) {
	
				core.db.getPage( { "url == ": '/', 'admin ==': 0 } ).then( function( pageData ) {
	
					router.sendStaticPage(
						req,
						res,
						next,
						{ "url == ": '/edit', 'admin ==': 1 },
						{ site: site.general, admin: site.admin, editPage: pageData },
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
					{ site: site.general }
				);
			}

		} );
	
		app.post( '/', function( req, res, next ){
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

		app.put( '/template/:id', function( req, res, next ) {
			var key = req.params.id;
			var form = req.body;
			console.log( key, form );

			
			if ( ! form.data ) {
	
				res.status( 400 );
				res.send( { status: 0, error: "Template must contain string" } );
				return false;
	
			}
			
			core.theme.setTemplateFromString( key, form.data, function( err ) {
				if( err ) {
					res.status( 400 );
					res.send( { status: 0, error: err.message } );
				} else {
					core.theme.initTemplates( function( err ) {
						if( err ) {
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
			console.log( key, form );

			
			if ( ! form.data ) {
	
				res.status( 400 );
				res.send( { status: 0, error: "Template must contain string" } );
				return false;
	
			}
			
			core.theme.setTemplateFromString( key, form.data, function( err ) {
				if( err ) {
					res.status( 400 );
					res.send( { status: 0, error: err.message } );
				} else {
					core.theme.initTemplates( function( err ) {
						if( err ) {
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
				if( err ) {
					res.status( 400 );
					res.send( { status: 0, error: err.message } );
				} else {
					core.theme.initTemplates( function( err ) {
						if( err ) {
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
					{ site: site.general, admin: site.admin, editPage: pageData },
					true
				);

			}, function( err ) {

				res.status( 404 );
				res.send( err );

			} );
		} )

		app.get( '/admin/templates', function( req, res, next ) {
		    router.sendStaticPage(
				req,
				res,
				next,
				{ "url == ": '/templates', 'admin ==': 1 },
				{ site: site.general, admin: site.admin },
				true
			);
		} );

		app.get( '/debug/db', function( req, res ) {

			var table = 'pages';
			if( req.query.table ) table = req.query.table;
			
			var query = req.query.query? req.query.query : 'SELECT * FROM ' + table;
			
			console.log( query );
			
			core.db._All( query, {} ).then( function( row ) {
	
				res.send( '<pre>' + JSON.stringify( row, '\n', 4 ) + '</pre>' );
	
			}, function( err ) {

				console.log( err );
				res.send( err );

			} );
	
		} );
		
		app.get( '/debug/db/update', function(req, res, next) {
			
		} )
		
		app.get( '/debug/core', function( req, res ) {
			res.send( core );
		} );
	
		app.get( '/debug/template', function(req, res, next) {
		
			var templates = [];
			
			for( var i in core.theme.templateCache ) {
				templates.push( i );
			}
			
			res.send(templates);
		
		} );

		app.get( '/admin/', function( req, res, next ) {
	
			router.sendStaticPage(
				req,
				res,
				next,
				{ "url == ": '/admin', 'admin !=': 0 },
				{ site: site.general, admin: site.admin }
			);
	
		} );
		
		app.get( '/admin/template', function( req, res, next ) {
	
			router.sendStaticPage(
				req,
				res,
				next,
				{ "url == ": '/template', 'admin !=': 0 },
				{ site: site.general, admin: site.admin }
			);
	
		} );
	
		app.get( '/admin/pages', function( req, res, next ) {
	
			var offset = isNaN( + req.query.offset ) ? 0 : ( + req.query.offset );
			var query =  { "admin == ": 0 };
			var order = { date: false };
			var search = req.query.search;
			if( search ) {
				query[ "title LIKE $title OR url LIKE " ] = '%' + search + '%';
			}
			if( req.query.order ) {
				order = {}
				order[ req.query.order ] = false;
				if( req.query.by ) {
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
					{ site: site.general, admin: site.admin, pages: row }
				)
	
			}, function( err ) {
	
				res.status( 404 );
				res.send( err );
	
			} );
	
		} );
	
		app.all( '/*', function( req, res ) {
	
			res.status( 404 );
			res.send( '404 :C' );
	
		} );

		core.plugins.endPlugins( core, app );


	};

	router.start( callback );

	return router;

};
