var q = require( 'q' );
var express = require( 'express' );
var path = require( 'path' );
var app = express();
var bodyParser = require( 'body-parser' );
var session = require( 'express-session' );
var jade = require( 'jade' );
var fs = require( 'fs' );


module.exports = function( core, callback ) {

	var router = {
		app: app,
		cache: {},
		settingsCache:{},
		loginRequests: {},
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

	router.getSettings = function() {
		core.db.getSettings().then( function( data ) {
			for( var i = 0; i < data.length; i++ ) {
				try {
					router.settingsCache[ data[i].name ] = JSON.parse( data[i].option );
				} catch( e ) {
					router.settingsCache[ data[i].name ] = data[i].option;
				}
			}
			console.log( 'Set Settings' );
			site.general.settings = router.settingsCache;
		}, function( err ) {
			console.log( 'Error setting settings! ', err );
		} );
	};

	router.emptyCache = function() {

		router.cache = {};
		core.theme.templateCache = {};
		router.settingsCache = {};

	};

	router.start = function() {

		router.initApp( app );
		app.listen( core.config.router.port );

	};
	
	router.redirectLogin = function( req, res, next ) {

		router.setRedirect( req, req._parsedUrl.pathname );
		router.setToast( req, "You must log in to view that page!" )
		res.redirect( 301, '/login' );

	};

	router.requireLogin = function( req, res, next ) {

		if( req.session.login ) {
			return true;
		} else {
			router.redirectLogin( req, res, next );
			return false;
		}

	};
	
	router.setRedirect = function( req, url ) {
		req.session.redirect = url;
	}
	
	router.getRedirect = function( req ) {
		var redirect = req.session.redirect;
		
		delete req.session.redirect;
		
		return redirect;
	}
	
	router.setLogin = function( req, data ) {

		var user = { username: data.username };
		req.session.login = user;

	};
	
	router.getToasts = function( req ) {
		if( req.session.toasts ) {
			var toasts = req.session.toasts;
			req.session.toasts = [];
			return toasts;
		} else {
			return [];
		}
	};
	
	router.setToast = function( req, toast ) {
		if( !req.session.toasts ) {
			req.session.toasts = [ toast ];
		} else {
			req.session.toasts.push( toast );
		}

	};

	router.getClientAddress = function ( req ) {
		return ( req.headers[ 'x-forwarded-for' ] || '' ).split( ',' )[ 0 ] 
		|| req.connection.remoteAddress;
	};
	
	router.limitAttempts = function( req, res, next ) {
		
		var ip = router.getClientAddress( req );
		if (
				!(ip in router.loginRequests) || 
				router.loginRequests[ ip ].lastAttempt + core.config.router.loginTimeout
				< (new Date()).getTime()
			)
		{
			router.loginRequests[ ip ] = { attempts: 1, lastAttempt: (new Date()).getTime() };
			return router.loginRequests[ ip ];
		}
		
		var data = router.loginRequests[ ip ];
		if( data.attempts >= core.config.router.loginAttempts ) {
			return false;
		} else {
			data.attempts++;
			data.lastAttempt = (new Date()).getTime();
			return data;
		}
		
	};

	router.initApp = function( app ){
		init( app, router, core, site );
	};
	
	
	router.start( callback );

	return router;

};


function init( app, router, core, site ) {

		core.plugins.startPlugins( core, app );
		
		router.getSettings();

		app.use( bodyParser.json() );

		app.use( bodyParser.urlencoded( {
			extended: true
		} ) );
		
		app.use(
			session(
				{
					secret: core.config.router.sessionSecret,
					name: core.config.router.sessionName,
					resave: false,
					saveUninitialized: false,
					cookie:
					{
						secure: core.config.router.sessionSecure,
						maxAge: core.config.router.sessionAge
					}
				}
			)
		);
	
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
	
			if( !router.requireLogin( req, res, next ) )
				return false
			
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
	
			if( !router.requireLogin( req, res, next ) )
				return false

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
	
			if( !router.requireLogin( req, res, next ) )
				return false
			
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
		
		app.get( '/login', function( req, res, next ) {

			var attempts = router.loginRequests[ router.getClientAddress( req ) ];

			var toasts = router.getToasts( req );

			router.sendStaticPage(
				req,
				res,
				next,
				{ "url == ": '/login', 'admin != ': 0 },
				{ site: site.general, admin: site.admin, attempts: attempts, toasts: toasts }
			);

		} );
		
		app.put( '/login', function( req, res, next ){
			
			res.send( {status: 0, error: "You lack sufficient privilege to perform that action. Please login. "} )
			
		} );

		app.post( '/login', function( req, res, next ) {

			var error = { status: 0, error: "Username/Password combination does not exist." };
			
			var username = req.body.username;
			
			var password = req.body.password;
			
			var attempt = router.limitAttempts( req, res, next );
			if( !attempt ) {
				var attempts = router.loginRequests[ router.getClientAddress( req ) ];
				res.status( 400 );
				error.error = "Too many attempts!";
				res.send( error );
				return false;
			}
			
			core.db.login( username, password ).then( function( pass ) {
				if( pass ) {
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
		} )

		app.post( '/register', function( req, res, next ) {

			var error = { status: 0, error: "Username/Password combination does not exist." };
			
			var username = req.body.username;
			
			var password = req.body.password;
			var password2 = req.body.password2;
			
			var attempt = router.limitAttempts( req, res, next );
			if( !attempt ) {
				var attempts = router.loginRequests[ router.getClientAddress( req ) ];
				res.status( 400 );
				error.error = "Too many attempts!";
				res.send( error );
			}
			
			if( password != password2 ) {
				res.status( 400 );
				error.error = ("Passwords not equal!");
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

			router.sendStaticPage(
				req,
				res,
				next,
				{ "url == ": '/register', 'admin !=': 0 },
				{ site: site.general, admin: site.admin }
			);

		} );

		app.delete( '/register', function( req, res, next ) {

			if( !router.requireLogin( req, res, next ) )
				return false

			var error = { status: 0, error: "Username/Password combination does not exist." };
			
			var username = req.body.username;
			
			var password = req.body.password;
			
			var data = { username: username, password: password };
			
			core.db.login( username, password ).then( function( data ) {
				if( data ) return core.db.removeUser( username ); 
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

		app.use( '/settings/*', function( req, res, next ) {

			if( router.requireLogin( req, res, next ) )
				next();

		} );

		app.post( '/settings', function( req, res, next ) {

			var value = req.body;
			
			var newSettings = [];
			
			for( var key in req.body ) {
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

		app.use( '/template/*', function( req, res, next ) {

			if( router.requireLogin( req, res, next ) )
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
	
		app.use( '/debug/*', function( req, res, next ) {

			if( router.requireLogin( req, res, next ) )
				next();

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
		
		app.get( '/debug/hash', function( req, res, next ) {
			console.log( req.query.pass.length );
			console.time( 'passHash' );
			
			core.db.addUser( {password: req.query.pass, username: req.query.user} ).then( function( hash ) {
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
		
		app.use( '/admin/*', function( req, res, next ) {

			if( router.requireLogin( req, res, next ) )
				next();

		} );

		app.get( '/admin/', function( req, res, next ) {
	
			var re = router.getRedirect( req );
			if( re )
				res.redirect( 301, re );
	
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
		
		app.get( '/admin/settings', function( req, res, next ) {

			core.db.getSettings().then( function( data ) {

				router.sendStaticPage(
					req,
					res,
					next,
					{ "url == ": '/settings', 'admin ==': 1 },
					{ site: site.general, admin: site.admin, settings: data },
					true
				);

			}, function( err ) {
				
				res.send( err );

			} );

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
