const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

/**
 * Genera el PDF del Acuerdo de Consentimiento y Responsabilidad de Paradox Park
 * @param {Object} data - Datos del titular, menores, fecha y firma
 * @returns {Promise<Buffer>} - Buffer del PDF generado
 */
function generateDisclaimerPdf(data) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 40, bottom: 40, left: 45, right: 45 },
        autoFirstPage: true,
        bufferPages: true
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      doc.on('error', (err) => reject(err));

      let logoPath = path.join(__dirname, '../public/assets/logo.png');
      if (!fs.existsSync(logoPath)) {
        logoPath = path.join(process.cwd(), 'public/assets/logo.png');
      }
      const hasLogo = fs.existsSync(logoPath);

      // --- LOGO SUPERIOR ---
      if (hasLogo) {
        try {
          doc.image(logoPath, (doc.page.width - 170) / 2, 35, { width: 170 });
          doc.moveDown(4.5);
        } catch (e) {
          console.warn('Error al incrustar logo en PDF:', e.message);
          doc.moveDown(2);
        }
      } else {
        doc.moveDown(2);
      }

      // --- TÍTULO PRINCIPAL ---
      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .fillColor('#00a896')
        .text('ACUERDO DE CONSENTIMIENTO Y RESPONSABILIDAD DE', { align: 'center' })
        .text('PARADOX PARK (ERA IMPERIUM LIMA)', { align: 'center' });

      doc.moveDown(0.6);

      // --- NOTA LEGAL INFORMATIVA ---
      doc
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .fillColor('#222222')
        .text(
          'NOTA: POR FAVOR LEA CUIDADOSAMENTE Y FIRME ESTE DOCUMENTO. AL FIRMARLO, USTED ACEPTA HABER LEÍDO LAS CONDICIONES INDICADAS Y RECONOCE LAS OBLIGACIONES QUE ESTÁN A SU CARGO.',
          { align: 'center', lineGap: 1 }
        );

      doc.moveDown(0.8);

      // --- METADATOS: SEDE Y FECHA ---
      const fechaHora = data.fecha_hora || new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });
      const sede = data.sede || 'Lima – Perú (Era Imperium)';

      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor('#333333')
        .text(`Sede: ${sede}`, { align: 'center' })
        .text(`Fecha: ${fechaHora}`, { align: 'center' });

      doc.moveDown(1);

      // --- PREPARACIÓN DE MENORES A CARGO ---
      let textoMenores = 'Ninguno';
      if (data.menores && Array.isArray(data.menores) && data.menores.length > 0) {
        textoMenores = data.menores
          .filter((m) => m.nombre && m.nombre.trim() !== '')
          .map((m) => `${m.nombre.trim()} (${m.edad ? m.edad + ' años' : 'menor'})`)
          .join(', ');
        if (!textoMenores) textoMenores = 'Ninguno';
      }

      // --- PÁRRAFOS INTRODUCTORIOS (DECLARACIÓN JURADA) ---
      const tipoDocStr = data.tipo_documento_label || data.tipo_documento || 'Documento de Identidad';
      const numDocStr = data.numero_documento || '---';
      const titularNombre = data.nombre_completo || 'Titular';

      doc
        .font('Helvetica')
        .fontSize(8.8)
        .fillColor('#222222')
        .text(
          `Yo, ${titularNombre}, identificado(a) con ${tipoDocStr} Nº ${numDocStr}, declaro bajo juramento, tanto a nombre propio como sobre aquellos que estén bajo mi custodia: ${textoMenores}, respecto de los cuales soy padre/madre y/o adulto responsable de su cuidado que cuento con las facultades necesarias conforme a ley y/o consentimiento del padre/madre/apoderado para permitirlos participar en los juegos y experiencias de PARADOX PARK.`,
          { align: 'justify', lineGap: 2.2 }
        );

      doc.moveDown(0.7);

      doc.text(
        'Así mismo, manifiesto que permito voluntariamente que los menores de edad identificados anteriormente, los cuales se encuentran bajo mi cuidado y han sido referidos individual y colectivamente en este documento como "menor de edad", usen las instalaciones y equipos en PARADOX PARK de Era Imperium (en adelante "Paradox Park").',
        { align: 'justify', lineGap: 2.2 }
      );

      doc.moveDown(0.7);

      doc
        .font('Helvetica-Bold')
        .text('En este sentido declaro, reconozco y acepto lo siguiente:');

      doc.moveDown(0.6);

      // --- CLÁUSULAS OFICIALES PARADOX PARK ---
      const clausulas = [
        'Reconozco que tengo derecho al uso de las atracciones y experiencias de PARADOX PARK, siempre y cuando cumpla con los requisitos, condiciones y/o restricciones (que se encuentran en los reglamentos y señalización interna de cada atracción, turnos y aforo), por el tiempo contratado. Los turnos establecidos son Turno Mañana (10:00 a.m. a 2:30 p.m.) y Turno Tarde (4:00 p.m. a 8:30 p.m.). Finalizado el turno contratado entiendo que no podré hacer uso de las atracciones.',
        'Reconozco y acepto que yo y los menores de edad bajo mi cuidado estamos participando voluntariamente y bajo nuestro propio riesgo en las actividades, estructuras inflables, recorridos interactivos y juegos disponibles en PARADOX PARK. Entiendo que la participación implica actividades físicas y destreza con riesgos inherentes conocidos y desconocidos, tales como caídas, tropiezos, sobresaltos, golpes, torceduras, raspaduras, descompensaciones o cualquier contingencia derivada del esfuerzo físico.',
        'Acepto que PARADOX PARK no será responsable de las consecuencias de mis propios actos o de los menores de edad bajo mi cuidado cuando deriven del incumplimiento de las normas de seguridad, del uso indebido de las instalaciones o de la imprudencia de los visitantes.',
        'Acepto que, si bien el personal supervisa las actividades y la dinámica del parque, no es factible vigilar individual y simultáneamente las acciones de todos los visitantes en todo momento, por lo que PARADOX PARK no es responsable por actos fortuitos o accidentales de terceros. Asumo voluntariamente estos riesgos siendo consciente de la naturaleza inmersiva del evento.',
        'Asumo el riesgo de todas y cada una de las condiciones médicas preexistentes, limitaciones físicas, afecciones cardíacas, respiratorias, lesiones en articulaciones o columna, embarazo o sensibilidad a estímulos visuales y sonoros intensos que posea yo o los menores a mi cargo, comprometiéndome a abstenerme de participar en actividades que puedan agravarlas.',
        'Declaro conocer que el uso de MEDIAS ANTIDESLIZANTES es obligatorio e indispensable para ingresar a las áreas de juegos y atracciones por motivos de seguridad e higiene, debiendo portar vestimenta adecuada y apta para un ambiente familiar.',
        'Autorizo al personal de PARADOX PARK a brindar asistencia de primeros auxilios y coordinar atención médica de urgencia en caso necesario, asumiendo los costos del traslado o atención médica especializada que pudiera requerirse, sin que ello constituya asunción de responsabilidad por parte del parque.',
        'En caso de que ocurra algún incidente, accidente o contingencia de salud, me comprometo a comunicarlo de inmediato al personal del parque y completar el formulario de registro de incidentes correspondiente.',
        'Conforme a la Ley N.° 29733 (Ley de Protección de Datos Personales), autorizo de manera libre, previa, expresa e informada el tratamiento de mis datos personales y los de los menores representados para la gestión del evento y finalidades informativas. Asimismo, otorgo mi consentimiento para la captación, fijación y difusión de fotografías o grabaciones de video en las que aparezcamos dentro del recinto con fines promocionales e institucionales de PARADOX PARK en cualquier medio o plataforma.',
        `Indique si usted o su menor a cargo presenta algún antecedente, diagnóstico o enfermedad preexistente relevante para su seguridad:\nAntecedentes médicos declarados: ${data.antecedentes_medicos || 'NO'}.`,
        'Declaro que he sido informado(a), expresa y claramente de las condiciones y reglamento de las atracciones, que he leído en su integridad el presente documento, que lo he comprendido, y que estoy de acuerdo plenamente con todos sus términos y condiciones. Me comprometo a leer y cumplir todas las indicaciones y recomendaciones de seguridad de PARADOX PARK, por lo cual firmo en señal de aceptación y total conformidad previo a acceder a las instalaciones.'
      ];

      clausulas.forEach((texto, idx) => {
        // Manejo de saltos de página suaves para que no corte la firma
        if (doc.y > 670) {
          doc.addPage();
        }

        doc
          .font('Helvetica-Bold')
          .fontSize(8.4)
          .fillColor('#222222')
          .text(`${idx + 1}. `, { continued: true })
          .font('Helvetica')
          .text(texto, { align: 'justify', lineGap: 1.8 });

        doc.moveDown(0.5);
      });

      // --- SECCIÓN DE FIRMA DIGITAL ---
      if (doc.y > 600) {
        doc.addPage();
      } else {
        doc.moveDown(1);
      }

      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor('#000000')
        .text('FIRMA DEL ADULTO RESPONSABLE:', { align: 'left' });

      doc.moveDown(0.4);

      // Si viene imagen de firma en base64
      if (data.firma_digital && data.firma_digital.startsWith('data:image')) {
        try {
          const base64Data = data.firma_digital.replace(/^data:image\/\w+;base64,/, '');
          const imgBuffer = Buffer.from(base64Data, 'base64');
          doc.image(imgBuffer, 50, doc.y, { height: 60 });
          doc.moveDown(4.5);
        } catch (e) {
          console.warn('Error al procesar firma digital base64:', e.message);
          doc.moveDown(3);
        }
      } else {
        doc.moveDown(3);
      }

      // Línea de firma y datos del titular
      doc
        .strokeColor('#555555')
        .lineWidth(0.8)
        .moveTo(50, doc.y)
        .lineTo(260, doc.y)
        .stroke();

      doc.moveDown(0.4);

      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor('#111111')
        .text(titularNombre, 50, doc.y)
        .font('Helvetica')
        .fontSize(8.5)
        .fillColor('#444444')
        .text(`${tipoDocStr}: ${numDocStr}`, 50, doc.y + 12);

      // Finalizar documento
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateDisclaimerPdf };
