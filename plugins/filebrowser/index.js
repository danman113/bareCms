var multer = require( 'multer' );
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

	app.post( '/files/upload', function( req, res, next ) {

		if( !req.body.folder ) req.body.folder = '';

		next();

	} );

	app.post( '/files/upload', upload.array('uploads'), function( req, res, next ) {

		console.log( req.files, req.file );

		res.send( { status: 1 } );

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

	console.log( 'Upload plugin set!' );

};