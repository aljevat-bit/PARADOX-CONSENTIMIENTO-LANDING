/**
 * Paradox Park — Aplicación Frontend
 * Manejo de Formulario, Firma Digital (SignaturePad), Menores, Modal y Pantalla de Éxito
 */

document.addEventListener('DOMContentLoaded', () => {
  // Referencias DOM
  const form = document.getElementById('disclaimerForm');
  const submitBtn = document.getElementById('submitBtn');
  const submitBtnText = document.getElementById('submitBtnText');
  const submitSpinner = document.getElementById('submitSpinner');
  const formCard = document.getElementById('formCard');
  const successView = document.getElementById('successView');
  const btnNewAgreement = document.getElementById('btnNewAgreement');

  // Firma Digital
  const canvas = document.getElementById('signaturePad');
  const clearBtn = document.getElementById('btnClearSig');
  let signaturePad = null;

  // Menores
  const menoresContainer = document.getElementById('menoresContainer');
  const btnAddMenor = document.getElementById('btnAddMenor');

  // Modal Términos y Condiciones
  const terminosModal = document.getElementById('terminosModal');
  const modalBody = document.getElementById('modalTerminosBody');
  const openModalLinks = document.querySelectorAll('.open-tc-modal');
  const closeModalBtns = document.querySelectorAll('.close-tc-modal');

  // Menú Móvil
  const burgerBtn = document.getElementById('pxBurger');
  const mobileMenu = document.getElementById('pxMobileMenu');
  const mobileClose = document.getElementById('pxMobileClose');
  const mobileOverlay = document.getElementById('pxOverlay');

  // Buscador Opcional
  const btnLookup = document.getElementById('btnLookup');
  const inputLookupDoc = document.getElementById('lookupDoc');
  const selectLookupTipo = document.getElementById('lookupTipo');
  const lookupMsg = document.getElementById('lookupMsg');

  // Antecedentes Médicos
  const antRadios = document.querySelectorAll('input[name="antecedentes_medicos"]');
  const antDetalleGroup = document.getElementById('antDetalleGroup');

  // ── 1. Inicialización de Signature Pad ──────────────────────────────────
  if (canvas) {
    signaturePad = new SignaturePad(canvas, {
      backgroundColor: 'rgb(255, 255, 255)',
      penColor: 'rgb(10, 10, 15)',
      minWidth: 1.5,
      maxWidth: 3.5
    });

    function resizeCanvas() {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const data = signaturePad.toData();
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext('2d').scale(ratio, ratio);
      signaturePad.clear();
      if (data && data.length > 0) {
        signaturePad.fromData(data);
      }
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        signaturePad.clear();
      });
    }
  }

  // ── 2. Gestión Dinámica de Menores ─────────────────────────────────────
  function calcularEdadDesdeFecha(fechaStr) {
    if (!fechaStr) return '';
    const hoy = new Date();
    const fn = new Date(fechaStr + 'T00:00:00');
    if (isNaN(fn.getTime())) return '';
    let edad = hoy.getFullYear() - fn.getFullYear();
    const m = hoy.getMonth() - fn.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < fn.getDate())) {
      edad--;
    }
    return edad >= 0 && edad < 120 ? edad : '';
  }

  function crearFilaMenor(datos = {}) {
    const card = document.createElement('div');
    card.className = 'px-menor-card';

    card.innerHTML = `
      <div class="px-menor-top">
        <input type="text" class="px-input menor-nombre" placeholder="Nombre y Apellido del menor" value="${datos.nombre || ''}" required />
        <button type="button" class="px-btn-del-menor" title="Eliminar menor">&times;</button>
      </div>
      <div class="px-menor-details">
        <div>
          <label class="px-field-label" style="font-size:11.5px;">Fecha de Nacimiento</label>
          <input type="date" class="px-input menor-fnac" value="${datos.fecha_nacimiento || ''}" required />
        </div>
        <div>
          <label class="px-field-label" style="font-size:11.5px;">Edad</label>
          <input type="number" class="px-input menor-edad" placeholder="Edad" readonly style="background:#22222e;" value="${datos.edad || ''}" />
        </div>
        <div>
          <label class="px-field-label" style="font-size:11.5px;">Vínculo</label>
          <select class="px-select menor-vinculo">
            <option value="Padre" ${datos.vinculo === 'Padre' ? 'selected' : ''}>Padre</option>
            <option value="Madre" ${datos.vinculo === 'Madre' ? 'selected' : ''}>Madre</option>
            <option value="Tutor" ${datos.vinculo === 'Tutor' ? 'selected' : ''}>Tutor(a)</option>
            <option value="Abuelo" ${datos.vinculo === 'Abuelo' ? 'selected' : ''}>Abuelo(a)</option>
            <option value="Otro" ${datos.vinculo === 'Otro' ? 'selected' : ''}>Otro familiar</option>
          </select>
        </div>
      </div>
    `;

    // Eventos del menor
    const fnacInput = card.querySelector('.menor-fnac');
    const edadInput = card.querySelector('.menor-edad');
    const delBtn = card.querySelector('.px-btn-del-menor');

    fnacInput.addEventListener('change', () => {
      edadInput.value = calcularEdadDesdeFecha(fnacInput.value);
    });

    if (datos.fecha_nacimiento && !datos.edad) {
      edadInput.value = calcularEdadDesdeFecha(datos.fecha_nacimiento);
    }

    delBtn.addEventListener('click', () => {
      card.remove();
    });

    return card;
  }

  if (btnAddMenor && menoresContainer) {
    btnAddMenor.addEventListener('click', () => {
      const nuevaFila = crearFilaMenor();
      menoresContainer.appendChild(nuevaFila);
    });
  }

  // ── 3. Toggle de Antecedentes Médicos ──────────────────────────────────
  if (antRadios && antDetalleGroup) {
    antRadios.forEach((radio) => {
      radio.addEventListener('change', () => {
        if (radio.value === 'SI' && radio.checked) {
          antDetalleGroup.style.display = 'block';
        } else {
          antDetalleGroup.style.display = 'none';
        }
      });
    });
  }

  // ── 4. Búsqueda de Visitantes Recurrentes ──────────────────────────────
  if (btnLookup && inputLookupDoc) {
    btnLookup.addEventListener('click', async () => {
      const doc = inputLookupDoc.value.trim();
      const tipo = selectLookupTipo ? selectLookupTipo.value : '';
      if (!doc) {
        alert('Por favor ingresa un número de documento para buscar.');
        return;
      }

      btnLookup.disabled = true;
      btnLookup.textContent = 'Buscando...';
      lookupMsg.style.display = 'none';

      try {
        const res = await fetch(`/api/lookup?doc=${encodeURIComponent(doc)}&tipo=${encodeURIComponent(tipo)}`);
        const json = await res.parse ? await res.json() : await res.json();
        if (json.success && json.found && json.data) {
          const d = json.data;
          document.getElementById('nombreCompleto').value = d.nombre_completo || '';
          document.getElementById('correo').value = d.correo || '';
          document.getElementById('tipoDocumento').value = d.tipo_documento || 'dni';
          document.getElementById('numDocumento').value = d.numero_documento || '';
          document.getElementById('telefono').value = d.num_telefonico || '';
          document.getElementById('edadTitular').value = d.edad || '';
          document.getElementById('distrito').value = d.distrito || '';

          // Cargar menores previos si los hay
          if (d.menores && Array.isArray(d.menores) && d.menores.length > 0) {
            menoresContainer.innerHTML = '';
            d.menores.forEach((m) => {
              menoresContainer.appendChild(crearFilaMenor(m));
            });
          }

          lookupMsg.innerHTML = `<span style="color:#02C2FF;">✓ ¡Bienvenido de nuevo! Tus datos han sido cargados. Verifica que todo esté al día.</span>`;
          lookupMsg.style.display = 'block';
        } else {
          lookupMsg.innerHTML = `<span style="color:#f6a965;">ℹ No se encontraron registros anteriores con este documento. Completa el formulario a continuación.</span>`;
          lookupMsg.style.display = 'block';
        }
      } catch (e) {
        console.error('Error buscando visitante:', e);
      } finally {
        btnLookup.disabled = false;
        btnLookup.textContent = 'Buscar';
      }
    });
  }

  // ── 5. Renderizado y Aceptación Obligatoria de Términos y Condiciones ─────────
  const btnAceptarTerminosModal = document.getElementById('btnAceptarTerminosModal');
  const checkTerminos = document.getElementById('aceptoTerminos');
  const tcBoxContainer = document.getElementById('tcBoxContainer');
  const tcStatusNotice = document.getElementById('tcStatusNotice');
  const tcAcceptedBadge = document.getElementById('tcAcceptedBadge');
  let terminosLeidosYAceptados = false;

  if (modalBody && typeof PARADOX_TERMINOS_Y_CONDICIONES !== 'undefined') {
    modalBody.innerHTML = '';

    const tc = PARADOX_TERMINOS_Y_CONDICIONES;

    // Encabezado y preámbulo
    const introDiv = document.createElement('div');
    introDiv.style.marginBottom = '24px';
    introDiv.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
    introDiv.style.paddingBottom = '16px';
    introDiv.innerHTML = `
      <h3 style="color:#fff; font-size:16px; font-weight:800; font-style:italic; text-transform:uppercase; margin-bottom:4px;">
        ${tc.titulo}
      </h3>
      <div style="color:var(--px-accent); font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:12px;">
        ${tc.subtitulo}
      </div>
      <p style="font-size:14px; color:rgba(255,255,255,0.85); line-height:1.6; text-align:justify; font-style:italic;">
        ${tc.preambulo}
      </p>
    `;
    modalBody.appendChild(introDiv);

    // Renderizado de cada artículo
    if (tc.articulos && Array.isArray(tc.articulos)) {
      tc.articulos.forEach((art) => {
        const artDiv = document.createElement('div');
        artDiv.style.marginBottom = '22px';

        let htmlContent = `
          <h4 style="color:#02C2FF; font-weight:800; font-size:14px; text-transform:uppercase; margin-bottom:8px; letter-spacing:0.04em;">
            ${art.num}. ${art.titulo}
          </h4>
        `;

        if (art.parrafos && art.parrafos.length > 0) {
          art.parrafos.forEach((p) => {
            htmlContent += `<p style="margin-bottom:8px; text-align:justify; font-size:14px; line-height:1.6;">${p}</p>`;
          });
        }

        if (art.bullets && art.bullets.length > 0) {
          htmlContent += `<ul style="margin: 8px 0 10px 24px; padding-left: 0; list-style-type: disc; color: rgba(255,255,255,0.85); font-size: 13.5px; line-height: 1.6;">`;
          art.bullets.forEach((b) => {
            htmlContent += `<li style="margin-bottom: 5px; text-align:justify;">${b}</li>`;
          });
          htmlContent += `</ul>`;
        }

        if (art.parrafos_finales && art.parrafos_finales.length > 0) {
          art.parrafos_finales.forEach((pf) => {
            htmlContent += `<p style="margin-bottom:8px; text-align:justify; font-size:14px; line-height:1.6;">${pf}</p>`;
          });
        }

        artDiv.innerHTML = htmlContent;
        modalBody.appendChild(artDiv);
      });
    }
  }

  function openModal() {
    if (terminosModal) terminosModal.classList.add('px-modal-open');
  }
  function closeModal() {
    if (terminosModal) terminosModal.classList.remove('px-modal-open');
  }

  // Interceptar clic en el recuadro si no han sido leídos
  if (tcBoxContainer) {
    tcBoxContainer.addEventListener('click', (e) => {
      if (!terminosLeidosYAceptados && !e.target.classList.contains('open-tc-modal')) {
        e.preventDefault();
        openModal();
      }
    });
  }

  // Aceptación explícita mediante el botón en el modal
  if (btnAceptarTerminosModal) {
    btnAceptarTerminosModal.addEventListener('click', () => {
      terminosLeidosYAceptados = true;
      if (checkTerminos) {
        checkTerminos.disabled = false;
        checkTerminos.checked = true;
        checkTerminos.style.cursor = 'pointer';
        checkTerminos.style.opacity = '1';
      }
      if (tcStatusNotice) tcStatusNotice.style.display = 'none';
      if (tcAcceptedBadge) tcAcceptedBadge.style.display = 'flex';
      closeModal();
    });
  }

  openModalLinks.forEach((l) => l.addEventListener('click', (e) => { e.preventDefault(); openModal(); }));
  closeModalBtns.forEach((b) => b.addEventListener('click', closeModal));
  if (terminosModal) {
    terminosModal.addEventListener('click', (e) => {
      if (e.target === terminosModal) closeModal();
    });
  }

  // ── 6. Menú Móvil ──────────────────────────────────────────────────────
  if (burgerBtn && mobileMenu && mobileOverlay && mobileClose) {
    function openMenu() {
      mobileMenu.classList.add('px-open');
      mobileOverlay.classList.add('px-open');
    }
    function closeMenu() {
      mobileMenu.classList.remove('px-open');
      mobileOverlay.classList.remove('px-open');
    }
    burgerBtn.addEventListener('click', openMenu);
    mobileClose.addEventListener('click', closeMenu);
    mobileOverlay.addEventListener('click', closeMenu);
  }

  // ── 7. Envío del Formulario (Submit) ───────────────────────────────────
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Validación de mayoría de edad del titular
      const edadVal = parseInt(document.getElementById('edadTitular').value, 10);
      if (isNaN(edadVal) || edadVal < 18) {
        alert('El adulto responsable o titular debe tener al menos 18 años para firmar.');
        document.getElementById('edadTitular').focus();
        return;
      }

      // Validación de lectura obligatoria de términos y condiciones
      if (!terminosLeidosYAceptados || !checkTerminos || !checkTerminos.checked) {
        alert('Es obligatorio leer y aceptar los Términos y Condiciones Generales en su totalidad antes de enviar el formulario.');
        openModal();
        return;
      }

      // Validación de firma digital
      if (!signaturePad || signaturePad.isEmpty()) {
        alert('Por favor dibuja tu firma digital en el recuadro blanco antes de enviar.');
        canvas.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      // Recopilar datos de menores
      const menores = [];
      const menorCards = menoresContainer.querySelectorAll('.px-menor-card');
      menorCards.forEach((c) => {
        const nom = c.querySelector('.menor-nombre').value.trim();
        const fnac = c.querySelector('.menor-fnac').value;
        const ed = c.querySelector('.menor-edad').value;
        const vin = c.querySelector('.menor-vinculo').value;
        if (nom) {
          menores.push({
            nombre: nom,
            fecha_nacimiento: fnac,
            edad: ed ? parseInt(ed, 10) : calcularEdadDesdeFecha(fnac),
            vinculo: vin
          });
        }
      });

      // Recopilar antecedentes médicos
      let antMed = 'NO';
      const antCheck = document.querySelector('input[name="antecedentes_medicos"]:checked');
      if (antCheck && antCheck.value === 'SI') {
        antMed = 'SI';
      }
      const antDetalle = document.getElementById('antecedenteDetalle')?.value.trim() || '';

      const firmaBase64 = signaturePad.toDataURL('image/png');

      const payload = {
        nombre_completo: document.getElementById('nombreCompleto').value.trim(),
        correo: document.getElementById('correo').value.trim(),
        tipo_documento: document.getElementById('tipoDocumento').value,
        numero_documento: document.getElementById('numDocumento').value.trim(),
        num_telefonico: document.getElementById('telefono')?.value.trim() || '',
        edad: edadVal,
        distrito: document.getElementById('distrito')?.value.trim() || '',
        menores: menores,
        antecedentes_medicos: antMed,
        antecedentes_detalle: antDetalle,
        firma_digital: firmaBase64,
        acepto_terminos: true,
        acepto_publicidad: document.getElementById('aceptoPublicidad')?.checked || false
      };

      // Estado de carga en botón
      submitBtn.disabled = true;
      submitBtnText.textContent = 'Generando acuerdo y enviando comprobante...';
      submitSpinner.style.display = 'inline-block';

      try {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // Transición a la Pantalla de Éxito (idéntica a media_1789927900501.jpg)
          document.getElementById('successUserName').textContent = result.user?.nombre_completo || payload.nombre_completo;
          document.getElementById('successSede').textContent = result.sede || 'Lima - Era Imperium';
          document.getElementById('successUserEmail').textContent = result.user?.correo || payload.correo;

          formCard.style.display = 'none';
          successView.classList.add('px-visible');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          alert(`Error: ${result.message || 'No se pudo procesar el formulario'}`);
        }
      } catch (err) {
        console.error('Error al enviar formulario:', err);
        alert('Hubo un problema de conexión con el servidor. Inténtalo de nuevo.');
      } finally {
        submitBtn.disabled = false;
        submitBtnText.textContent = 'Confirmar y Enviar Registro';
        submitSpinner.style.display = 'none';
      }
    });
  }

  // ── 8. Reiniciar Formulario para Nuevo Acuerdo ────────────────────────
  if (btnNewAgreement) {
    btnNewAgreement.addEventListener('click', () => {
      form.reset();
      if (signaturePad) signaturePad.clear();
      menoresContainer.innerHTML = '';
      if (antDetalleGroup) antDetalleGroup.style.display = 'none';

      // Resetear estado de términos y condiciones
      terminosLeidosYAceptados = false;
      if (checkTerminos) {
        checkTerminos.checked = false;
        checkTerminos.disabled = true;
        checkTerminos.style.cursor = 'not-allowed';
        checkTerminos.style.opacity = '0.6';
      }
      if (tcStatusNotice) tcStatusNotice.style.display = 'flex';
      if (tcAcceptedBadge) tcAcceptedBadge.style.display = 'none';

      successView.classList.remove('px-visible');
      formCard.style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
});
