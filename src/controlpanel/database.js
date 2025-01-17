// database.js
const { Pool } = require('pg'); // Example using PostgreSQL
require('dotenv').config(); // Load environment variables

const pool = new Pool({
    // Your PostgreSQL connection details
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: process.env.MYSQL_PORT,
});

async function updateTransactionStatus(transactionId, status, userId) {
    try {
        //Use parameterized queries to prevent SQL injection
        const client = await pool.connect();
        await client.query(
            'UPDATE transactions SET status = $1 WHERE transaction_id = $2 AND user_id = $3',
            [status, transactionId, userId]
        );
        client.release();
    } catch (error) {
        console.error('Error updating transaction status:', error);
        throw error;
    }
}



module.exports = { updateTransactionStatus };