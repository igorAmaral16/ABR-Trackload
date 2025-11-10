const path = require("path");
const fs = require("fs").promises;
const sharp = require("sharp");
require("dotenv").config();

// const BASE_UPLOAD_PATH = "\\\\10.0.0.20\\abr\\publico\\Documentos\\Upload_Sistema";
const BASE_UPLOAD_PATH = "\\\\10.0.0.20\\abr\\publico\\Documentos\\Teste";

const directories = {
  conferencia: path.join(BASE_UPLOAD_PATH, "conferencia"),
  carga: path.join(BASE_UPLOAD_PATH, "carga"),
  canhoto: path.join(BASE_UPLOAD_PATH, "canhoto"),
};

// Garante que as pastas existem
async function ensureDirectories() {
  for (const dir of Object.values(directories)) {
    await fs.mkdir(dir, { recursive: true }).catch(() => {});
  }
}

async function handleUpload(files, documentNumber) {
  await ensureDirectories();

  const allFiles = [];
  const entries = Object.entries(files);

  for (const [field, arr] of entries) {
    const file = arr[0];
    let category;

    if (field === "conferencia") category = "conferencia";
    else if (["placa", "carga1", "carga2"].includes(field)) category = "carga";
    else if (field === "canhoto") category = "canhoto";
    else continue; // ignora campos desconhecidos

    const saved = await saveFile(file, category, documentNumber, field);
    allFiles.push(saved);
  }

  return allFiles;
}

async function saveFile(file, category, documentNumber, field) {
  try {
    const targetDir = directories[category];
    const safeDoc = documentNumber.replace(/[^\d-]/g, '');
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const fileName = `${safeDoc}_${field}${ext}`;
    const outputPath = path.join(targetDir, fileName);

    await sharp(file.buffer)
      .resize({ width: 1280, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(outputPath);

    return {
      categoria: category,
      arquivo: fileName,
      caminho: outputPath,
      status: "ok",
    };
  } catch (err) {
    console.error(`Erro ao processar ${file.originalname}:`, err);
    return { arquivo: file.originalname, status: "erro", erro: err.message };
  }
}

module.exports = { handleUpload };
