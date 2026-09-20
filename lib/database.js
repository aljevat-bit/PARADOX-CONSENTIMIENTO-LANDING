const fs = require('fs');
const path = require('path');

// Determinamos la ruta del archivo local
const LOCAL_DATA_DIR = path.join(__dirname, '..', 'data');
let LOCAL_FILE = path.join(LOCAL_DATA_DIR, 'registros.json');

try {
  if (!fs.existsSync(LOCAL_DATA_DIR)) {
    fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
  }
} catch (e) {
  // Si estamos en un entorno serverless de solo lectura sin token de Blob aún
  LOCAL_FILE = path.join('/tmp', 'registros.json');
}

/**
 * Lee todos los registros (desde Vercel Blob si está configurado, o desde disco local)
 */
async function getAllRegistros() {
  // 1. Si Vercel Blob está configurado
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { list } = require('@vercel/blob');
      const response = await list({ prefix: 'registros.json' });
      const blob = response.blobs.find((b) => b.pathname === 'registros.json' || b.pathname.endsWith('registros.json'));
      if (blob && blob.downloadUrl) {
        const res = await fetch(blob.downloadUrl);
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json)) return json;
        }
      }
    } catch (err) {
      console.warn('Error leyendo desde Vercel Blob, usando fallback local:', err.message);
    }
  }

  // 2. Fallback a archivo local o /tmp
  try {
    if (fs.existsSync(LOCAL_FILE)) {
      const raw = fs.readFileSync(LOCAL_FILE, 'utf8');
      return JSON.parse(raw || '[]');
    }
    // Si no existe pero existe en data
    const orig = path.join(LOCAL_DATA_DIR, 'registros.json');
    if (fs.existsSync(orig)) {
      const raw = fs.readFileSync(orig, 'utf8');
      return JSON.parse(raw || '[]');
    }
  } catch (err) {
    console.warn('Error leyendo archivo local de registros:', err.message);
  }

  return [];
}

/**
 * Guarda un registro (en Vercel Blob si está activo y en disco local)
 */
async function saveRegistro(nuevoRegistro) {
  try {
    const registros = await getAllRegistros();

    // Si ya existe un registro con el mismo documento, actualizamos para mantener el más reciente
    const indexExistente = registros.findIndex(
      (r) =>
        r.numero_documento &&
        r.numero_documento.trim().toLowerCase() === (nuevoRegistro.numero_documento || '').trim().toLowerCase()
    );

    if (indexExistente !== -1) {
      registros[indexExistente] = { ...registros[indexExistente], ...nuevoRegistro, fecha_actualizacion: new Date().toISOString() };
    } else {
      registros.push(nuevoRegistro);
    }

    const payloadStr = JSON.stringify(registros, null, 2);

    // 1. Guardar en Vercel Blob si está configurado
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const { put } = require('@vercel/blob');
        await put('registros.json', payloadStr, {
          access: 'public',
          addRandomSuffix: false
        });
        console.log('✅ Registro sincronizado exitosamente en Vercel Blob Storage.');
      } catch (blobErr) {
        console.error('Error guardando en Vercel Blob:', blobErr.message);
      }
    }

    // 2. Guardar en disco local
    try {
      fs.writeFileSync(LOCAL_FILE, payloadStr);
    } catch (fsErr) {
      try {
        fs.writeFileSync(path.join('/tmp', 'registros.json'), payloadStr);
      } catch (_) {}
    }

    return true;
  } catch (err) {
    console.error('Error general en saveRegistro:', err.message);
    return false;
  }
}

/**
 * Busca un registro previo por número de documento
 */
async function findRegistroByDoc(documento, tipo = '') {
  if (!documento) return null;
  const docLimpio = documento.trim().toLowerCase();

  const registros = await getAllRegistros();
  const encontrado = registros
    .slice()
    .reverse()
    .find(
      (r) =>
        r.numero_documento &&
        r.numero_documento.trim().toLowerCase() === docLimpio &&
        (!tipo || (r.tipo_documento && r.tipo_documento.toLowerCase() === tipo.toLowerCase()))
    );

  return encontrado || null;
}

module.exports = {
  getAllRegistros,
  saveRegistro,
  findRegistroByDoc
};
