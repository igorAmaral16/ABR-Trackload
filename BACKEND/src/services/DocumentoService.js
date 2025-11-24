const path = require('path');
const fs = require('fs').promises;
const odbc = require('odbc');
require('dotenv').config();

const DB_DSN = process.env.DB_DSN;
const DB_USER = process.env.DB_USER;
const DB_PASS = process.env.DB_PASS;
const USE_DB2 = (process.env.USE_DB2 || 'true').toLowerCase() === 'true';

// Config de tabela e colunas via .env
const DB_SCHEMA = process.env.DB_SCHEMA || 'SICGA54F04';
const DB_TABLE = process.env.DB_TABLE || 'GZFFAC';
const DB_COL_SERIE = process.env.DB_COL_SERIE || 'GCF001';
const DB_COL_NUMERO = process.env.DB_COL_NUMERO || 'GCF002';
const DB_COL_CLIENTE = process.env.DB_COL_CLIENTE || 'GCF005';
const DB_COL_DATA = process.env.DB_COL_DATA || 'GCF018';
const DB_SERIE_FIXA = process.env.DB_SERIE_FIXA || '4';

// Raiz das imagens (igual Upload_Sistema do PHP)
const BASE_UPLOAD_PATH = process.env.BASE_UPLOAD_PATH;

const PUBLIC_BASE_URL =
  process.env.PUBLIC_BASE_URL || 'http://localhost:5050';

// Prefixo de rota da API (útil em dev quando o frontend proxy usa /api)
const API_PREFIX = process.env.API_PREFIX || '';

const directories = {
  conferencia: path.join(BASE_UPLOAD_PATH, 'conferencia'),
  carga: path.join(BASE_UPLOAD_PATH, 'carga'),
  canhoto: path.join(BASE_UPLOAD_PATH, 'canhoto'),
};

// Cache de consultas (nota/data)
const queryCache = new Map();
const QUERY_CACHE_TTL =
  Number(process.env.DOCS_QUERY_CACHE_TTL_MS) || 15_000;

// Índice global de imagens (por NF)
let imagesIndex = new Map(); // nf -> { nf, imagens, lastMtime }
let imagesIndexTs = 0;
const IMAGES_INDEX_TTL =
  Number(process.env.DOCS_IMAGE_CACHE_TTL_MS) || 30_000;

/**
 * Entrada principal: lista documentos para nota/data.
 */
async function listarDocumentos(filters = {}) {
  let { nota = '', data = '' } = filters;

  nota = (nota || '').trim();
  data = (data || '').trim();

  const cacheKey = JSON.stringify({ nota, data });
  const now = Date.now();

  const cached = queryCache.get(cacheKey);
  if (cached && now - cached.ts < QUERY_CACHE_TTL) {
    return cached.docs;
  }

  let documentos;

  if (USE_DB2) {
    try {
      documentos = await listarDocumentosViaBanco({ nota, data });
    } catch (err) {
      console.error(
        '[DOC SERVICE] Erro ODBC, usando fallback filesystem:',
        err
      );
      documentos = await listarDocumentosViaPastas({ nota, data });
    }
  } else {
    documentos = await listarDocumentosViaPastas({ nota, data });
  }

  queryCache.set(cacheKey, { docs: documentos, ts: now });

  return documentos;
}

/**
 * Carrega o índice global de imagens (scan das 3 pastas).
 * Essa função é chamada sob demanda e reusa o resultado por TTL.
 */
async function getImagesIndex() {
  const now = Date.now();
  if (imagesIndex.size && now - imagesIndexTs < IMAGES_INDEX_TTL) {
    return imagesIndex;
  }

  const newIndex = new Map();

  await Promise.all(
    Object.entries(directories).map(async ([categoria, dirPath]) => {
      let entries;
      try {
        entries = await fs.readdir(dirPath, { withFileTypes: true });
      } catch (err) {
        if (err.code === 'ENOENT') return;
        console.error('[DOC SERVICE] Erro ao ler diretório:', dirPath, err);
        return;
      }

      await Promise.all(
        entries.map(async (entry) => {
          if (!entry.isFile()) return;

          const fileName = entry.name;
          if (!isImagemValida(fileName)) return;

          // base = "11-111111_1" ou "11-111111_carga1" etc
          const base = fileName.split('.')[0];
          const [nfPart] = base.split('_');

          if (!nfPart || !/^[0-9]{2}-[0-9]{6}$/.test(nfPart)) {
            return;
          }

          const nf = nfPart;
          if (!newIndex.has(nf)) {
            newIndex.set(nf, {
              nf,
              imagens: {
                conferencia: [],
                carga: [],
                canhoto: [],
              },
              lastMtime: null,
            });
          }

          const doc = newIndex.get(nf);
          const url = buildPublicUrl(categoria, fileName);
          doc.imagens[categoria].push(url);

          try {
            const fullPath = path.join(dirPath, fileName);
            const stat = await fs.stat(fullPath);
            const mtime = stat.mtime;
            if (!doc.lastMtime || mtime > doc.lastMtime) {
              doc.lastMtime = mtime;
            }
          } catch (err) {
            console.error(
              '[DOC SERVICE] Erro ao obter stat da imagem:',
              fileName,
              err
            );
          }
        })
      );
    })
  );

  imagesIndex = newIndex;
  imagesIndexTs = now;
  return imagesIndex;
}

/**
 * Lógica igual ao PHP: consulta em DB_SCHEMA.DB_TABLE via ODBC,
 * mas enriquecendo com as imagens vindas do índice.
 */
