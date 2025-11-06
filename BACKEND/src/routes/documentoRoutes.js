const express = require('express');
const documentoController = require('../controllers/DocumentoController');

const router = express.Router();

router.get('/', documentoController.getDocumentos);

module.exports = router;
