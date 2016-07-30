/**
 * Logger
 * Log levels:
 * 0		- Nothing. Super secure
 * 1		- Errors, failure points.
 * 2		- Normal
 * 3		- Debugging
 * @param  {number} logLevel Level of logging
 * @return {object}          Logger Object
 */
module.exports = function( level ) {

	var logger = function( logLevel ) {

		var obj = this;
		this.level = ( logLevel !== undefined && logLevel !== null ) ? logLevel : 2;
		this.b = {};
		var breakpoints = {};
		this.error = function() {

			if ( this.level >= 1 ) {

				console.log.apply( null, arguments );

			}

		};
		this.log = function() {

			if ( this.level >= 2 ) {

				console.log.apply( null, arguments );

			}

		};
		this.debug = function() {

			if ( this.level >= 3 ) {

				console.log.apply( null, arguments );

			}

		};

		this.define = function( a ) {

			this.b[ a ] = function() {

				if ( breakpoints[ a ] ) {

					console.log.apply( null, arguments );

				}

			};

		};

		this.enable = function( a ) {

			breakpoints[ a ] = true;

		};
		return this;

	};
	return new logger( level );

};
