# 🌹 La Comadre Lola — Backend API

API REST en Node.js/Express para gestionar eventos, reservas y el carrusel principal desde el panel de administración.

## 🚀 Instalación

```bash
cd backend
npm install
```

## ⚙️ Configuración

Copia el archivo de ejemplo y edita tus variables:

```bash
cp .env.example .env
```

Variables importantes:

| Variable | Descripción | Ejemplo |
|---|---|---|
| `PORT` | Puerto del servidor | `3001` |
| `ADMIN_USERNAME` | Usuario administrador | `admin` |
| `ADMIN_PASSWORD` | Contraseña admin (**¡Cámbiala!**) | `MiClave2026!` |
| `JWT_SECRET` | Secreto para JWT (**¡Cámbialo!**) | `una_cadena_aleatoria_larga` |
| `CORS_ORIGINS` | Orígenes permitidos | `https://tu-sitio.github.io` |

## ▶️ Ejecutar

```bash
# Producción
npm start

# Desarrollo (con hot reload, Node >= 18)
npm run dev
```

## 📡 Endpoints

### Público

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/health` | Estado del servidor |
| `GET` | `/api/events` | Listar eventos activos |
| `GET` | `/api/carousel` | Listar slides activos |
| `POST` | `/api/reservations` | Crear reserva (desde el formulario) |

### Admin (requiere `Authorization: Bearer <token>`)

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/admin/login` | Obtener token JWT |
| `GET` | `/api/events/all` | Todos los eventos (incluye inactivos) |
| `POST` | `/api/events` | Crear evento |
| `PUT` | `/api/events/:id` | Editar evento |
| `DELETE` | `/api/events/:id` | Eliminar evento |
| `GET` | `/api/reservations` | Listar todas las reservas |
| `PUT` | `/api/reservations/:id` | Actualizar estado de reserva |
| `DELETE` | `/api/reservations/:id` | Eliminar reserva |
| `GET` | `/api/carousel/all` | Todos los slides |
| `POST` | `/api/carousel` | Crear slide |
| `PUT` | `/api/carousel/:id` | Editar slide |
| `DELETE` | `/api/carousel/:id` | Eliminar slide |

## 🗂 Almacenamiento

Los datos se guardan en archivos JSON en `data/`:

- `data/events.json` — Eventos
- `data/reservations.json` — Reservas
- `data/carousel.json` — Slides del carrusel

## 🌐 Despliegue recomendado

- **Railway**: `railway up`
- **Render**: Conecta el repositorio, directorio raíz `backend/`
- **Fly.io**: `fly deploy`

Asegúrate de configurar las variables de entorno en la plataforma elegida.

## 🔗 Conectar el frontend

En `js/api.js` del sitio, actualiza `API_BASE_URL` con la URL de tu backend desplegado:

```js
const API_BASE_URL = 'https://tu-backend.railway.app';
```
