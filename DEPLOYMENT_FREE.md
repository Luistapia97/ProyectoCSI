# Despliegue GRATIS en Render.com + Vercel

Este proyecto está configurado para desplegarse **completamente GRATIS** usando:
- **Render.com** para el backend (Node.js + Socket.IO + Cron Jobs)
- **Vercel** para el frontend (React + Vite)
- **MongoDB Atlas** para la base de datos (M0 cluster gratuito)

---

## 🚀 Paso 1: Desplegar Backend en Render.com

### 1.1 Crear cuenta en Render
1. Ve a **https://render.com**
2. Click en **"Get Started for Free"**
3. Conecta con tu cuenta de **GitHub**

### 1.2 Crear nuevo servicio
1. En el dashboard, click **"New +"** → **"Web Service"**
2. Conecta tu repositorio: **Luistapia97/ProyectoCSI**
3. Render detectará automáticamente que es un proyecto Node.js

### 1.3 Configurar el servicio

**Configuración básica:**
```
Name: nexus-backend
Region: Oregon (US West) - la más cercana gratis
Branch: main
Root Directory: backend
Runtime: Node
Build Command: npm install
Start Command: node server.js
```

**Plan:**
- Selecciona: **Free** ✅

### 1.4 Variables de Entorno

Click en **"Advanced"** → **"Add Environment Variable"** y agrega:

```bash
# MongoDB Atlas
MONGO_URI=mongodb+srv://proyectoscsi:Proyectos%23CSI%402024@cluster0.bvkzv.mongodb.net/nexus-tasks?retryWrites=true&w=majority&appName=Cluster0

# Seguridad (genera claves seguras)
JWT_SECRET=TU_CLAVE_SUPER_SEGURA_JWT_2025
SESSION_SECRET=TU_CLAVE_SUPER_SEGURA_SESSION_2025

# Zoho OAuth
ZOHO_CLIENT_ID=tu_client_id_de_zoho
ZOHO_CLIENT_SECRET=tu_client_secret_de_zoho
ZOHO_REDIRECT_URI=https://nexus-backend.onrender.com/api/auth/zoho/callback

# Configuración
ADMIN_REGISTRATION_CODE=NEXUS2025
FRONTEND_URL=https://tu-frontend.vercel.app
NODE_ENV=production
```

### 1.5 Crear el servicio
1. Click en **"Create Web Service"**
2. Render comenzará a construir y desplegar automáticamente
3. Espera 3-5 minutos (primera vez tarda más)
4. Tu backend estará en: `https://nexus-backend.onrender.com`

---

## 🎨 Paso 2: Desplegar Frontend en Vercel

### 2.1 Crear cuenta en Vercel
1. Ve a **https://vercel.com**
2. Click en **"Sign Up"**
3. Conecta con tu cuenta de **GitHub**

### 2.2 Importar proyecto
1. Click en **"Add New..."** → **"Project"**
2. Selecciona el repositorio: **Luistapia97/ProyectoCSI**
3. Click en **"Import"**

### 2.3 Configurar el proyecto

**Framework Preset:** Vite
**Root Directory:** `frontend`
**Build Command:** `npm run build`
**Output Directory:** `dist`

### 2.4 Variables de Entorno

Agrega esta variable de entorno:

```bash
VITE_API_URL=https://nexus-backend.onrender.com/api
```

### 2.5 Deploy
1. Click en **"Deploy"**
2. Espera 1-2 minutos
3. Tu frontend estará en: `https://proyecto-nexus.vercel.app`

### 2.6 Actualizar FRONTEND_URL en Render

1. Vuelve a **Render.com**
2. Ve a tu servicio **nexus-backend**
3. En **Environment**, actualiza:
   ```
   FRONTEND_URL=https://proyecto-nexus.vercel.app
   ```
4. Guarda (se redesplegará automáticamente)

---

## 🔐 Paso 3: Configurar MongoDB Atlas

### 3.1 Permitir acceso desde Render
1. Ve a **MongoDB Atlas** → **Network Access**
2. Click **"Add IP Address"**
3. Selecciona **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Click **"Confirm"**

> ⚠️ **Importante:** Render usa IPs dinámicas, por eso necesitas permitir acceso desde cualquier IP.

---

## 🔑 Paso 4: Actualizar Zoho OAuth

### 4.1 Actualizar Redirect URIs
1. Ve a **Zoho Developer Console**: https://api-console.zoho.com/
2. Selecciona tu aplicación OAuth
3. En **Redirect URIs**, agrega:
   ```
   https://nexus-backend.onrender.com/api/auth/zoho/callback
   ```
4. Guarda los cambios

### 4.2 Actualizar variable en Render
1. En Render, actualiza `ZOHO_REDIRECT_URI`:
   ```
   ZOHO_REDIRECT_URI=https://nexus-backend.onrender.com/api/auth/zoho/callback
   ```

---

## ✅ Paso 5: Verificar el Despliegue

### 5.1 Backend Health Check
Abre en el navegador:
```
https://nexus-backend.onrender.com/api/health
```

Deberías ver algo como:
```json
{
  "status": "ok",
  "timestamp": "2025-11-10T..."
}
```

### 5.2 Ver Logs en Render
1. En Render, ve a tu servicio **nexus-backend**
2. Click en **"Logs"**
3. Busca:
   ```
   ✓ MongoDB Conectado
   🚀 Servidor corriendo en puerto 10000
   ✅ Recordatorios programados
   ```

### 5.3 Probar Frontend
1. Abre tu frontend: `https://proyecto-nexus.vercel.app`
2. Haz login con Zoho
3. Crea una tarea
4. Verifica que aparezcan notificaciones
5. Abre la consola del navegador y busca:
   ```
   🔌 Socket conectado
   ```

