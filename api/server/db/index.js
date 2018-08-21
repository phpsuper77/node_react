var mysql = require('mysql');
var dbConfig = require('./config.json');

module.exports = {
	createConnection: function() {
		var connection = mysql.createConnection({
			host: dbConfig.host,
			user: dbConfig.user,
			password: dbConfig.password,
			port: dbConfig.port
		});
		connection.query('USE dv_schema');
		return connection;
	},

	createWpDbConnection: function() {
        var connection = mysql.createConnection({
            host: "dailyvanity.asuscomm.com",
            user: "uat_salon_user",
            password: "La0l0c7#laCh09*7Tges6@3Py26_bd86",
            port: dbConfig.port
        });
        connection.query('USE uat_salon');
        return connection;
	}
} 