async function listarDocumentosViaBanco({ nota, data }) {
  if (!DB_DSN) {
    throw new Error('DB_DSN não definido no .env');
  }

  const connStr = `DSN=${DB_DSN};UID=${DB_USER || ''};PWD=${DB_PASS || ''}`;

  const connection = await odbc.connect(connStr);
  const imgIndex = await getImagesIndex();

  try {
    const where = [];

    if (nota) {
      const numeroLimpo = nota.replace(/\D/g, '');
      if (numeroLimpo.length >= 3) {
        const serieRaw = numeroLimpo.slice(0, 2);
        const numeroRaw = numeroLimpo.slice(2);

        const serie = serieRaw.replace(/^0+/, '') || '0';
        const numero = numeroRaw.replace(/^0+/, '') || '0';

        if (/^\d+$/.test(serie)) {
          where.push(`${DB_COL_SERIE} = ${serie}`);
        }
        if (/^\d+$/.test(numero)) {
          where.push(`${DB_COL_NUMERO} = ${numero}`);
        }
      }
      data = '';
    } else if (data) {
      const as400Date = data.replace(/-/g, '');
      if (/^\d{8}$/.test(as400Date)) {
        where.push(`${DB_COL_DATA} = ${as400Date}`);
      }
    }

    // Filtro de série fixa (igual GCF001 = 4 antes)
    if (DB_SERIE_FIXA && /^\d+$/.test(DB_SERIE_FIXA)) {
      where.push(`${DB_COL_SERIE} = ${DB_SERIE_FIXA}`);
    }

    let sql = `
      SELECT
        ${DB_COL_SERIE}   AS SERIE,
        ${DB_COL_NUMERO}  AS NUMERO,
        ${DB_COL_CLIENTE} AS CLIENTE,
        ${DB_COL_DATA}    AS DATA_EMISSAO
      FROM ${DB_SCHEMA}.${DB_TABLE}
    `;

    if (where.length) {
      sql += ' WHERE ' + where.join(' AND ');
    }

    sql += ' ORDER BY ' + DB_COL_DATA + ' DESC';

    const result = await connection.query(sql);

    const documentos = [];

    for (const row of result) {
      const serie = String(row.SERIE ?? '').trim();
      const numero = String(row.NUMERO ?? '').trim();
      const cliente = String(row.CLIENTE ?? '').trim();
      const dataRaw = String(row.DATA_EMISSAO ?? '').trim();

      if (!numero || !dataRaw) continue;

      const nf = formatDocumento(serie, numero);
      const dataISO = convertAs400DateToISO(dataRaw);

      const imgEntry = imgIndex.get(nf);
      const imagens = imgEntry
        ? imgEntry.imagens
        : {
          conferencia: [],
          carga: [],
          canhoto: [],
        };

      documentos.push({
        nf,
        data: dataISO,
        cliente: cliente || 'Cliente não informado',
        imagens,
      });
    }

    return documentos;
  } finally {
    try {
      await connection.close();
    } catch (err) {
      console.error('[DOC SERVICE] Erro ao fechar conexão ODBC:', err);
    }
  }
}

/**
 * Fallback: se banco der pau ou USE_DB2=false,
 * montamos docs apenas a partir do índice de imagens.
 */
async function listarDocumentosViaPastas({ nota, data }) {
  const imgIndex = await getImagesIndex();

  let documentos = Array.from(imgIndex.values()).map((entry) => {
    const dataISO = entry.lastMtime
      ? entry.lastMtime.toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    return {
      nf: entry.nf,
      data: dataISO,
      cliente: 'Cliente não informado',
      imagens: entry.imagens,
    };
  });

  if (nota) {
    const nfFiltro = normalizarNF(nota);
    if (nfFiltro) {
      documentos = documentos.filter((doc) => doc.nf === nfFiltro);
    } else {
      documentos = [];
    }
  } else if (data) {
    documentos = documentos.filter((doc) => doc.data === data);
  }

  documentos.sort((a, b) => new Date(b.data) - new Date(a.data));

  return documentos;
}

// -------------------------
// Helpers
// -------------------------

function formatDocumento(serie, numero) {
  const serieNum = parseInt(serie, 10);
  const numeroNum = parseInt(numero, 10);

  const seriePad = Number.isNaN(serieNum)
    ? '00'
    : String(serieNum).padStart(2, '0');
  const numeroPad = Number.isNaN(numeroNum)
    ? '000000'
    : String(numeroNum).padStart(6, '0');

  return `${seriePad}-${numeroPad}`;
}

function normalizarNF(nota) {
  const numeros = nota.replace(/\D/g, '');
  if (numeros.length < 3) return null;

  const serieNum = parseInt(numeros.slice(0, 2), 10);
  const numeroNum = parseInt(numeros.slice(2), 10);

  if (Number.isNaN(serieNum) || Number.isNaN(numeroNum)) return null;

  const seriePad = String(serieNum).padStart(2, '0');
  const numeroPad = String(numeroNum).padStart(6, '0');
  return `${seriePad}-${numeroPad}`;
}

function convertAs400DateToISO(raw) {
  const str = String(raw).trim();
  if (!/^\d{8}$/.test(str)) {
    return new Date().toISOString().slice(0, 10);
  }

  const year = str.slice(0, 4);
  const month = str.slice(4, 6);
  const day = str.slice(6, 8);
  return `${year}-${month}-${day}`;
}

function isImagemValida(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
}

function buildPublicUrl(categoria, fileName) {
  // Use API_PREFIX se fornecido (ex: '/api') para que o frontend dev (Vite)
  // encaminhe corretamente via proxy. Caso contrário, retorna caminho absoluto.
  const prefix = (API_PREFIX || '').replace(/\/$/, '');
  if (prefix) {
    return `${prefix}/uploads/${categoria}/${fileName}`;
  }
  return `${PUBLIC_BASE_URL.replace(/\/$/, '')}/uploads/${categoria}/${fileName}`;
}

module.exports = {
  listarDocumentos,
};
