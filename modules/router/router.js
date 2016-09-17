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
		settingsCache: {},
		loginRequests: {},
		filters: []
	};

	var site = {
		admin: core.theme.admin,
		general: {}
	};

	router.site = site;

	/**
	 * Use the cache to send a cached page. 
	 * @param  {Object} req       Req object to get url info
	 * @param  {Object} res       Res object to send cached data
	 * @param  {Object} extraData Extra data to add to the template
	 * @param  {Boolean} params   Do the params change which page will be used?
	 */
	router.cacheUse = function( req, res, extraData, params ) {

		var params, path;
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

	/**
	 * Set the cache for a specific page.
	 * @param  {Object}   req    Req Object
	 * @param  {Object}   res    Res Object
	 * @param  {Function} fn     Template function
	 * @param  {Object}   data   Data to pass to template function
	 * @param  {Boolean}  params Does the url use params?
	 */
	router.cacheSet = function( req, res, fn, data, params ) {

		fn.data = data;
		var path;
		if ( params )
			path = req.url;
		else
			path = req._parsedUrl.pathname;
		router.cache[ path ] = fn;

	};

	/**
	 * Sends the desired template.
	 * @param  {Object}   req  Req object
	 * @param  {Object}   res  Res object
	 * @param  {Function} fn   Template function
	 * @param  {Object}   data Data to be passed into template.
	 */
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

	/**
	 * Sends a static page from a template, using the cache as necessary.
	 * @param  {Object}   req     Req object
	 * @param  {Object}   res     Res object
	 * @param  {Function} next    Next function
	 * @param  {Object}   selects Selects to find the specific page
	 * @param  {Object}   data    Data to feed into the template
	 * @param  {Boolean}  params  Does the url use params
	 */
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

					fn = core.theme.compile( page.data );

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

						router.cacheSet( req, res, html, params );
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

	/**
	 * Loads the settings db to memory]
	 */
	router.getSettings = function() {

		core.db.getSettings().then( function( data ) {

			for ( var i = 0; i < data.length; i ++ ) {

				try {

					router.settingsCache[ data[ i ].name ] = JSON.parse( data[ i ].option );

				} catch ( e ) {

					router.settingsCache[ data[ i ].name ] = data[ i ].option;

				}

			}
			console.log( 'Set Settings' );
			site.general.settings = router.settingsCache;

		}, function( err ) {

			console.log( 'Error setting settings! ', err );

		} );

	};

	/**
	 * Empties various caches
	 */
	router.emptyCache = function() {

		router.cache = {};
		core.theme.templateCache = {};
		router.settingsCache = {};

	};

	/**
	 * Starts the routes and inits the app.
	 */
	router.start = function() {

		router.initApp( app );
		app.listen( core.config.router.port );

	};

	/**
	 * Function that gets called on all redirects
	 * @param  {Object}   req  Req object
	 * @param  {Object}   res  Res object
	 * @param  {Function} next Next function
	 */
	router.redirectLogin = function( req, res, next ) {

		router.setRedirect( req, req._parsedUrl.pathname );
		router.setToast( req, "You must log in to view that page!" );
		res.redirect( '/login' );

	};

	/**
	 * Function that redirects if user is not logged in
	 * @param  {Object}   req  Req object
	 * @param  {Object}   res  Res object
	 * @param  {Function} next Next function
	 * @return {Boolean}       True if user is logged in.
	 */
	router.requireLogin = function( req, res, next ) {

		if ( req.session.login ) {

			return true;

		} else {

			router.redirectLogin( req, res, next );
			return false;

		}

	};

	/**
	 * Sets redirect of session. 
	 * @param {Object} req Req object to append to session
	 * @param {String} url URL to redirect user to.
	 */
	router.setRedirect = function( req, url ) {

		req.session.redirect = url;

	};

	/**
	 * Gets the redirect and deletes it from the user session.
	 * @param  {Object} req Req Object
	 * @return {String}     Redirect URL
	 */
	router.getRedirect = function( req ) {

		var redirect = req.session.redirect;

		delete req.session.redirect;

		return redirect;

	};

	/**
	 * Sets the login using the session
	 * @param {Object} req  Req object
	 * @param {Object} data User data
	 */
	router.setLogin = function( req, data ) {

		var user = { username: data.username };

		router.setToast( req, 'Registration is currently open, you should consider closing it for security reasons.' )

		req.session.login = user;

	};

	/**
	 * Retrieves and deletes toasts
	 * @param  {Object} req Req object
	 * @return {Array}      Toast array
	 */
	router.getToasts = function( req ) {

		if ( req.session.toasts ) {

			var toasts = req.session.toasts;
			req.session.toasts = [];
			return toasts;

		} else {

			return [];

		}

	};

	/**
	 * Adds a toast
	 * @param {Object} req   Req object
	 * @param {String} toast Toast to add
	 */
	router.setToast = function( req, toast ) {

		if ( ! req.session.toasts ) {

			req.session.toasts = [ toast ];

		} else {

			req.session.toasts.push( toast );

		}

	};

	/**
	 * Shortcut to get cleint address
	 * @param  {Object} req Req object
	 * @return {String}     Client IP address
	 */
	router.getClientAddress = function( req ) {

		return ( req.headers[ 'x-forwarded-for' ] || '' ).split( ',' )[ 0 ]
		|| req.connection.remoteAddress;

	};

	/**
	 * Limits the how many times someone can attempt to access a page.
	 * @param  {Object}   req  Req object
	 * @param  {Object}   res  Res object
	 * @param  {Function} next Next function
	 */
	router.limitAttempts = function( req, res, next ) {

		var ip = router.getClientAddress( req );
		if (
				! ( ip in router.loginRequests ) ||
				router.loginRequests[ ip ].lastAttempt + core.config.router.loginTimeout
				< ( new Date() ).getTime()
			)
		{

			router.loginRequests[ ip ] = { attempts: 1, lastAttempt: ( new Date() ).getTime() };
			return router.loginRequests[ ip ];

		}

		var data = router.loginRequests[ ip ];
		if ( data.attempts >= core.config.router.loginAttempts ) {

			return false;

		} else {

			data.attempts ++;
			data.lastAttempt = ( new Date() ).getTime();
			return data;

		}

	};

	/**
	 * Inits the routes of the app.
	 * @param  {Object} app App object to add routes too
	 */
	router.initApp = function( app ) {

		init( app, router, core, site );

	};


	router.start( callback );

	return router;

};


function init( app, router, core, site ) {

	core.plugins.startPlugins( core, app, router, core.theme );

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

	
	core.plugins.endPlugins( core, app, router, core.theme );

	app.all( '/*', function( req, res ) {

		res.status( 404 );
		res.send( '404 :C' );

	} );

}
