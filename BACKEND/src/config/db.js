const odbc = require('odbc');

const connectionString = process.env.DB_DSN; // Ex: "DSN=AS400;UID=user;PWD=password"

async function query(sql, params = []) {
    const connection = await odbc.connect(connectionString);
    const result = await connection.query(sql, params);
    await connection.close();
    return result;
}

module.exports = { query };
