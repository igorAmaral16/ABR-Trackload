const express = require('express');
const multer = require('multer');
const uploadController = require('../controllers/UploadController');

const router = express.Router();
const storage = multer.memoryStorage(); // mantém arquivo em buffer para Sharp
const upload = multer({ storage });

router.post('/', upload.array('files'), uploadController.uploadFiles);

module.exports = router;
