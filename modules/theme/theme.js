var q = require( 'q' );
var fs = require( 'fs' );
var jade = require( 'jade' );
var path = require( 'path' );


module.exports = function( core, callback ) {

	var theme = {
		admin: {}
	};

	console.log( 'Theme' );

	theme.addAdminPageFromFile = function( url, filepath, name ) {

		filepath = path.resolve( path.dirname( require.main.filename ), filepath )
		name = name ? name : url.substr( 1 );

		core.db.getPage( { 'url == ': url, 'admin != ': 0 } ).then( function( page ) {

			var html = "";
			var valid = true;

			try {

				html = fs.readFileSync( filepath, 'utf8' );

			} catch ( e ) {

				valid = false;
				html = e.toString();

			}

			if ( page ) {

				if ( valid ) {

					if ( page.data == html ) {

						console.log( 'Theme up to date.' );

					} else {

						core.db.update(
							'pages',
							{ 'url == ': url },
							{ data: html, date: ( new Date() ).getTime() }
						).then( function() {

							console.log( 'Updated theme!' );

						} );

					}

				} else {

					console.log( 'Invalid read. Not updating.' );

				}

			} else {

				core.db.insertPage( {
					title: name,
					url: url,
					data: html,
					date: ( new Date() ).getTime(),
					options: JSON.stringify( {} ),
					admin: 1,
					cache: 1,
				} ).then( function() {

					console.log( 'Inserted ' + url );

				}, function( e ) {

					console.log( 'Failed to insert to ' + url, e );

				} );

			}

		}, function( err ) {

			console.log( 'Error searching for theme page: ', err );

		} );

	};

	theme.addFieldFromFile = function( field, filepath ) {

		filepath = path.resolve( path.dirname( require.main.filename ), filepath )
		var html = "";
		var valid = true;

		try {

			html = fs.readFileSync( filepath, 'utf8' );

		} catch ( e ) {

			valid = false;
			html = e.toString();

		}

		if ( valid )
			theme.admin[ field ] = jade.compile( html );

	};

	theme.addFieldFromFile( 'nav', './themes/default/nav.jade' );
	theme.addFieldFromFile( 'head', './themes/default/adminHead.jade' );
	theme.addAdminPageFromFile( '/admin', './themes/default/admin.jade' );
	theme.addAdminPageFromFile( '/admin/pages', './themes/default/pages.jade' );
	theme.addAdminPageFromFile( '/404', './themes/default/404.jade' );

	callback();
	return theme;

}
