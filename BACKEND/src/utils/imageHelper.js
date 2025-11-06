const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function gerarThumbnail(filePath) {
    const thumbPath = filePath.replace(/(\.\w+)$/, '_thumb$1');

    await sharp(filePath)
        .resize(200)               // largura do thumbnail
        .jpeg({ quality: 70 })     // compressão otimizada
        .toFile(thumbPath);

    return thumbPath;
}

module.exports = { gerarThumbnail };
