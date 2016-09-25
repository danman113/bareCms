var multer = require( 'multer' );
var fs = require( 'fs-extra' );
var path = require( 'path' );

module.exports = function( core, app, router, theme ) {

	var storage = multer.diskStorage({
		destination: function ( req, file, cb ) {
			var dest = path.join( core.config.router.staticURL, req.body.folder );
			console.log( '=====', dest );
			cb( null, dest );
		},
		filename: function ( req, file, cb ) {
			console.log( 'Saving ' + file.fieldname + '!' );
			cb( null, file.originalname );
		}
	});

	var upload = multer({ storage: storage });

	app.use( '/files', function( req, res, next ) {

		res.set( 'Cache-Control', 'private, no-cache, no-store, must-revalidate' );
		if ( ! router.requireLogin( req, res, next ) )
			return false;
		next();

	} );

	app.use( '/files/upload', function( req, res, next ) {

		if( !req.body.folder ) req.body.folder = '';

		next();

	} );

	app.post( '/files/upload', upload.array('uploads'), function( req, res, next ) {

		console.log( req.files, req.file );

		var toast = 'File' + ( req.files.length > 1? 's' :'' ) + ' uploaded: ';

		for (var i = req.files.length - 1; i >= 0; i--) {
		 	toast += req.files[ i ].originalname + ' ';
		}

		router.setToast( req, toast );

		res.status( 201 );
		res.send( { status: 1 } );

	} );

	app.put( '/files/upload', function( req, res, next ){
		if( req.body.folderName ) {
			var folderPath = path.join(
				core.config.router.staticURL,
				req.body.folder,
				req.body.folderName
			);
			fs.mkdir( folderPath, function( err ) {
				if( err ) res.send( { status: 0, error: err.toString() } );
				else {
					res.status( 201 );
					res.send( { status: 1 } );
				}
			} );
		} else {
			res.send( { status: 0, error: "Folder must have a name" } );
		}
	});

	app.delete( '/files/delete/*', function( req, res, next ) {

		var pwd = req._parsedUrl.pathname.substr( 13 );
		var lastChar = pwd.substr( pwd.length - 1, pwd.length );
		if ( lastChar == '/' ) pwd = pwd.substr( 0, pwd.length - 1 );
		pwd = decodeURI( pwd );

		var dest = path.join( core.config.router.staticURL, pwd );

		fs.stat( dest, function( err, stat ) {
			if( err ) {
				res.send( { status: 0, error: err.toString() } );
				return false;
			}

			fs.remove( dest, function( err ) {
				if( err ) {
					res.send( { status: 0, error: err.toString() } );
					return false;
				} else {
					res.send( { status: 1 } );
				}
			} );

		} );
	} );


	app.get( ['/admin/files/*' ,'/admin/files' ], function( req, res, next ) {

		var pwd = req._parsedUrl.pathname.substr( 12 );
		var lastChar = pwd.substr( pwd.length - 1, pwd.length );
		if ( lastChar == '/' ) pwd = pwd.substr( 0, pwd.length - 1 );

		getFolderInfo( pwd, function( err, files ) {
			if( err ){
				res.send( {status: 0, error: err} );
				return false;
			}
			router.sendStaticPage(
				req,
				res,
				next,
				{ "url == ": '/fileBrowser', 'admin !=': 0 },
				{ site: router.site.general, admin: router.site.admin, toasts: router.getToasts( req ), files: files, pwd: pwd  }
			);
		} );

	} );

	app.get( '/admin/upload', function( req, res, next ) {

		router.sendStaticPage(
			req,
			res,
			next,
			{ "url == ": '/upload', 'admin !=': 0 },
			{ site: router.site.general, admin: router.site.admin, toasts: router.getToasts( req ) }
		);

	} );

	function getFolderInfo( pwd, callback ){
		var dest = path.join( core.config.router.staticURL, pwd );
		var back = pwd.split( '/' );
		back.splice( -1, 1 );

		var backFolder = {
			folder: true,
			name: '..',
			url: '/admin/files' + back.join( '/' ),
			path: back.join( '/' ),
			size: 0,
			dateModified: (new Date()).getTime(),
			error: false
		};

		fs.readdir( dest, function( err, data ) {
			if( err ) {
				callback( err );
				return false;
			} else if ( data.length <= 0 ) {
				callback( null, [ backFolder ] );
			}

			var directory = [];
			var j = 0;

			for ( var i = 0; i < data.length; i++ ) {
				directory.push( data[ i ] );
				( function( index ) {
					fs.stat( path.join( dest, data[ index ] ), function( err, stat ) {
						
						j++;
						var folder = stat.isDirectory();
						var localpath = pwd + '/' + data[ index ];

						directory[ index ] = {
							folder: folder,
							name: data[ index ],
							url: folder? ( '/admin/files' + localpath ) : ( '/static' + localpath ),
							path: localpath,
							size: stat.size,
							dateModified: stat.mtime,
							error: ( ( !folder && !stat.isFile() ) || err == true )
						};

						if( j >= directory.length ) {
							directory.unshift( backFolder );
							callback (null, directory );
						}

					} );
				} )( i );
			}
		} );
	}

};