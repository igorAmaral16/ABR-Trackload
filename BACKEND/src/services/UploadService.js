const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

async function handleUpload(files, body) {
    if (!files || files.length === 0) throw new Error('Nenhum arquivo enviado');

    const uploadDir = path.join(__dirname, '../uploads/');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

    const savedFiles = [];

    for (let file of files) {
        const outputFile = path.join(uploadDir, file.originalname);

        // Sharp para otimização
        await sharp(file.buffer)
            .resize(1024)           // largura máxima 1024px
            .jpeg({ quality: 80 })  // compressão otimizada
            .toFile(outputFile);

        savedFiles.push(outputFile);
    }

    return savedFiles;
}

module.exports = { handleUpload };
