# 🌹 La Comadre Lola

Sitio web oficial de **La Comadre Lola** — Restaurant · Bar · Eventos · Quilicura.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML5 + CSS3 + JS vanilla (GitHub Pages) |
| Backend | Node.js + Express |
| Base de datos | MongoDB Atlas |
| Imágenes | Cloudinary |
| Autenticación | JWT |
| Email | Nodemailer |
| Deploy backend | Render.com |

---

## Estructura del proyecto

```
lacomadrelolaCL/
├── index.html          # Página principal (hero, galería, eventos, reservas)
├── admin.html          # Panel de administración (reservas, newsletter)
├── editor_cms.html     # CMS visual con preview en tiempo real
├── login.html          # Login del panel admin
├── assets/             # Fuentes y recursos estáticos locales
├── js/
│   └── api.js          # Cliente fetch para reservas y newsletter
├── backend/
│   ├── server.js       # API REST principal
│   ├── package.json
│   ├── start-mac.sh    # Script arranque local (mata puertos, inicia server)
│   └── .env.example    # Variables de entorno requeridas
├── render.yaml         # Infraestructura como código para Render.com
└── README.md
```

---

## Variables de entorno

Copia `backend/.env.example` a `backend/.env` y completa los valores:

```env
PORT=3001
NODE_ENV=development
MONGODB_URI=...
FRONTEND_URL=http://localhost:3001
ADMIN_USER=admin
ADMIN_PASS=...
JWT_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_FOLDER=lacomadrelola.cl
EMAIL_USER=...
EMAIL_PASS=...
ADMIN_EMAIL=...
```

---

## Correr localmente

```bash
# Desde la raíz del proyecto
npm run dev:clean

# O directamente desde backend/
cd backend
bash ./start-mac.sh dev
```

El script mata los puertos 3001 y 5500 antes de arrancar.

| URL | Descripción |
|-----|-------------|
| http://localhost:3001 | Sitio principal |
| http://localhost:3001/login | Login admin |
| http://localhost:3001/admin | Panel de administración |
| http://localhost:3001/editor | Editor CMS |
| http://localhost:3001/health | Health check |

---

## Deploy

### Backend — Render.com

1. Conecta el repositorio en [render.com](https://render.com)
2. Render detecta `render.yaml` automáticamente
3. Completa las variables `EMAIL_*` en el dashboard de Render antes del primer deploy

### Frontend — GitHub Pages

El frontend se sirve como sitio estático desde GitHub Pages.  
URL: `https://alexispferrada-wq.github.io/lacomadrelolaCL/`

---

## Funcionalidades

- **Hero con carrusel** — imágenes editables desde el CMS, crossfade automático
- **Sección Mejores Momentos** — galería con lightbox y navegación por teclado
- **Eventos** — cards dinámicas con flyer, precio, tag y botón de acción
- **Reservas** — formulario con validación y notificación por email
- **Newsletter** — suscripción con confirmación
- **Editor CMS** — panel visual con autosave, preview en tiempo real y subida a Cloudinary
- **Panel Admin** — gestión de reservas y suscriptores

---

## Seguridad

- Headers HTTP seguros con `helmet`
- Rate limiting: 20 intentos/15min en login, 30 uploads/min
- JWT con secret de 96 caracteres
- CORS restringido a orígenes autorizados
- Body limit en uploads
- Variables sensibles en `.env` (nunca commiteadas)
