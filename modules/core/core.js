var q = require( 'q' );


module.exports = function() {

	var coreExport = {
		db: null,
		config: null,
		router: null,
		theme: null,
	};

	coreExport.setDb = function( db ) {

		var deffered = q.defer();
		this.db = db( this, function( err ) {

			if ( err ) deffered.reject( err );
			else deffered.resolve();

		} );
		return deffered.promise;

	};
	coreExport.setConfig = function( config ) {

		var deffered = q.defer();
		this.config = config();
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

	return coreExport;

};
