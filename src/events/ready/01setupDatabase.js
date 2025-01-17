require('colors');
const getDatabase = require('../../utils/getDatabase');

module.exports = async (client) => {
	try {
		const database = await getDatabase();

		database.connect(() => {
			// Create the servers table if it doesn't exist
			database.query(`SELECT * FROM servers`, async (error, results) => {
				if (!results) {
					database.query(`CREATE TABLE servers (id VARCHAR(255) PRIMARY KEY, group_id VARCHAR(255), cookie TEXT(2048))`, () => {
						console.log('[SUCCESS]'.green + 'Successfully created the servers table.');
					});
				}
			});

			// Create the users table if it doesn't exist
			database.query(`SELECT * FROM users`, async (error, results) => {
				if (!results) {
					database.query(`CREATE TABLE users (id VARCHAR(255) PRIMARY KEY, roblox_id VARCHAR(255), robux BIGINT, purchases SMALLINT)`, () => {
						console.log('[SUCCESS]'.green + 'Successfully created the users table.');
					});
				}
			});

			// Close the database connection
			setTimeout(() => {
				database.end();
			}, 5000);
			console.log('[SUCCESS]'.green + 'Successfully connected to the MySQL database.');
		});
	} catch (error) {
		console.error(error);
		console.log('[ERROR]'.red + 'Failed to connect to the MySQL database.\nCheck if your MYSQL_HOST in your .env file is correct.');
	}
};
