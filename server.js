const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { Resend } = require('resend');
const { generateDisclaimerPdf } = require('./lib/pdf-generator');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de Resend y Correos
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_FROM = process.env.RESEND_FROM_EMAIL || 'Paradox Park <info@paradox-park.com>';
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || 'Hola@paradox-park.com';
const PARK_SEDE = process.env.PARK_SEDE || 'Lima - Era Imperium';

let resendClient = null;
if (RESEND_API_KEY && !RESEND_API_KEY.includes('re_tu_api_key')) {
  resendClient = new Resend(RESEND_API_KEY);
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Servir archivos estáticos de la landing page
app.use(express.static(path.join(__dirname, 'public')));

// Ruta del archivo de registros local con fallback para entornos serverless (Vercel)
let REGISTROS_FILE = path.join(__dirname, 'data', 'registros.json');
try {
  const testDir = path.join(__dirname, 'data');
  if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });
} catch (e) {
  REGISTROS_FILE = path.join('/tmp', 'registros.json');
}

/**
 * Lee los registros locales
 */
function getRegistros() {
  try {
    if (!fs.existsSync(REGISTROS_FILE)) {
      try { fs.writeFileSync(REGISTROS_FILE, JSON.stringify([], null, 2)); } catch (_) {}
      return [];
    }
    const data = fs.readFileSync(REGISTROS_FILE, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (err) {
    return [];
  }
}

/**
 * Guarda un nuevo registro localmente
 */
function saveRegistro(registro) {
  try {
    const registros = getRegistros();
    registros.push(registro);
    fs.writeFileSync(REGISTROS_FILE, JSON.stringify(registros, null, 2));
    return true;
  } catch (err) {
    try {
      const tmpFile = path.join('/tmp', 'registros.json');
      let list = [];
      if (fs.existsSync(tmpFile)) {
        list = JSON.parse(fs.readFileSync(tmpFile, 'utf8') || '[]');
      }
      list.push(registro);
      fs.writeFileSync(tmpFile, JSON.stringify(list, null, 2));
      return true;
    } catch (errTmp) {
      console.warn('Almacenamiento local omitido en entorno serverless.');
      return false;
    }
  }
}

/**
 * Endpoint para buscar visitantes recurrentes por documento
 */
app.get('/api/lookup', (req, res) => {
  const { doc, tipo } = req.query;
  if (!doc) {
    return res.status(400).json({ success: false, message: 'Parámetro de documento requerido' });
  }

  const registros = getRegistros();
  const match = registros
    .slice()
    .reverse()
    .find(
      (r) =>
        r.numero_documento &&
        r.numero_documento.trim().toLowerCase() === doc.trim().toLowerCase() &&
        (!tipo || (r.tipo_documento && r.tipo_documento.toLowerCase() === tipo.toLowerCase()))
    );

  if (match) {
    return res.json({
      success: true,
      found: true,
      data: {
        nombre_completo: match.nombre_completo,
        tipo_documento: match.tipo_documento,
        numero_documento: match.numero_documento,
        correo: match.correo,
        num_telefonico: match.num_telefonico,
        edad: match.edad,
        distrito: match.distrito,
        menores: match.menores || []
      }
    });
  }

  return res.json({ success: true, found: false });
});

/**
 * Endpoint de Registro y Consentimiento
 */
app.post('/api/register', async (req, res) => {
  try {
    const {
      nombre_completo,
      correo,
      tipo_documento,
      numero_documento,
      num_telefonico,
      edad,
      distrito,
      menores,
      antecedentes_medicos,
      antecedentes_detalle,
      firma_digital,
      acepto_terminos,
      acepto_publicidad
    } = req.body;

    // Validaciones obligatorias
    if (!nombre_completo || !correo || !tipo_documento || !numero_documento || !edad) {
      return res.status(400).json({
        success: false,
        message: 'Por favor completa todos los campos obligatorios del titular.'
      });
    }

    if (parseInt(edad, 10) < 18) {
      return res.status(400).json({
        success: false,
        message: 'El titular o apoderado debe ser mayor de 18 años para firmar.'
      });
    }

    if (!acepto_terminos) {
      return res.status(400).json({
        success: false,
        message: 'Debes aceptar los Términos y Condiciones generales para continuar.'
      });
    }

    if (!firma_digital || !firma_digital.startsWith('data:image')) {
      return res.status(400).json({
        success: false,
        message: 'Por favor dibuja tu firma digital en el recuadro antes de enviar.'
      });
    }

    // Mapeo legible de tipo de documento
    const labelsDoc = {
      dni: 'DNI',
      ce: 'Carnet de Extranjería',
      pasaporte: 'Pasaporte',
      cc: 'Cédula de Ciudadanía',
      otro: 'Documento de Identidad'
    };
    const tipoDocLabel = labelsDoc[tipo_documento.toLowerCase()] || tipo_documento.toUpperCase();

    const timestamp = new Date();
    const fechaHoraStr = timestamp.toLocaleString('es-PE', {
      timeZone: 'America/Lima',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const registroId = `PX-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 899 + 100)}`;

    const datosPDF = {
      registro_id: registroId,
      nombre_completo: nombre_completo.trim(),
      correo: correo.trim(),
      tipo_documento: tipo_documento,
      tipo_documento_label: tipoDocLabel,
      numero_documento: numero_documento.trim(),
      num_telefonico: (num_telefonico || '').trim(),
      edad: parseInt(edad, 10),
      distrito: (distrito || '').trim(),
      sede: PARK_SEDE,
      fecha_hora: fechaHoraStr,
      menores: Array.isArray(menores) ? menores : [],
      antecedentes_medicos: antecedentes_medicos === 'SI' ? `SÍ (${antecedentes_detalle || 'Detallado en ficha'})` : 'NO',
      firma_digital: firma_digital
    };

    // 1. Generación del PDF firmado
    console.log(`Generando PDF para ${datosPDF.nombre_completo} [${registroId}]...`);
    const pdfBuffer = await generateDisclaimerPdf(datosPDF);
    console.log(`PDF generado con éxito (${pdfBuffer.length} bytes).`);

    // 2. Respaldo en base de datos local
    const registroParaGuardar = {
      id: registroId,
      fecha_creacion: timestamp.toISOString(),
      fecha_hora_local: fechaHoraStr,
      sede: PARK_SEDE,
      ...datosPDF,
      acepto_publicidad: Boolean(acepto_publicidad),
      ip: req.ip || req.headers['x-forwarded-for'] || ''
    };
    saveRegistro(registroParaGuardar);

    // 3. Envío de correos vía Resend
    const filenamePdf = `disclaimer_${numero_documento}_${Date.now()}.pdf`;
    let emailStatus = { sentUser: false, sentAdmin: false, details: null };

    if (resendClient) {
      try {
        console.log(`Enviando correo de confirmación a: ${correo}...`);

        // Plantilla HTML del correo al usuario (Fiel a la captura media_1789927900504.jpg)
        const htmlUsuario = `
          <div style="background-color: #121212; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 32px 20px; max-width: 600px; margin: 0 auto; border-radius: 14px; border: 1px solid #2a2a2a;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #00e5ff; font-size: 26px; font-weight: 800; margin: 0 0 10px 0; letter-spacing: -0.02em;">¡Gracias por tu visita!</h1>
            </div>
            <p style="font-size: 16px; line-height: 1.6; color: #f0f0f0; margin-bottom: 16px;">
              Hola <strong>${datosPDF.nombre_completo}</strong>,
            </p>
            <p style="font-size: 15px; line-height: 1.6; color: #cccccc; margin-bottom: 16px;">
              Gracias por venir a <strong>Paradox Park</strong> y firmar nuestro acuerdo de responsabilidad y consentimiento para la sede <strong>${PARK_SEDE}</strong>.
            </p>
            <p style="font-size: 15px; line-height: 1.6; color: #cccccc; margin-bottom: 24px;">
              Adjuntamos una copia en PDF del documento firmado para tus registros.
            </p>
            <div style="background: rgba(121, 39, 205, 0.15); border: 1px solid #7927CD; border-radius: 10px; padding: 14px 18px; margin-bottom: 26px;">
              <p style="margin: 0; font-size: 13.5px; color: #dcdcdc;">
                <strong>Código de Registro:</strong> ${registroId}<br/>
                <strong>Documento:</strong> ${tipoDocLabel} ${numero_documento}<br/>
                <strong>Acompañantes menores:</strong> ${datosPDF.menores.length} registrado(s)
              </p>
            </div>
            <p style="font-size: 15px; line-height: 1.6; color: #f0f0f0; margin: 0 0 4px 0;">
              Saludos,
            </p>
            <p style="font-size: 15px; font-weight: bold; color: #00e5ff; margin: 0 0 24px 0;">
              El equipo de Paradox Park
            </p>
            <hr style="border: none; border-top: 1px solid #282828; margin: 24px 0;" />
            <p style="font-size: 12px; color: #777777; text-align: center; margin: 0;">
              © ${new Date().getFullYear()} Paradox Park. Todos los derechos reservados.
            </p>
          </div>
        `;

        // 3.1 Envío al usuario
        const resultUser = await resendClient.emails.send({
          from: RESEND_FROM,
          to: [correo.trim()],
          subject: 'ACUERDO DE CONSENTIMIENTO - Paradox Park',
          html: htmlUsuario,
          attachments: [
            {
              filename: filenamePdf,
              content: pdfBuffer
            }
          ]
        });
        console.log('Correo al usuario enviado con ID:', resultUser.data?.id || resultUser);
        emailStatus.sentUser = true;

        // 3.2 Envío a administración (Hola@paradox-park.com)
        console.log(`Enviando notificación administrativa a: ${ADMIN_EMAIL}...`);
        const htmlAdmin = `
          <div style="background-color: #f7f9fa; color: #222; font-family: sans-serif; padding: 24px; max-width: 650px; border-radius: 10px; border: 1px solid #e1e4e8;">
            <h2 style="color: #7927CD; margin-top: 0;">Nuevo Registro y Consentimiento Firmado</h2>
            <p>Se ha registrado un nuevo visitante en <strong>${PARK_SEDE}</strong>:</p>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px 0; font-weight: bold;">ID Registro:</td><td>${registroId}</td></tr>
              <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px 0; font-weight: bold;">Titular:</td><td>${datosPDF.nombre_completo}</td></tr>
              <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px 0; font-weight: bold;">Documento:</td><td>${tipoDocLabel} ${numero_documento}</td></tr>
              <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px 0; font-weight: bold;">Correo:</td><td>${correo}</td></tr>
              <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px 0; font-weight: bold;">Teléfono:</td><td>${num_telefonico || 'No especificado'}</td></tr>
              <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px 0; font-weight: bold;">Edad:</td><td>${edad} años</td></tr>
              <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px 0; font-weight: bold;">Distrito:</td><td>${distrito || 'No especificado'}</td></tr>
              <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px 0; font-weight: bold;">Fecha y Hora:</td><td>${fechaHoraStr}</td></tr>
              <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px 0; font-weight: bold;">Menores Registrados:</td><td>${datosPDF.menores.length > 0 ? JSON.stringify(datosPDF.menores) : 'Ninguno'}</td></tr>
              <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px 0; font-weight: bold;">Antecedentes Médicos:</td><td>${datosPDF.antecedentes_medicos}</td></tr>
            </table>
            <p style="font-size: 13px; color: #555;">El acuerdo firmado en formato PDF se encuentra adjunto a este mensaje.</p>
          </div>
        `;

        const resultAdmin = await resendClient.emails.send({
          from: RESEND_FROM,
          to: [ADMIN_EMAIL.trim()],
          subject: `Nuevo Registro & Disclaimer: ${datosPDF.nombre_completo} - ${numero_documento}`,
          html: htmlAdmin,
          attachments: [
            {
              filename: filenamePdf,
              content: pdfBuffer
            }
          ]
        });
        console.log('Correo administrativo enviado con ID:', resultAdmin.data?.id || resultAdmin);
        emailStatus.sentAdmin = true;
      } catch (errResend) {
        console.error('Error enviando correos con Resend:', errResend.message);
        emailStatus.details = errResend.message;
      }
    } else {
      console.log('ℹ️ RESEND_API_KEY no configurada aún en .env. El PDF se generó y guardó localmente.');
    }

    // Retornar éxito al frontend para renderizar la pantalla de confirmación
    return res.json({
      success: true,
      message: 'Formulario enviado correctamente.',
      registrationId: registroId,
      sede: PARK_SEDE,
      user: {
        nombre_completo: datosPDF.nombre_completo,
        correo: datosPDF.correo,
        numero_documento: datosPDF.numero_documento,
        sede: PARK_SEDE
      },
      emailStatus: emailStatus
    });
  } catch (error) {
    console.error('Error en /api/register:', error);
    return res.status(500).json({
      success: false,
      message: 'Ocurrió un error inesperado al procesar el registro. Inténtalo nuevamente.'
    });
  }
});

// Arrancar servidor solo en modo local directo (no en serverless de Vercel)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 PARADOX PARK Landing Page lista en:`);
    console.log(`👉 http://localhost:${PORT}`);
    console.log(`📧 Remitente Resend configurado: ${RESEND_FROM}`);
    console.log(`📬 Correo de notificaciones: ${ADMIN_EMAIL}`);
    console.log(`====================================================`);
  });
}

module.exports = app;
