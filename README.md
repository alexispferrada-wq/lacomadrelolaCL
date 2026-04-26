# 🌹 La Comadre Lola — Sitio Web Oficial

**Restaurant · Bar · Eventos** — Quilicura, Santiago de Chile

## 🗂 Estructura del Proyecto

```
lacomadrelolaCL/
├── index.html          — HTML semántico
├── admin.html          — Panel de administración
├── css/
│   ├── styles.css      — Estilos principales
│   └── animations.css  — Keyframes y animaciones
├── js/
│   ├── script.js       — Interactividad principal
│   ├── api.js          — Cliente API (backend)
│   ├── cursor.js       — Cursor magnético personalizado
│   ├── carousel.js     — Carruseles funcionales
│   ├── animations.js   — Scroll animations, partículas
│   └── utils.js        — Helpers y utilidades
├── backend/            — API Node.js/Express
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   ├── README.md
│   └── data/
│       ├── events.json
│       ├── reservations.json
│       └── carousel.json
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

- Hero section full-screen con parallax + **carrusel de slides** (gestionado desde el admin)
- Cartelera de eventos **cargada dinámicamente desde el backend** (con fallback estático)
- Galería de artistas destacados
- Timeline horizontal de eventos
- Paquetes VIP (Gold / Platinum / Diamond)
- Galería de fotos con lightbox y filtros por categoría
- Carrusel de testimonios (5 reseñas) con autoplay
- **Formulario de reservas** que guarda en el backend
- Newsletter con validación de email
- Horarios en vivo (abierto/cerrado en tiempo real)
- Countdown cuando está abierto
- Transporte interactivo con 4 tabs
- Mapa de Google Maps embebido
- **Cursor magnético neon personalizado**
- Scroll animations (Intersection Observer)
- Lazy loading de imágenes
- Mobile-first responsive
- Dark mode premium

## 🔧 Backend

Ver [`backend/README.md`](./backend/README.md) para instrucciones de instalación y despliegue.

```bash
cd backend
cp .env.example .env   # edita credenciales
npm install
npm start              # http://localhost:3001
```

## 🛠 Panel de Administración

Abre `admin.html` en el navegador. Funciones:

- 📊 **Dashboard** — estadísticas en tiempo real
- 🎤 **Eventos** — crear, editar y eliminar eventos de la cartelera
- 📅 **Reservas** — ver y gestionar todas las solicitudes recibidas
- 🖼 **Carrusel** — gestionar los slides del hero principal

## 🔗 Conectar frontend con backend

En `js/api.js`, actualiza la constante `API_BASE_URL`:

```js
export const API_BASE_URL = 'https://tu-backend.railway.app';
```

## 📍 Datos

- **Dirección:** Manuel Antonio Matta 1269, Quilicura
- **Metro:** Línea 3 — Estación Lo Cruzat
- **Horarios:** Mié 17–00 · Jue 17–01 · Vie-Sáb 13–02 · Dom 13–19

## 🌐 Demo

[Ver sitio en vivo](https://alexispferrada-wq.github.io/lacomadrelolaCL/)
