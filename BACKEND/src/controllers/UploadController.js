const uploadService = require('../services/uploadService');

async function uploadFiles(req, res) {
    try {
        const result = await uploadService.handleUpload(req.files, req.body);
        res.json({ success: true, data: result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = { uploadFiles };
