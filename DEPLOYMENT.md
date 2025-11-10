# 🚀 Deployment Guide - Railway

Este proyecto está listo para desplegarse en Railway.app

## 📋 Pre-requisitos

1. Cuenta en Railway.app (gratis)
2. Cuenta en MongoDB Atlas
3. Cuenta en Zoho Developer Console (OAuth)
4. Repositorio en GitHub

## 🔧 Variables de Entorno Requeridas

### Backend (Node.js Service)

```env
# MongoDB
MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/nexus-tasks?retryWrites=true&w=majority

# JWT
JWT_SECRET=tu_clave_secreta_jwt_muy_segura_cambiala

# Session
SESSION_SECRET=tu_clave_secreta_session_muy_segura_cambiala

# Zoho OAuth
ZOHO_CLIENT_ID=1000.XXXXXXXXXXXXXXXXXXXXXXXXXX
ZOHO_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ZOHO_REDIRECT_URI=https://tu-backend.railway.app/api/auth/zoho/callback

# Admin
ADMIN_REGISTRATION_CODE=NEXUS2025

# Frontend URL (Railway frontend or Vercel)
FRONTEND_URL=https://tu-frontend.railway.app

# Puerto (Railway lo asigna automáticamente)
PORT=5000
```

### Frontend (Static Site / Vite)

```env
# Backend API URL
VITE_API_URL=https://tu-backend.railway.app/api
```

## 📦 Deployment Steps - Railway

### Opción 1: Backend + Frontend en Railway

#### 1️⃣ Deploy Backend

1. Ve a [Railway.app](https://railway.app)
2. Click en "Start a New Project"
3. Selecciona "Deploy from GitHub repo"
4. Elige este repositorio
5. Railway detectará automáticamente que es un proyecto Node.js
6. Configura las variables de entorno del backend (ver arriba)
7. Railway asignará una URL: `https://tu-proyecto.railway.app`
8. **Importante**: Actualiza `ZOHO_REDIRECT_URI` con esta URL + `/api/auth/zoho/callback`
9. En Zoho Developer Console, actualiza las Redirect URIs

#### 2️⃣ Deploy Frontend

1. En Railway, click en "New Service"
2. Selecciona "Deploy from GitHub repo"
3. Elige el mismo repositorio
4. Railway detectará el proyecto Vite
5. Configura Root Directory: `frontend`
6. Variables de entorno:
   ```
   VITE_API_URL=https://tu-backend-url.railway.app/api
   ```
7. Build Command: `npm run build`
8. Start Command: `npm run preview`

### Opción 2: Backend en Railway + Frontend en Vercel (Recomendado)

#### Backend en Railway
- Sigue los pasos 1️⃣ de arriba

#### Frontend en Vercel

1. Ve a [Vercel.com](https://vercel.com)
2. Import Git Repository
3. Elige este repo
4. Root Directory: `frontend`
5. Framework Preset: Vite
6. Environment Variables:
   ```
   VITE_API_URL=https://tu-backend.railway.app/api
   ```
7. Deploy!

## 🔍 Verificación Post-Deploy

1. **Backend Health Check**:
   ```bash
   curl https://tu-backend.railway.app/api/health
   ```

2. **MongoDB Connection**:
   - Revisa los logs de Railway
   - Busca: `✓ MongoDB Conectado`

3. **Zoho OAuth**:
   - Ve a: `https://tu-frontend-url/login`
   - Click en "Continuar con Zoho"
   - Debe redirigir correctamente

4. **Socket.IO**:
   - Crea una tarea
   - Las notificaciones deben aparecer en tiempo real

## 🐛 Troubleshooting

### Error: "Cannot connect to MongoDB"
- Verifica que la IP de Railway esté permitida en MongoDB Atlas
- MongoDB Atlas → Network Access → Add IP Address → "Allow Access from Anywhere"

### Error: "CORS blocked"
- Verifica que `FRONTEND_URL` en backend sea correcta
- Railway auto-configura CORS para IPs locales

### Error: "Zoho OAuth failed"
- Verifica `ZOHO_REDIRECT_URI` en backend
- Verifica Redirect URIs en Zoho Developer Console
- Deben coincidir exactamente

### Recordatorios no funcionan
- Railway soporta cron jobs automáticamente
- Verifica en logs: `✅ Recordatorios programados`

## 📊 Monitoreo

Railway proporciona:
- 📈 Métricas en tiempo real
- 📝 Logs en vivo
- 🔄 Auto-deploy en cada push a main
- 💾 Backups automáticos

## 💰 Costos Estimados

- **Railway Free Tier**: $5 crédito/mes gratis
- **Después**: ~$5-10/mes (backend + frontend)
- **MongoDB Atlas**: Gratis (tier compartido)
- **Vercel**: Gratis (hobby tier)

**Total**: Gratis por 1 mes, luego ~$5-10/mes

## 🔐 Seguridad

1. **Nunca** commitees archivos `.env`
2. Usa secretos fuertes para JWT y SESSION
3. Actualiza las Redirect URIs de Zoho para producción
4. Habilita HTTPS (Railway lo hace automático)

## 📚 Documentación Adicional

- [Railway Docs](https://docs.railway.app/)
- [Vercel Docs](https://vercel.com/docs)
- [MongoDB Atlas](https://docs.atlas.mongodb.com/)

---

## 🎉 ¡Listo!

Tu aplicación debería estar funcionando en:
- Backend: `https://tu-backend.railway.app`
- Frontend: `https://tu-frontend.railway.app` o `https://tu-app.vercel.app`

**Próximos pasos:**
1. Configura un dominio personalizado (opcional)
2. Configura GitHub Actions para CI/CD (opcional)
3. Monitorea los logs regularmente
