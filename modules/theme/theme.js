var q = require('q');
var fs = require('fs');
var jade = require('jade');
module.exports = function(core, callback){
	var theme = {
		admin:{}
	};

	console.log('Theme');

	theme.addAdminPageFromFile = function( url, path, name ) {
		
		name = name?name:url.substr(1);

		core.db.getPage({'url == ':url, 'admin != ':0}).then(function(page){
			
			var html = "";
			var valid = true;
			
			try {

				html = fs.readFileSync(path,'utf8');
			
			} catch ( e ) {

				valid = false;
				html = e.toString();
			
			}
			if(page){

				if( valid ){

					if ( page.data == html ) {

						console.log( 'Theme up to date.' );

					} else {

						core.db.update( 'pages', 
										{ 'url == ':url }, 
										{ data: html, date: (new Date()).getTime() } )
						.then( function(){

							console.log( 'Updated theme!' );

						});

					}
				} else {

					console.log('Invalid read. Not updating.');

				}
			} else {

				core.db.insertPage( {
					title:name,
					url:url,
					data:html,
					date:(new Date()).getTime(),
					options:JSON.stringify({}),
					admin:1,
					cache:1,
				})
				.then(function(){

					console.log('Inserted ' + url);

				}, function( e ) {

					console.log('Failed to insert to ' + url, e);

				});
			}
		}, function( err ) {

			console.log('Error searching for theme page: ', err);	

		});
	};

	theme.addFieldFromFile = function( field, path ){
			
		var html = "";
		var valid = true;
		
		try {

			html = fs.readFileSync(path,'utf8');
		
		} catch ( e ) {

			html = e.toString();
		
		}

		theme.admin[field] = jade.compile(html);

	};
	theme.addFieldFromFile( 'nav', './themes/default/nav.jade');
	theme.addFieldFromFile( 'head', './themes/default/adminHead.jade');
	theme.addAdminPageFromFile('/admin','./themes/default/admin.jade');
	theme.addAdminPageFromFile('/admin/pages','./themes/default/pages.jade');
	theme.addAdminPageFromFile('/404','./themes/default/404.jade');
	callback();
	return theme;
};