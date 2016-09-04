module.exports = function( core, theme ) {
    theme.addFieldFromFile( 'nav', './default/nav.jade' );
	theme.addFieldFromFile( 'head', './default/adminHead.jade' );
	theme.addAdminPageFromFile( '/admin', './default/admin.jade', 'admin' );
	theme.addAdminPageFromFile( '/admin/pages', './default/pages.jade', 'admin' );
	theme.addAdminPageFromFile( '/404', './default/404.jade' );
	theme.addAdminPageFromFile( '/edit', './default/edit.jade', 'admin' );
	theme.addAdminPageFromFile( '/template', './default/template.jade', 'admin' );
	theme.addAdminPageFromFile( '/editTemplate', './default/editTemplate.jade', 'admin' );
	theme.addAdminPageFromFile( '/templates', './default/templates.jade', 'admin' );
	theme.setTemplate( 'basic', './default/template_1.jade' );
	theme.setTemplate( 'admin', './default/adminTemplate.jade', 2 );
};