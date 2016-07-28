var sqlite3 = require('sqlite3').verbose();
var q = require('q');
var squel = require('squel');
module.exports = function(core, callback){
	var db = {
		db:new sqlite3.Database(core.config.db.filename,callback)
	};

	db.close = function() {

		var deffered = q.defer();
		db.db.close( function( err ) {

			if( err ) deffered.reject( err );
			else deffered.resolve();

		});
		return deffered.promise;
	
	};

	db.All = function( query, params ) {

		var deffered = q.defer();
		db.db.all( query, params, function( err, row ) {

			if( err ) deffered.reject( err );
			else deffered.resolve( row );

		});
		return deffered.promise;

	};

	db.Get = function( query, params ) {

		var deffered = q.defer();
		db.db.get( query, params, function( err, row ) {

			if( err ) deffered.reject( err );
			else deffered.resolve( row );

		});
		return deffered.promise;

	};

	db.Run = function( query, params ) {

		var deffered = q.defer();
		db.db.run( query, params, function( err, data ) {

			if ( err ) deffered.reject( err );
			else deffered.resolve( data );

		});
		return deffered.promise;

	};

	db.get = function ( table, selects, wheres, orders, limit, offset) {

		var query = squel.select( { autoQuoteFieldNames: true } ).from( table );
		var params = {};
		orders = orders ? orders : {};
		var single = false;
		
		for ( var i = 0; i < selects.length; i++ ) {

			query.field( selects[ i ] );

		}
		for ( var key in wheres ) {

			var q =  key.split( ' ' )[ 0 ];
			query.where( key + '$' + q );
			params[ '$' + q ] = wheres[ key ];

		}

		for ( var order in orders ) {

			query.order( order, orders[ order ]);
		
		}

		if( !isNaN( +limit ) ) {

			if( +limit == 1) single = true;
			else query.limit( +limit );

		}

		if( !isNaN( +offset ) ) {

			query.offset( +offset );

		}

		if( single ) {

			return db.Get( query.toString(), params );

		} else {

			return db.All( query.toString(), params );

		}

	};

	db.update = function ( table, wheres, data ) {

		var query = squel.update( { autoQuoteFieldNames: true } ).table( table );
		var params = {};
		var defaultData = {};

		for (var newData in data){

			defaultData[newData] = data[newData];

		}

		for ( var key in wheres ) {

			var q =  key.split( ' ' )[ 0 ];
			query.where( key + '$' + q );
			params[ '$' + q ] = wheres[ key ];

		}

		for (var val in defaultData) {

			query.set( val, squel.str( '@' + val ) );
			params[ '@' + val ] = defaultData[ val ];

		}

		return db.Run( query.toString(), params );

	};

	db.create = function(){

		var deffered = q.defer();
		var pages = 'CREATE TABLE pages (' +
			'id INTEGER PRIMARY KEY AUTOINCREMENT, ' + 
			'title VARCHAR(100), ' +
			'url VARCHAR(100), ' +
			'data TEXT, '+
			'author INTEGER, '+ 
			'date DATETIME, '+
			'options TEXT,'+
			'admin INTEGER,'+
			'cache INTEGER'+
			');';
		var users = 'CREATE TABLE users (' +
			'id INTEGER PRIMARY KEY AUTOINCREMENT, ' + 
			'username VARCHAR(100), ' +
			'info TEXT, '+
			'password VARCHAR(100), '+ 
			'level INTEGER, '+
			'date DATETIME, '+
			'options TEXT'+
			');';
		q.All( [db.Run( pages, {} ), db.Run( users, {} )] ).then( function() {

			console.log('Creates successful');
			deffered.resolve();

		} ).fail( function( err ) {

			console.log('Create error');
			deffered.reject(err);

		} );
		return deffered.promise;

	};

	db.getPage = function( wheres ) {

		return db.get( 'pages', ['*'], wheres, {}, 1 );
	
	};

	db.insertPage = function( data ) {
		
		var deffered = q.defer();
		for (var i in data){
			
			data['$' + i] = data[i];
			delete data[i];

		}

		db.getPage({'url == ':data.$url}).then(function(response){
			if(response)
				deffered.reject(new Error('URL already in use. Use /page'+data.$url+'?edit=1 to edit it or delete it.'));
			else 
				return db.Run('INSERT INTO pages (title, data, author, date, options, url, admin, cache) VALUES ($title, $data, $author, $date, $options, $url, $admin, $cache)',data);
		}).then(function(){
			deffered.resolve();
		}, function(err){
			deffered.reject(err);
		});
		return deffered.promise;
		
	};

	db.insertAdminPage = function(data){
		var deffered = q.defer();
		for (var i in data){
			data['$' + i] = data[i];
			delete data[i];
		}
		db.getAdminPage('url',data.$url).then(function(response){
			if(response)
				deffered.reject(new Error('URL already in use. Use /page'+data.$url+'?edit=1 to edit it or delete it.'));
			else 
				return db.Run('INSERT INTO pages (title, data, author, date, options, url, admin, cache) VALUES ($title, $data, $author, $date, $options, $url, $admin, $cache)',data);
		}).then(function(){
			deffered.resolve();
		}, function(err){
			deffered.reject(err);
		});
		return deffered.promise;
	};


	db.verify = function(){
		var deffered = q.defer();
		q.all([db.Get('SELECT * from pages',{}),db.Get('SELECT * from users',{})]).then(function(){
			console.log('Tables are set');
		},function(){
			console.log('Tables are not set. Creating tables');
			return db.create();
		}).then(function(){
			deffered.resolve();
		},function(){
			console.log('Failed to create database. Failing.');
			deffered.reject();
		});
		// db.insertPage({$title:'hello',$data:'Faggot ' + Math.random()}).then(function(){
		// 	return db.All('SELECT * FROM pages WHERE id = $id ORDER BY id DESC LIMIT 20',{$id:325});
		// }).then(function(rows){
		// 	console.log(rows);
		// });
		
		return deffered.promise;
	};
 
	return db;
};