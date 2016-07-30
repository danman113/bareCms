module.exports = function() {

	var defaultConfig = {
		db: {
			filename: "./database.sql"
		},
		router: {
			port: 8080,
			staticURL: './static/'
		},
		theme: {
			folter: './themes/'
		}
	};

	return defaultConfig;

};
