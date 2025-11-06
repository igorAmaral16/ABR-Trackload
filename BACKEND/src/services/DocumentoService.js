const db = require('../config/db');

async function buscarDocumentos({ numero, cliente }) {
    let sql = `SELECT * FROM documentos WHERE 1=1`;
    const params = [];

    if (numero) {
        sql += ' AND numero = ?';
        params.push(numero);
    }
    if (cliente) {
        sql += ' AND cliente LIKE ?';
        params.push(`%${cliente}%`);
    }

    const resultados = await db.query(sql, params);
    return resultados;
}

module.exports = { buscarDocumentos };