---

## 🐛 Troubleshooting Común

### ❌ Backend tarda mucho en responder (primera vez)
**Causa:** El servicio gratuito de Render "duerme" después de 15 min de inactividad.
**Solución:** Espera 30 segundos en el primer acceso. Después será rápido.

### ❌ Error de conexión a MongoDB
**Causa:** MongoDB Atlas no permite las IPs de Render.
**Solución:** 
1. MongoDB Atlas → Network Access
2. Add IP Address → Allow from Anywhere (0.0.0.0/0)

### ❌ CORS Error
**Causa:** FRONTEND_URL no está configurada correctamente.
**Solución:**
1. Verifica que `FRONTEND_URL` en Render sea exactamente tu URL de Vercel
2. NO incluyas `/` al final
3. Ejemplo: `https://proyecto-nexus.vercel.app` ✅
4. Ejemplo: `https://proyecto-nexus.vercel.app/` ❌

### ❌ Zoho OAuth no funciona
**Causa:** Redirect URI no está configurada en Zoho.
**Solución:**
1. Zoho Console → Redirect URIs
2. Agrega: `https://nexus-backend.onrender.com/api/auth/zoho/callback`
3. Actualiza `ZOHO_REDIRECT_URI` en Render

### ❌ Recordatorios no funcionan
**Causa:** Render Free "duerme" el servicio y los cron jobs se pausan.
**Solución Alternativa:**
1. Usa **UptimeRobot** (gratis): https://uptimerobot.com/
2. Configura un monitor HTTP que haga ping cada 5 minutos a:
   ```
   https://nexus-backend.onrender.com/api/health
   ```
3. Esto mantiene el servicio "despierto" y los cron jobs funcionando

---

## 🔄 Deploy Automático

**¿Cómo actualizar el código?**

Es muy simple:
```bash
git add .
git commit -m "Actualización de funcionalidades"
git push origin main
```

**Render y Vercel** detectarán el cambio y redesplegarán automáticamente en 2-3 minutos.

---

## 💰 Costos

| Servicio | Costo | Límites |
|----------|-------|---------|
| Render Free | **$0/mes** | 750 horas/mes, duerme después de 15 min inactividad |
| Vercel Hobby | **$0/mes** | 100 GB bandwidth, builds ilimitados |
| MongoDB Atlas M0 | **$0/mes** | 512 MB storage permanente |
| Zoho OAuth | **$0/mes** | Usuarios ilimitados |
| **TOTAL** | **$0/mes** | ✅ **Completamente GRATIS** |

---

## 🚀 Mantener el Backend Activo 24/7 (Opcional)

Si quieres que tu backend nunca "duerma":

### Opción 1: UptimeRobot (Gratis)
1. Crea cuenta en https://uptimerobot.com/
2. Agrega un monitor HTTP
3. URL: `https://nexus-backend.onrender.com/api/health`
4. Intervalo: 5 minutos
5. ✅ Tu backend recibirá un ping cada 5 min y nunca dormirá

### Opción 2: Cron-job.org (Gratis)
1. Crea cuenta en https://cron-job.org/
2. Crea un cron job
3. URL: `https://nexus-backend.onrender.com/api/health`
4. Intervalo: */5 * * * * (cada 5 minutos)

---

## 📊 Monitoreo

### Render Logs
- Dashboard → nexus-backend → Logs
- Logs en tiempo real de tu backend
- Errores, advertencias, info

### Vercel Analytics (Gratis)
- Dashboard → Analytics
- Visitas, performance, errores del frontend

### MongoDB Atlas Metrics
- Dashboard → Metrics
- Conexiones, operaciones, storage usado

---

## 🎯 Resumen de URLs

Una vez desplegado, tendrás:

```
Backend API:  https://nexus-backend.onrender.com
Frontend:     https://proyecto-nexus.vercel.app
Database:     MongoDB Atlas (cluster0.bvkzv.mongodb.net)
Health Check: https://nexus-backend.onrender.com/api/health
```

---

## 🔒 Seguridad

### Genera claves seguras para JWT_SECRET y SESSION_SECRET:

Ejecuta en PowerShell:
```powershell
# JWT_SECRET
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})

# SESSION_SECRET
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

Usa las claves generadas en las variables de entorno de Render.

---

## ✅ Checklist de Despliegue

- [ ] Cuenta creada en Render.com
- [ ] Backend desplegado en Render
- [ ] Variables de entorno configuradas en Render
- [ ] MongoDB Atlas permite acceso desde 0.0.0.0/0
- [ ] Cuenta creada en Vercel
- [ ] Frontend desplegado en Vercel
- [ ] VITE_API_URL configurada en Vercel
- [ ] FRONTEND_URL actualizada en Render
- [ ] Zoho Redirect URI actualizada
- [ ] Health check funcionando: https://nexus-backend.onrender.com/api/health
- [ ] Frontend accesible: https://proyecto-nexus.vercel.app
- [ ] Login con Zoho funciona
- [ ] Notificaciones en tiempo real funcionan
- [ ] Socket.IO conectado (ver consola)
- [ ] UptimeRobot configurado (opcional)

---

## 🆘 Soporte

Si necesitas ayuda:
1. Revisa los **Logs en Render** (Logs tab)
2. Revisa **Vercel Deployments** (últimos deploys)
3. Verifica **MongoDB Network Access** (0.0.0.0/0)
4. Revisa **Zoho Redirect URIs** (debe incluir Render URL)

---

¡Tu aplicación estará funcionando 100% GRATIS! 🎉
