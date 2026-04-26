# 🌹 La Comadre Lola — Sitio Web Oficial

**Restaurant · Bar · Eventos** — Quilicura, Santiago de Chile

## 🗂 Estructura del Proyecto

```
lacomadrelolaCL/
├── index.html          — HTML semántico
├── admin.html          — Panel de administración (reservas + newsletter)
├── css/
│   ├── styles.css      — Estilos principales
│   └── animations.css  — Keyframes y animaciones
├── js/
│   ├── script.js       — Interactividad principal
│   ├── api.js          — Integración con el backend API
│   ├── carousel.js     — Carruseles funcionales
│   ├── animations.js   — Scroll animations, partículas
│   └── utils.js        — Helpers y utilidades
├── backend/
│   ├── server.js       — Servidor Express (puerto 3001)
│   ├── package.json    — Dependencias Node.js
│   ├── .env.example    — Variables de entorno (plantilla)
│   ├── config/
│   │   ├── database.js — Conexión MongoDB
│   │   └── mailer.js   — Emails con Nodemailer
│   ├── models/
│   │   ├── Reservation.js — Schema de reservas
│   │   └── Newsletter.js  — Schema newsletter
│   ├── routes/
│   │   ├── reservations.js — POST/GET/PATCH reservas
│   │   └── newsletter.js   — POST/GET newsletter
│   ├── controllers/
│   │   ├── reservationController.js
│   │   └── newsletterController.js
│   └── middleware/
│       ├── auth.js         — Autenticación básica (admin)
│       ├── validate.js     — Manejo de errores de validación
│       └── errorHandler.js — Error handler global
├── .gitignore
└── README.md
```

## 🎨 Diseño

- **Primary:** `#E8913A` (naranja)
- **Secondary:** `#D4547B` (rosado)
- **Accent:** `#4ECDC4` (turquesa)
- **Background:** `#0d0d12` (negro premium)
- **Tipografía:** Righteous (títulos) + Inter (body)

## ✨ Funcionalidades

- Hero section full-screen con parallax
- Cartelera de eventos con 6 cards
- Galería de artistas destacados
- Timeline horizontal de eventos
- Paquetes VIP (Gold / Platinum / Diamond)
- Galería de fotos con lightbox y filtros por categoría
- Carrusel de testimonios (5 reseñas) con autoplay
- **Formulario de reservas conectado al backend** (MongoDB + email de confirmación)
- **Newsletter conectado al backend** (MongoDB + email de bienvenida)
- **Panel Admin** para ver y gestionar reservas y suscriptores
- Horarios en vivo (abierto/cerrado en tiempo real)
- Countdown cuando está abierto
- Transporte interactivo con 4 tabs
- Mapa de Google Maps embebido
- Scroll animations (Intersection Observer)
- Lazy loading de imágenes
- Mobile-first responsive
- Dark mode premium

## 🚀 Configuración del Backend

### 1. Requisitos

- Node.js ≥ 18
- Cuenta en [MongoDB Atlas](https://www.mongodb.com/atlas) (gratuita)
- Cuenta Gmail con [App Password](https://myaccount.google.com/apppasswords) habilitada

### 2. Instalar dependencias

```bash
cd backend
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus valores reales:

```env
PORT=3001
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/lacomadrelola
EMAIL_USER=tucorreo@gmail.com
EMAIL_PASS=tu_app_password_de_gmail
ADMIN_EMAIL=admin@lacomadrelola.cl
FRONTEND_URL=https://alexispferrada-wq.github.io
ADMIN_USER=admin
ADMIN_PASS=una_contrasena_segura
```

### 4. Ejecutar en desarrollo

```bash
cd backend
npm run dev   # con nodemon (auto-reload)
# o
npm start     # producción
```

El servidor arrancará en `http://localhost:3001`.

## 📡 API Endpoints

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `POST` | `/api/reservations` | Crear reserva | No |
| `GET`  | `/api/reservations` | Listar reservas | Basic Auth |
| `PATCH`| `/api/reservations/:id/estado` | Actualizar estado | Basic Auth |
| `POST` | `/api/newsletter` | Suscribirse | No |
| `GET`  | `/api/newsletter` | Listar suscriptores | Basic Auth |
| `GET`  | `/health` | Health check | No |

### Ejemplo POST /api/reservations

```json
{
  "nombre": "María González",
  "email": "maria@example.com",
  "telefono": "912345678",
  "personas": 4,
  "tipo": "mesa-vip",
  "fecha": "2025-08-15",
  "mensaje": "Celebración de cumpleaños"
}
```

## 🌐 Deployment (Render.com)

1. Crea una cuenta en [Render.com](https://render.com)
2. Conecta tu repositorio de GitHub
3. Crea un nuevo **Web Service** apuntando a la carpeta `backend/`
4. Configura las variables de entorno en el dashboard de Render
5. Actualiza `PROD_API_URL` en `js/api.js` con la URL de Render

## 🔐 Panel de Administración

Accede a `admin.html` en el browser, ingresa la URL del servidor y las credenciales configuradas en `.env` (`ADMIN_USER` / `ADMIN_PASS`).

Desde el panel puedes:
- Ver todas las reservas con filtros por estado y fecha
- Confirmar o cancelar reservas
- Ver estadísticas (pendientes / confirmadas / canceladas)
- Ver lista de suscriptores al newsletter

## 📍 Datos

- **Dirección:** Manuel Antonio Matta 1269, Quilicura
- **Metro:** Línea 3 — Estación Lo Cruzat
- **Horarios:** Mié 17–00 · Jue 17–01 · Vie-Sáb 13–02 · Dom 13–19

## 🌐 Demo

[Ver sitio en vivo](https://alexispferrada-wq.github.io/lacomadrelolaCL/)
