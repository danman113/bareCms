module.exports = function( core, app, router, theme ) {
    app.get( '/logger' , function( req, res ) {
        res.send( 'log' );
    });
};