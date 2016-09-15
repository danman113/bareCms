var sqlite3 = require( 'sqlite3' ).verbose();
var q = require( 'q' );
var path = require( 'path' );
var squel = require( 'squel' );


module.exports = function( core, callback ) {

	var db = {
		db: new sqlite3.Database(
			path.resolve( core.config.db.filename ),
			callback
		)
	};

	db.close = function() {

		var deffered = q.defer();
		db.db.close( function( err ) {

			if ( err ) deffered.reject( err );
			else deffered.resolve();

		} );
		return deffered.promise;

	};

	db._All = function( query, params ) {

		var deffered = q.defer();
		db.db.all( query, params, function( err, row ) {

			if ( err ) deffered.reject( err );
			else deffered.resolve( row );

		} );
		return deffered.promise;

	};

	db._Get = function( query, params ) {

		var deffered = q.defer();
		db.db.get( query, params, function( err, row ) {

			if ( err ) deffered.reject( err );
			else deffered.resolve( row );

		} );
		return deffered.promise;

	};

	db._Run = function( query, params ) {

		var deffered = q.defer();
		db.db.run( query, params, function( err, data ) {

			if ( err ) deffered.reject( err );
			else deffered.resolve( data );

		} );
		return deffered.promise;

	};

	db.get = function( table, selects, wheres, orders, limit, offset ) {

		var query = squel.select( { autoQuoteFieldNames: true } ).from( table );
		var params = {};
		orders = orders ? orders : {};
		var single = false;

		for ( var i = 0; i < selects.length; i ++ ) {

			query.field( selects[ i ] );

		}
		for ( var key in wheres ) {

			var q = key.split( ' ' )[ 0 ];
			query.where( key + ' $' + q );
			params[ '$' + q ] = wheres[ key ];

		}

		for ( var order in orders ) {

			query.order( order, orders[ order ] );

		}

		if ( ! isNaN( + limit ) ) {

			if ( + limit == 1 ) single = true;
			else query.limit( + limit );

		}

		if ( ! isNaN( + offset ) ) {

			query.offset( + offset );

		}

		// console.log( query.toString() );

		if ( single ) {

			return db._Get( query.toString(), params );

		} else {

			return db._All( query.toString(), params );

		}

	};

	db.update = function( table, wheres, data ) {

		var query = squel.update( { autoQuoteFieldNames: true } ).table( table );
		var params = {};
		var defaultData = {};

		for ( var newData in data ) {

			defaultData[ newData ] = data[ newData ];

		}

		for ( var key in wheres ) {

			var q = key.split( ' ' )[ 0 ];
			query.where( key + '$' + q );
			params[ '$' + q ] = wheres[ key ];

		}

		for ( var val in defaultData ) {

			query.set( val, squel.str( '@' + val ) );
			params[ '@' + val ] = defaultData[ val ];

		}

		return db._Run( query.toString(), params );

	};

	db.insert = function( table, data ) {

		var query = squel.insert().into( table )
		var params = {};

		for ( var field in data ) {

			query.set( field, squel.str( '$' + field ) );
			params[ '$' + field ] = data[ field ];

		}

		return db._Run( query.toString(), params );

	};

	db.delete = function( table, wheres ) {

		var query = squel.delete().from( table );
		var params = {};
		var single = false;

		for ( var key in wheres ) {

			var q = key.split( ' ' )[ 0 ];
			query.where( key + '$' + q );
			params[ '$' + q ] = wheres[ key ];

		}

		// console.log( query.toString(), params );
		return db._Run( query.toString(), params );

	};

	db.create = function() {

		var deffered = q.defer();
		var pages = 'CREATE TABLE pages (' +
			'id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
			'title VARCHAR(100), ' +
			'url VARCHAR(100) UNIQUE, ' +
			'data TEXT, ' +
			'author INTEGER, ' +
			'date DATETIME, ' +
			'options TEXT, ' +
			'admin INTEGER, ' +
			'template VARCHAR(100), ' +
			'cache INTEGER' +
			');';
		var users = 'CREATE TABLE users (' +
			'id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
			'username VARCHAR(100) UNIQUE, ' +
			'info TEXT, ' +
			'password VARCHAR(100), ' +
			'level INTEGER, ' +
			'date DATETIME, ' +
			'options TEXT' +
			');';
		var settings = 'CREATE TABLE settings (' +
			'id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
			'name VARCHAR(100) UNIQUE , ' +
			'option TEXT, ' +
			'level INTEGER, ' +
			'date DATETIME' +
			');';

		q.all(
			[
				db._Run( pages, {} ),
				db._Run( users, {} ),
				db._Run( settings, {} )
			]
		).then( function() {

			console.log( 'Creates successful' );
			deffered.resolve();

		} ).fail( function( err ) {

			console.log( 'Create error' );
			deffered.reject( err );

		} );
		return deffered.promise;

	};

	db.getPage = function( wheres ) {

		return db.get( 'pages', [ '*' ], wheres, {}, 1 );

	};

	db.insertPage = function( data ) {

		var defaultData = {
			url: '/dev/null',
			title: 'new_page',
			data: '| Default Page',
			author: null,
			date: ( new Date() ).getTime(),
			options: '{}',
			admin: 0,
			template: 'blank',
			cache: 1
		}

		for ( var i in data ) {

			defaultData[ i ] = data[ i ]

		}

		// console.log( defaultData );
		return db.insert( 'pages', defaultData );

	};

	db.insertSetting = function( data ) {

		var defaultData = {
			name: 'key',
			option: 'value',
			date: ( new Date() ).getTime(),
			level: 0
		};

		for ( var i in data ) {

			defaultData[ i ] = data[ i ]

		}

		return db.insert( 'settings', defaultData );

	};

	db.defineSetting = function( key, value ) {

		return db.get(
			'settings',
			[ '*' ],
			{
				"name == ": key
			},
			null,
			1
		).then( function( data ) {

			if ( ! data ) {

				console.log( 'Inserted setting: ' + key );
				return db.insertSetting( { name: key, option: value } );

			}
			console.log( 'Setting up to date: ' + key );

		}, function( err ) {

			console.log( 'Error getting settings', err );

		} );

	};

	db.updateSetting = function( key, value ) {

		return db.update(
			'settings',
			{
				"name == ": key
			},
			{
				name: key,
				option: value
			}
		);

	};

	db.deletePage = function( page ) {

		return db.delete(
			'pages',
			{ 'url == ': page, 'admin == ': 0 }
		)

	};

	db.updatePage = function( page, data ) {

		return db.update(
			'pages',
			{ 'url == ': page, 'admin == ': 0 },
			data
		)

	};

	db.getSettings = function() {

		return db.get( 'settings', [ '*' ], {}, { name: true } );

	};

	db.addUser = function( data ) {

		var deffered = q.defer();
		var defaultData = {
			username: 'newUser',
			info: 'A happy user!',
			date: ( new Date() ).getTime(),
			options: '{}',
			level: 1
		}

		for ( var i in data ) {

			defaultData[ i ] = data[ i ]

		}

		if ( ! defaultData.password ) {

			setTimeout( function() {

				deffered.reject( new Error( 'Password not entered!' ) );

			}, 10 );
			return deffered.promise;

		} else if ( ! db.hash.valid( defaultData.username, defaultData.password ) ) {

			setTimeout( function() {

				deffered.reject( new Error( 'Password not valid!' ) );

			}, 10 );
			return deffered.promise;

		}

		return db.hash.generate( defaultData.password ).then( function( hash ) {

			defaultData.password = hash;
			return db.insert( 'users', defaultData );

		}, function() {

			throw new Error( 'Password cannot be hashed' );

		} );

		// console.log( defaultData );

	};

	db.resetPassword = function( user, newPass ) {

		return db.hash.generate( newPass ).then( function( hash ) {

			return db.update( 'users', { "username == ": newPass }, { password: hash } );

		}, function() {

			throw new Error( 'Password cannot be hashed' );

		} );

	};

	db.getUser = function( user ) {

		return db.get(
			'users',
			[ '*' ],
			{
				"username == ": user
			},
			{},
			1
		);

	};

	db.removeUser = function( user ) {

		return db.delete( 'users', { "username == ": user } );

	};

	db.login = function( user, plaintextPass ) {

		return db.getUser( user ).then( function( user ) {

			if ( user )
				return db.hash.check( plaintextPass, user.password );
			else
				throw new Error( 'User not found!' );

		} );

	};

	db.verify = function() {

		var deffered = q.defer();
		q.all(
			[
				db._Get( 'SELECT * from pages', {} ),
				db._Get( 'SELECT * from users', {} ),
				db._Get( 'SELECT * from settings', {} )
			]
		).then( function() {

			console.log( 'Tables are set' );

		}, function() {

			console.log( 'Tables are not set. Creating tables' );
			return db.create();


		} ).then( function() {

			core.db.defineSetting( 'navigation', '{}' );
			core.db.defineSetting( 'sitename', 'My Website' );
			console.log( core.config.db.passwordHash );
			try {

				db.hash = require( core.config.db.passwordHash );

			} catch ( e ) {

				console.log( 'Hash function not found!', e );

			}

			deffered.resolve();

		}, function( err ) {

			console.log( 'Failed to create database. Failing.', err );
			deffered.reject( err );

		} );

		return deffered.promise;

	};

	return db;

};
