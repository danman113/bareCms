var q = require( 'q' );


module.exports = function() {

	var coreExport = {
		db: null,
		config: null,
		router: null,
		theme: null,
		plugins: [],
	};

	coreExport.setDb = function( db ) {

		var _this = this;
		var deffered = q.defer();
		this.db = db( this, function( err ) {

			if ( err ) deffered.reject( err );
			else {

				_this.db.verify().then( function() {
					deffered.resolve();
				}, function( err ) {
					deffered.reject( err );
				} )

			}

		} );
		return deffered.promise;

	};
	coreExport.setConfig = function( config, args ) {

		var deffered = q.defer();
		this.config = config( args );
		return deffered.promise;

	};


	/**
	 * Sets the router
	 * @param {Object} router The router object
	 */
	coreExport.setRouter = function( router ) {

		var deffered = q.defer();
		this.router = router( this, function( err ) {

			if ( err ) deffered.reject( err );
			else deffered.resolve();

		} );
		return deffered.promise;

	};

	coreExport.setTheme = function( router ) {

		var deffered = q.defer();
		this.theme = router( this, function( err ) {

			if ( err ) deffered.reject( err );
			else deffered.resolve();

		} );
		return deffered.promise;

	};

	coreExport.setPlugins = function() {

		var deffered = q.defer();

		this.plugins = require( '../config/plugin.js' )( coreExport ,function( err ) {
			if( err ) deffered.reject( err );
			else deffered.resolve();
		} );

		return deffered.promise;

	};

	return coreExport;

};
