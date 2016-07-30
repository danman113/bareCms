var core = require('./modules/core/core.js')();
core.setConfig(require('./modules/config/config.js'));
console.log(core.config);
core.setDb(require('./modules/db/db.js')).then(function(e){
	console.log('db connected');
	console.log(core.db);
	return core.db.verify();
	// .then(function(){
	// 	console.log(arguments);
	// 	return core.db.insertPage({$title:'/hello/there',$data:'hello there ' + Math.random(),$author:1, $date: new Date(),$options:JSON.stringify({options:null})});
	// }).then(function(){
	// 	core.db.all('SELECT * from pages',{}).then(console.log);
	// },function(err){
	// 	console.log('Failed to do thing');
	// }).then(function(){
	// 	console.log('++++');
	// });
}).then(function(){
	console.log('Everything\'s all good');
	// core.db.update( 'pages', {'title != ':'admin','url = ':'asdf'},{title:'tex',data:'Look at me!',options:JSON.stringify({hi:(new Date()).getTime()})}).then(() => console.log(arguments), console.log)
	return core.setTheme(require('./modules/theme/theme.js'));
},function(e){
	console.log('Error connecting to database');
	console.log(e);
}).then(function(){
	console.log('Theme set');
	return core.setRouter(require('./modules/router/router.js'));
},function(err){
	console.log('Theme set failed', err);
}).then(function(){
	console.log('Router Initialized!');
}, function( err ){
	console.log('Router failed', err);
});
