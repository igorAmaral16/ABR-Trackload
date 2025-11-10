const uploadService = require("../services/uploadService");

async function uploadFiles(req, res) {
  try {
    const { documentNumber } = req.body;

    // Validação completa
    if (!documentNumber) {
      return res.status(400).json({
        success: false,
        message: "O campo documentNumber é obrigatório.",
      });
    }

    if (!/^[0-9]{2}-[0-9]{6}$/.test(documentNumber)) {
      return res.status(400).json({
        success: false,
        message: "Formato inválido. Use o formato XX-XXXXXX.",
      });
    }

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Nenhum arquivo foi enviado.",
      });
    }

    // Execução principal
    const result = await uploadService.handleUpload(req.files, documentNumber);

    return res.status(200).json({
      success: true,
      message: "Upload concluído com sucesso!",
      data: result,
    });

  } catch (err) {
    console.error("[UPLOAD ERROR]", err);

    const statusCode = err.statusCode || 500;
    const message =
      err.userMessage ||
      "Erro interno ao processar o upload. Tente novamente mais tarde.";

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
}

module.exports = { uploadFiles };
