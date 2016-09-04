module.exports = function( core, app ) {
    app.get( '/logger' , function( req, res ) {
        res.send( 'log' );
    });
};