const mysql = require('mysql2');

const mysqlHOST = process.env.MYSQL_HOST;

module.exports = async () => {
	if (!mysqlHOST) return;

	const database = mysql.createConnection({
		host: mysqlHOST,
		user: process.env.MYSQL_USER,
		password: process.env.MYSQL_PASSWORD,
		database: process.env.MYSQL_DATABASE,
		port: process.env.MYSQL_PORT,
	});

	return database;
};
