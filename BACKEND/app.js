const express = require('express');
const cors = require('cors');
const uploadRoutes = require('../BACKEND/src/routes/uploadRoutes');
const documentoRoutes = require('../BACKEND/src/routes/documentoRoutes');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/upload', uploadRoutes);
app.use('/documentos', documentoRoutes);

module.exports = app;
