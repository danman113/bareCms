var q = require( 'q' );

module.exports = function( core, theme, callback ) {
	
	q.all(
		[
			theme.addAdminPageFromFile( '/admin', 'admin.jade', 'admin' ),
			theme.addAdminPageFromFile( '/admin/pages', 'pages.jade', 'admin' ),
			theme.addAdminPageFromFile( '/404', '404.jade' ),
			theme.addAdminPageFromFile( '/edit', 'edit.jade', 'admin' ),
			theme.addAdminPageFromFile( '/template', 'template.jade', 'admin' ),
			theme.addAdminPageFromFile( '/editTemplate', 'editTemplate.jade', 'admin' ),
			theme.addAdminPageFromFile( '/templates', 'templates.jade', 'admin' ),
			theme.addAdminPageFromFile( '/settings', 'settings.jade', 'admin' ),
			theme.addAdminPageFromFile( '/login', 'login.jade', 'adminBlank' ),
			theme.addAdminPageFromFile( '/register', 'register.jade', 'adminBlank' ),
			theme.setTemplate( 'basic', 'template_1.jade' ),
			theme.setTemplate( 'admin', 'adminTemplate.jade', 2 ),
			theme.setTemplate( 'adminBlank', 'adminTemplateBlank.jade', 2 )
		]
	).then( function() {
		console.log( 'Default theme done initializing!' );
		callback();
	}, function( err ) {
		console.log( 'Error initializing theme!' );
		callback( err );
	} )
};