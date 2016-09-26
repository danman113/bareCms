var bcrypt = null;

try {
	bcrypt = require( 'bcrypt' );
} catch( e ) {
	console.log( 'Cannot use standard bcrypt, using bcryptjs' );
	bcrypt = require( 'bcryptjs' );
}

var q = require( 'q' );


var Hasher = function( strength ) {

	this.strength = strength ? strength : 10;

};

Hasher.prototype.generate = function( plaintext ) {

	var deffered = q.defer();

	bcrypt.hash( plaintext, this.strength, function( err, hash ) {

		if ( err ) deffered.reject( err );
		else deffered.resolve( hash );

	} );

	return deffered.promise;

};

Hasher.prototype.check = function( plaintext, hash ) {

	var deffered = q.defer();

	bcrypt.compare( plaintext, hash, function( err, equal ) {

		if ( err ) deffered.reject( err );
		else deffered.resolve( equal );

	} );

	return deffered.promise;

};

Hasher.prototype.valid = function( username, plaintext ) {

	return plaintext.length > 7 && username != plaintext;

};

module.exports = new Hasher( 11 );
