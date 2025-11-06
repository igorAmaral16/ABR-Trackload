const documentoService = require('../services/DocumentoService');

async function getDocumentos(req, res) {
    try {
        const { numero, cliente } = req.query;
        const result = await documentoService.buscarDocumentos({ numero, cliente });
        res.json({ success: true, data: result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = { getDocumentos };
