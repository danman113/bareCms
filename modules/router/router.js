var q = require('q');
var express = require('express');
var path = require('path');
var app=express();
var bodyParser = require('body-parser');
var jade = require('jade');
var fs = require('fs');
module.exports = function(core, callback){
	
	var router = {
		app:app,
		cache:{},
		filters:[]
	};

	var site = {
		admin: core.theme.admin
	};
 	
	router.cacheGet = function( req, res ) {

		var path = req._parsedUrl.pathname;
		if( router.cache[ path ] ) {

			console.log('Cache Hit');
			return router.cache[path];
		
		} else return null;

	};

	router.cacheSet = function( req, res, fn, data) {
		fn.data = data;
		var path = req._parsedUrl.pathname;
		router.cache[path] = fn;
	
	};

	router.sendPage = function( req, res, data ) {
		
		res.send(data({site:site,page:data.data}));
	
	};

	router.addFilter = function( filter, position ) {
		
		if( typeof filter == 'function' ) {
			if( position !== null && position !== undefined ) {
				router.filters.push( filter );
			} else {
				router.filters.splice( position, 0, filter );
			}
		}

	};

	app.use( bodyParser.json() );

	app.use( bodyParser.urlencoded( {
		extended: true
	})); 

	console.log( path.resolve( core.config.router.staticURL ) );

	app.use( '/static', express.static( path.resolve( core.config.router.staticURL ) ) );

	app.get('/pages', function( req, res, next ) {
		res.redirect( '/' );
	});

	app.get('/pages/*',function(req, res, next){
		var cachedResult = router.cacheGet(req,res);
		if(cachedResult) {
			router.sendPage(req, res, cachedResult);
			return;
		}
		var path = req._parsedUrl.pathname.substr(6);
		var lastChar = path.substr(path.length-1,path.length);
		if(lastChar == '/' && path != '/') path = path.substr(0,path.length-1);
		core.db.getPage( {"url == ":path, 'admin ==':0} ).then(function(page){
			if(page) {
				var html = page.data;
				for (var i = 0; i < router.filters.length; i++) {
					html = router.filters[i](page);
				}
				var fn = jade.compile(html);
				if(page.cache) router.cacheSet(req,res,fn,page);
				router.sendPage(req,res,fn);
			} else next();
		});
	});
	app.put('/pages/*',function(req, res,next){
		var path = req._parsedUrl.pathname.substr(6);
		var lastChar = path.substr(path.length-1,path.length);
		if(lastChar == '/' && path!='/') path = path.substr(0,path.length-1);
		var form = req.body;
		form.url = path;
		form.admin = 0;
		form.cache = 1;
		core.db.insertPage(form).then(function(){
			res.send({status:1});
		},function(err){
			res.send({status:0,error:err.message});
		});
	});
	app.get('/',function(req, res){
		var cachedResult = router.cacheGet(req,res);
		if(cachedResult) {
			router.sendPage(req, res, cachedResult);
			return;
		}
		core.db.getPage( {"url == ":'/', 'admin ==':0} ).then(function(page){
			if(page) {
				var html = page.data;
				for (var i = 0; i < router.filters.length; i++) {
					html = router.filters[i](page);
				}
				var fn = jade.compile(html);
				if(page.cache) router.cacheSet(req,res,fn,page);
				router.sendPage(req,res,fn);
			} else next();
		});
	});
	app.get('/debug/db',function(req, res){
		core.db.all('SELECT * FROM pages',{}).then(function(row){
			res.send(row);
		});
	});
	app.get('/admin/',function(req, res){
		var cachedResult = router.cacheGet(req,res);
		if(cachedResult) {
			router.sendPage(req, res, cachedResult);
			return;
		}

		core.db.getPage( {'url == ':'/admin','admin != ': 0} ).then(function(page){
			// console.timeEnd('Admin Page');
			var fn = jade.compile(page.data);
			if(page.cache) router.cacheSet(req,res,fn,page);
			router.sendPage(req,res,fn);
		}, function(err){
			console.log(err);
			res.send(err);
		});
	});

	app.get('/admin/pages',function(req, res){
		var offset = isNaN(+req.query.offset)?0:(+req.query.offset);
		core.db.get( 'pages', ['*'], {"admin == ":0}, {title:true}, 20, offset ).then(function(row){
			var cachedResult = router.cacheGet(req,res);
			if(cachedResult) {
				res.send(cachedResult({pages:row,site:site}));
				return;
			}
			core.db.getPage({'url == ':'/admin/pages','admin != ':0}).then(function(page){
				console.log('Starting compiling');
				var fn = function(){};
				try{
					fn = jade.compile(page.data);
				} catch ( e ) {
					fn = function(){return e.toString();};
				}
				console.log('Ended compiling');
				if(page.cache) router.cacheSet(req,res,fn,page);
				console.log(core.theme.admin);
				res.send(fn({pages:row,site:site}));
				console.log('Page sent');
			}, function(err){
				console.log(err);
				res.send(err);
			});
		});
	});

	app.all('/*',function(req, res){
		res.send('404 :C');
	});
	
	app.listen(core.config.router.port,callback);
	return router;
};