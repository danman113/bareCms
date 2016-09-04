var q = require( 'q' );
var fs = require( 'fs' );
var jade = require( 'jade' );
var path = require( 'path' );


module.exports = function( core, callback ) {

	var theme = {
		admin: {},
		templates: [],
		templateCache:{}
	};

	console.log( 'Theme' );

	theme.addAdminPageFromFile = function( url, filepath, template, name ) {

		filepath = path.resolve( core.config.theme.folder, filepath )
		name = name ? name : url.substr( 1 );
		template = template? template : 'blank';

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
							{ data: html, date: ( new Date() ).getTime(), template: template }
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
					template: template,
					cache: 0,
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

		filepath = path.resolve( core.config.theme.folder, filepath )
		var html = "";
		var valid = true;

		try {

			html = fs.readFileSync( filepath, 'utf8' );

		} catch ( e ) {

			valid = false;
			html = e.toString();

		}

		if ( valid ) {
			
			var fn;
			try{
				
				fn = jade.compile( html );
				
			} catch( e ){

				fn = function(){ return e.toString(); };

			}
			
			theme.admin[ field ] = fn;
		}
	};
	
	theme.initTheme = function() {
		try {
			require(
				path.resolve(
					core.config.theme.folder,
					core.config.theme.theme,
					'index.js'
				)
			)( core, theme );
		} catch( e ) {
			console.log( 'Error setting theme!' );
		}
		
		theme.initTemplates( function(){} );
	};
	
	theme.useTemplate = function( key, callback ) {
		if( key in theme.templateCache ) {
			callback( theme.templateCache[ key ] );
		} else {
			theme.getTemplate( key, function() {
				console.log( 'Caching template: ' + key );
				callback( theme.templateCache[ key ] );

			} );
		}
	};
	
	theme.getTemplate = function( key, callback ) {
		// Get from db
		core.db.getPage( { 'title == ': key, 'admin != ': 0, "url LIKE ": "__template__%" } ).then( function( page ) {

			var fn = null;
			var valid = true;

			try {

				fn = jade.compile( page.data );

			} catch ( e ) {

				valid = false;
				fn = function(){ return e.toString() };

			}
			
			if( !page ) fn = function(){ return "Template " + key + ' Undefined' };

			theme.templateCache[ key ] = fn;
			callback();

		}, function( err ) {

			var fn = function(){ return err.toString() };
			theme.templateCache[ key ] = fn;
			
			callback();

		} );
	};

	theme.setTemplateFromString = function( key, string, callback ) {
		
		var html = string;
		
		callback = typeof callback == "function"? callback : function(){};

		core.db.getPage( { 'title == ': key, 'admin != ': 0 } ).then( function( page ) {
			if ( page ) {

				if ( page.data == html ) {

					console.log( 'Template up to date.' );
					callback();

				} else {

					core.db.update(
						'pages',
						{ 'title == ': key },
						{ data: html, date: ( new Date() ).getTime() }
					).then( function() {

						console.log( 'Updated template!' );
						callback();

					}, function( err ) {
						callback( err );
					} );

				}

			} else {

				core.db.insertPage( {
					title: key,
					url: '__template__' + ( new Date() ).getTime(),
					data: html,
					date: ( new Date() ).getTime(),
					options: JSON.stringify( {} ),
					admin: 1,
					cache: 0,
				} ).then( function() {

					console.log( 'Inserted template: ' + key );
					callback();

				}, function( e ) {

					console.log( 'Failed to insert to ' + key, e );
					callback( e );

				} );

			}
		} );
	};
	
	theme.setTemplate = function( key, filepath, admin ) {
		// set in DB
		admin = admin !== undefined? admin : 1 ; 
		filepath = path.resolve( core.config.theme.folder, filepath );
		core.db.getPage( { 'title == ': key, 'admin == ': admin } ).then( function( page ) {

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

						console.log( 'Template up to date.' );

					} else {

						core.db.update(
							'pages',
							{ 'title == ': key },
							{ data: html, date: ( new Date() ).getTime() }
						).then( function() {

							console.log( 'Updated template!' );

						} );

					}

				} else {

					console.log( 'Invalid read. Not updating.' );

				}

			} else {

				core.db.insertPage( {
					title: key,
					url: '__template__' + ( new Date() ).getTime(),
					data: html,
					date: ( new Date() ).getTime(),
					options: JSON.stringify( {} ),
					admin: admin,
					cache: 0,
				} ).then( function() {

					console.log( 'Inserted template: ' + key );

				}, function( e ) {

					console.log( 'Failed to insert to ' + key, e );

				} );

			}

		}, function( err ) {

			console.log( 'Error searching for theme page: ', err );

		} );

	};
	
	theme.initTemplates = function( callback ) {
		
		core.db.get( 'pages', [ 'title' ], { 'url LIKE ': '__template__%', 'admin == ': 1 } ).then( function( data ) {
			theme.templates = [];
			theme.admin.templates =  function(){ return theme.templates;};
			for( var i = 0; i < data.length; i++ ) {
				theme.templates.push( data[ i ].title );
			}

			callback();

		}, function( err ) {

			callback( err )

		} );

	};
	
	theme.deleteTemplate = function( key, callback ) {
		
		var templateQuery = { 'title == ': key, 'admin != ': 0, "url LIKE ": "__template__%" };
		
		core.db.getPage( templateQuery ).then( function( page ) {

			delete templateQuery["url LIKE "];
			templateQuery["url == "] = page.url;
			core.db.delete( 'pages', templateQuery ).then( function(){
				callback();
			}, function( err ) {
				callback( err );
			} );

		}, function( err ) {

			callback( err );

		} );
	};
	
	theme.setTemplateFromString( 'blank', '!{pageData}' );
	theme.initTheme();
	callback();
	return theme;

};
