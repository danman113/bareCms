var morgan = require('morgan')

module.exports = function( core, app ) {
    app.use(morgan('combined'));
};