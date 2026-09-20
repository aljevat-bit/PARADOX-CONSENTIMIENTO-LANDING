# Paradox Park — Landing Page de Consentimiento y Registro

Landing page oficial de registro y **Acuerdo de Consentimiento y Responsabilidad** para **Paradox Park (Era Imperium Lima)**.

Diseñada con la identidad visual oficial de Paradox Park (`paradoxparks.com`), integrando la paleta neón (`#7927CD`, `#FF7700`, `#02C2FF`), topbar animada con marquesina continua, header y footer institucional, firma digital interactiva en canvas, gestión dinámica de menores a cargo con cálculo automático de edad, modal con los 18 artículos de términos y condiciones, generación automática de PDF firmado y despacho de correos vía **Resend**.

---

## 🌟 Características Principales

1. **Estética y Diseño Oficial**:
   - Paleta de color oficial: Púrpura inmersivo (`#7927CD`), Naranja vibrante (`#FF7700`), Cyan eléctrico (`#02C2FF`) y modo oscuro cinematográfico.
   - Marquesina neón superior con textos rotativos de Paradox Park.
   - Header sticky con desenfoque de cristal (backdrop blur) y navegación responsiva.
   - Footer oficial en blanco con enlaces institucionales, redes sociales y contacto directo (WhatsApp y Email).

2. **Formulario de Registro y Consentimiento**:
   - Validación de datos del adulto responsable (+18 años obligatorios).
   - Selector dinámico de tipo de documento (DNI, C.E., Pasaporte, Cédula de Ciudadanía).
   - Buscador predictivo para visitantes recurrentes (recupera sus datos por documento sin volver a escribir).
   - **Sección interactiva de menores a cargo**: Permite añadir múltiples niños o adolescentes con cálculo instantáneo de edad a partir de su fecha de nacimiento y selección de vínculo (Padre, Madre, Tutor, etc.).
   - Declaración de antecedentes médicos preexistentes.
   - **Pad de Firma Digital**: Canvas de alta resolución compatible con pantallas táctiles móviles y mouse (`signature_pad`).

3. **Términos y Condiciones Oficiales**:
   - Modal interactivo con los 18 artículos completos extraídos del reglamento oficial de Paradox Park (entradas, turnos mañana 10:00-14:30 y tarde 16:00-20:30, uso obligatorio de medias antideslizantes, asunción de riesgo, Ley N.° 29733 de datos personales, derechos de imagen, etc.).

4. **Generación Automática de PDF Firmado (`pdfkit`)**:
   - Al enviar el formulario, el servidor genera en memoria un documento PDF formal idéntico al modelo de referencia.
   - Incluye el logo de Paradox Park, metadatos de la sede y fecha/hora, declaración jurada con lista de menores acompañantes, todas las cláusulas legales y la imagen de la firma digital trazada por el usuario.

5. **Envío de Correos Automatizado (Resend)**:
   - **Al Visitante**: Correo de confirmación con el formato exacto (*"¡Gracias por tu visita!"*), remitente configurable (`info@paradox-park.com`) y el PDF firmado adjunto (`disclaimer_[DOC]_[TIMESTAMP].pdf`).
   - **A la Administración**: Notificación a `Hola@paradox-park.com` con la ficha técnica del visitante y el PDF firmado adjunto.

6. **Pantalla de Confirmación Inmediata**:
   - Réplica exacta de la pantalla de confirmación: logo, saludo con nombre personalizado, confirmación de sede (*Lima - Era Imperium*), correo de envío, y el distintivo verde para mostrar en puerta a los guardianes del portal para ingresar.

7. **Persistencia Local**:
   - Respaldo automático de todos los registros en `data/registros.json` para auditoría y exportación.

---

## 🚀 Instalación y Puesta en Marcha

### 1. Prerrequisitos
- [Node.js](https://nodejs.org/) (versión 18 o superior).

### 2. Clonar e Instalar Dependencias
```bash
git clone https://github.com/aljevat-bit/PARADOX-CONSENTIMIENTO-LANDING.git
cd PARADOX-CONSENTIMIENTO-LANDING
npm install
```

### 3. Configuración de Variables de Entorno (`.env`)
Edita el archivo `.env` con tus credenciales:
```env
PORT=3001
RESEND_API_KEY=re_tu_api_key_aqui
RESEND_FROM_EMAIL=Paradox Park <info@paradox-park.com>
ADMIN_NOTIFICATION_EMAIL=Hola@paradox-park.com
PARK_SEDE=Lima - Era Imperium
```

> **Nota para pruebas**: Si aún no has verificado el dominio `paradox-park.com` en Resend, puedes usar temporalmente `onboarding@resend.dev` en `RESEND_FROM_EMAIL` para enviar correos a tu dirección de prueba registrada en Resend.

### 4. Iniciar el Servidor
```bash
npm start
```
Abre tu navegador en:
```
http://localhost:3001
```

---

## 📁 Estructura del Proyecto

```
├── .env                       # Variables de entorno privadas
├── .env.example               # Plantilla de configuración
├── .gitignore                 # Archivos excluidos del repositorio
├── package.json               # Dependencias y scripts de Node.js
├── README.md                  # Documentación del proyecto
├── server.js                  # Servidor Express, endpoints /api/register y /api/lookup
├── data/
│   └── registros.json         # Base de datos local en JSON para respaldo
├── lib/
│   └── pdf-generator.js       # Generador de PDF oficial firmado con pdfkit
├── public/
│   ├── index.html             # Landing page completa con formulario, modal y confirmación
│   ├── css/
│   │   └── style.css          # Estilos oficiales Paradox Park (responsive y dark mode)
│   ├── js/
│   │   ├── app.js             # Lógica de frontend (canvas, menores, validación y fetch)
│   │   └── terminos-data.js   # 18 artículos de Términos y Condiciones oficiales
│   └── assets/
│       └── logo.png           # Logo oficial de Paradox Park (fondo transparente)
└── referencias/               # Archivos originales de referencia
```

---

## 📄 Licencia
Todos los derechos reservados © 2026 Paradox Park.
