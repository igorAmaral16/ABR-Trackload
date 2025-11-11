import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  timeout: 20000,
});

export const uploadFiles = async (formData, onUploadProgress) => {
  try {
    const response = await api.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      // Erro do servidor
      throw new Error(
        error.response.data?.error ||
          `Erro ${error.response.status}: falha no envio.`
      );
    } else if (error.code === "ECONNABORTED") {
      throw new Error("Tempo de conexão excedido. Verifique sua internet.");
    } else {
      throw new Error("Falha na comunicação com o servidor.");
    }
  }
};
