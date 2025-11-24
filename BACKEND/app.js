const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const uploadRoutes = require('./src/routes/uploadRoutes');
const documentoRoutes = require('./src/routes/documentoRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Caminho base das imagens (igual Upload_Sistema)
const BASE_UPLOAD_PATH =
  process.env.BASE_UPLOAD_PATH ||
  '\\\\10.0.0.20\\abr\\publico\\Documentos\\Upload_Sistema';

// Servir arquivos de imagem da rede via HTTP
// /uploads/conferencia/11-111111_conferencia.jpg
// Serve both /uploads and /api/uploads so dev proxy (which forwards /api/*)
// can reach the static files without extra rewrite rules.
app.use(['/uploads', '/api/uploads'], express.static(BASE_UPLOAD_PATH));

// Rotas
app.use('/api/upload', uploadRoutes);
app.use('/api/documentos', documentoRoutes);

app.get('/', (req, res) => res.send('✅ API rodando com sucesso'));

module.exports = app;
