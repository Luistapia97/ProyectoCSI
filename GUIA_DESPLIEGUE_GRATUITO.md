# 🚀 Guía de Despliegue GRATUITO - Proyecto Nexus

## Proyecto CSI - Sistema de Gestión de Proyectos y Tareas

Esta guía te ayudará a desplegar tu proyecto completamente **GRATIS** usando:
- **MongoDB Atlas** (Base de datos)
- **Render** (Backend - Node.js/Express)
- **Vercel** (Frontend - React/Vite)

---

## 📋 REQUISITOS PREVIOS

- [ ] Cuenta de GitHub (tu código debe estar en GitHub)
- [ ] Cuenta de Gmail (para registrarse en los servicios)
- [ ] 30-40 minutos de tiempo
- [ ] **NO se requiere tarjeta de crédito**

---

## PARTE 1: MONGODB ATLAS (Base de Datos) ☁️

### Paso 1: Crear cuenta en MongoDB Atlas

1. Ve a: https://www.mongodb.com/cloud/atlas/register
2. Regístrate con Google o email
3. Selecciona:
   - **Goal**: Learn MongoDB
   - **Languages**: JavaScript
   - **Deployment**: Atlas (Cloud)

### Paso 2: Crear cluster GRATUITO

1. Haz clic en **"Create"** (Crear deployment)
2. Selecciona **M0 FREE** (debe decir "FREE" en verde)
3. Configuración:
   - **Provider**: AWS (recomendado)
   - **Region**: Selecciona la más cercana a ti (ej: N. Virginia us-east-1)
   - **Cluster Name**: `Proyecto-Nexus` (o el que prefieras)
4. Haz clic en **"Create Deployment"**
5. **IMPORTANTE**: Guarda el usuario y contraseña que te da (aparecerá un modal)
   ```
   Usuario: admin
   Contraseña: (guárdala bien, la necesitarás)
   ```

### Paso 3: Configurar acceso a la base de datos

1. En el modal de seguridad, haz clic en **"Add My Current IP Address"**
2. Luego agrega acceso desde cualquier IP:
   - Ve a **Network Access** (menú izquierdo)
   - Haz clic en **"Add IP Address"**
   - Selecciona **"Allow Access from Anywhere"**
   - IP: `0.0.0.0/0`
   - Haz clic en **"Confirm"**

### Paso 4: Obtener la cadena de conexión

1. Ve a **Database** (menú izquierdo)
2. En tu cluster, haz clic en **"Connect"**
3. Selecciona **"Drivers"**
4. Copia la cadena de conexión (connection string):
   ```
   mongodb+srv://admin:<password>@proyecto-nexus.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. **REEMPLAZA** `<password>` con la contraseña que guardaste
6. Agrega el nombre de la base de datos antes del `?`:
   ```
   mongodb+srv://admin:TU_PASSWORD@proyecto-nexus.xxxxx.mongodb.net/proyecto-nexus?retryWrites=true&w=majority
   ```
7. **GUARDA ESTA CADENA** - la necesitarás para Render

---

## PARTE 2: RENDER (Backend - Node.js/Express) 🔧

### Paso 1: Preparar el código del backend

1. Verifica que tu `backend/package.json` tenga:
   ```json
   {
     "scripts": {
       "start": "node server.js",
       "dev": "nodemon -r dotenv/config server.js"
     },
     "engines": {
       "node": ">=18.0.0"
     }
   }
   ```

2. Crea un archivo `backend/.env.example` con las variables necesarias:
   ```env
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=tu-secreto-super-seguro-aqui
   PORT=5000
   FRONTEND_URL=https://tu-frontend.vercel.app
   ZOHO_CLIENT_ID=tu-client-id
   ZOHO_CLIENT_SECRET=tu-client-secret
   ZOHO_REDIRECT_URI=https://tu-backend.onrender.com/api/auth/zoho/callback
   ```

3. **Sube los cambios a GitHub:**
   ```bash
   git add .
   git commit -m "Preparar para despliegue en Render"
   git push origin main
   ```

### Paso 2: Crear cuenta en Render

1. Ve a: https://render.com/
2. Haz clic en **"Get Started for Free"**
3. Regístrate con **GitHub**
4. Autoriza a Render para acceder a tus repositorios

### Paso 3: Desplegar el backend

1. En el Dashboard de Render, haz clic en **"New +"** → **"Web Service"**

2. Conecta tu repositorio:
   - Busca: `ProyectoCSI`
   - Haz clic en **"Connect"**

3. Configura el servicio:
   ```
   Name: proyecto-nexus-backend
   Region: Oregon (US West) o la más cercana
   Branch: main
   Root Directory: backend
   Runtime: Node
   Build Command: npm install
   Start Command: node server.js
   ```

4. Selecciona el plan **FREE** (debe decir $0/month)

5. **Agrega las variables de entorno** (haz clic en "Advanced" → "Add Environment Variable"):
   
   Agrega TODAS estas variables:
   ```
   MONGODB_URI = mongodb+srv://admin:TU_PASSWORD@proyecto-nexus.xxxxx.mongodb.net/proyecto-nexus?retryWrites=true&w=majority
   
   JWT_SECRET = genera-una-clave-secreta-super-segura-aqui-min-32-caracteres
   
   PORT = 5000
   
   FRONTEND_URL = https://proyecto-csi.vercel.app
   
   ZOHO_CLIENT_ID = (tu client ID de Zoho - si lo tienes)
   
   ZOHO_CLIENT_SECRET = (tu client secret de Zoho - si lo tienes)
   
   ZOHO_REDIRECT_URI = https://proyecto-nexus-backend.onrender.com/api/auth/zoho/callback
   
   NODE_ENV = production
   ```

6. Haz clic en **"Create Web Service"**

7. **Espera 5-10 minutos** mientras Render construye y despliega tu backend

8. Una vez que veas **"Live"** en verde, copia la URL:
   ```
   https://proyecto-nexus-backend.onrender.com
   ```

9. **PRUEBA** que funcione:
   - Abre en tu navegador: `https://proyecto-nexus-backend.onrender.com/api/auth/admin-count`
   - Deberías ver: `{"success":true,"count":X,"max":3,"available":X}`

### ⚠️ IMPORTANTE sobre el plan gratuito de Render:

- El servidor se "duerme" después de 15 minutos de inactividad
- La primera petición después de dormir puede tardar 30-60 segundos
- Esto es **NORMAL** en el plan gratuito
- Las siguientes peticiones serán rápidas

---

## PARTE 3: VERCEL (Frontend - React/Vite) 🎨

### Paso 1: Preparar el código del frontend

1. Crea un archivo `frontend/.env.production`:
   ```env
   VITE_API_URL=https://proyecto-nexus-backend.onrender.com/api
   ```

2. Verifica que `frontend/vite.config.js` tenga:
   ```javascript
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'

   export default defineConfig({
     plugins: [react()],
     build: {
       outDir: 'dist',
       sourcemap: false
     }
   })
   ```

3. **Sube los cambios a GitHub:**
   ```bash
   git add .
   git commit -m "Configurar frontend para Vercel"
   git push origin main
   ```

### Paso 2: Crear cuenta en Vercel

1. Ve a: https://vercel.com/signup
2. Haz clic en **"Continue with GitHub"**
3. Autoriza a Vercel para acceder a tus repositorios

### Paso 3: Desplegar el frontend

1. En el Dashboard de Vercel, haz clic en **"Add New..."** → **"Project"**

2. Importa tu repositorio:
   - Busca: `ProyectoCSI`
   - Haz clic en **"Import"**

3. Configura el proyecto:
   ```
   Project Name: proyecto-csi
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   ```

4. **Agrega las variables de entorno:**
   - Haz clic en **"Environment Variables"**
   - Agrega:
     ```
     Name: VITE_API_URL
     Value: https://proyecto-nexus-backend.onrender.com/api
     ```

5. Haz clic en **"Deploy"**

6. **Espera 2-5 minutos** mientras Vercel construye y despliega tu frontend

7. Una vez que termine, verás:
   ```
   ✓ Production: https://proyecto-csi.vercel.app
   ```

8. **PRUEBA** tu aplicación:
   - Abre: `https://proyecto-csi.vercel.app`
   - Deberías ver la pantalla de login

---

## PARTE 4: ACTUALIZAR ZOHO OAUTH (Si usas Zoho) 🔐

### Paso 1: Actualizar Redirect URI en Zoho

1. Ve a: https://api-console.zoho.com/
2. Inicia sesión
3. Ve a tu aplicación OAuth
4. En **Redirect URIs**, agrega:
   ```
   https://proyecto-nexus-backend.onrender.com/api/auth/zoho/callback
   ```
5. Guarda los cambios

### Paso 2: Actualizar variables en Render

1. Ve a tu servicio en Render
2. Ve a **Environment** (menú izquierdo)
3. Actualiza:
   ```
   ZOHO_REDIRECT_URI = https://proyecto-nexus-backend.onrender.com/api/auth/zoho/callback
   
   FRONTEND_URL = https://proyecto-csi.vercel.app
   ```
4. El servicio se reiniciará automáticamente

---

## ✅ VERIFICACIÓN FINAL

### 1. Prueba el Backend:

Abre en tu navegador:
```
https://proyecto-nexus-backend.onrender.com/api/auth/admin-count
```

Deberías ver:
```json
{"success":true,"count":0,"max":3,"available":3}
```

### 2. Prueba el Frontend:

Abre:
```
https://proyecto-csi.vercel.app
```

Deberías ver la pantalla de login con:
- Logo de CSI
- Formulario de email/password
- Botón "Continuar con Zoho"

### 3. Prueba la conexión Frontend → Backend:

1. Abre las DevTools del navegador (F12)
2. Ve a la pestaña **Network**
3. Intenta hacer login
4. Deberías ver peticiones a: `https://proyecto-nexus-backend.onrender.com/api/auth/login`

### 4. Crea tu primer admin:

Ve a:
```
https://proyecto-csi.vercel.app/register-admin
```

Regístrate con:
- Nombre completo
- Email
- Contraseña (mínimo 6 caracteres)

---

## 🎉 ¡FELICIDADES! Tu proyecto está en producción

### URLs de tu aplicación:

📱 **Frontend**: https://proyecto-csi.vercel.app
🔧 **Backend**: https://proyecto-nexus-backend.onrender.com
💾 **Base de datos**: MongoDB Atlas (Cluster Proyecto-Nexus)

---

## 📊 MONITOREO Y MANTENIMIENTO

### Render (Backend):

- **Dashboard**: https://dashboard.render.com/
- **Logs**: En tu servicio → "Logs" (para ver errores)
- **Métricas**: En tu servicio → "Metrics"
- **Redeploy**: En tu servicio → "Manual Deploy" → "Deploy latest commit"

### Vercel (Frontend):

- **Dashboard**: https://vercel.com/dashboard
- **Deployments**: Ver historial de despliegues
- **Logs**: Ver errores de build y runtime
- **Domains**: Configurar dominio personalizado (opcional)

### MongoDB Atlas:

- **Dashboard**: https://cloud.mongodb.com/
- **Metrics**: Ver uso de almacenamiento y conexiones
- **Backup**: Configurar backups (plan de pago)
- **Users**: Agregar más usuarios si es necesario

---

## 🚨 SOLUCIÓN DE PROBLEMAS COMUNES

### Error: "Cannot connect to database"

**Solución:**
1. Ve a MongoDB Atlas → Network Access
2. Verifica que `0.0.0.0/0` esté en la lista
3. Verifica que la cadena de conexión en Render sea correcta
4. Asegúrate de que la contraseña no tenga caracteres especiales sin codificar

### Error: "Backend is sleeping" (primera carga lenta)

**Solución:**
- Esto es NORMAL en el plan gratuito de Render
- Espera 30-60 segundos en la primera carga
- Considera usar un servicio de "ping" para mantenerlo despierto:
  - https://uptimerobot.com/ (gratis)
  - Configura ping cada 14 minutos a tu backend

### Error: "CORS blocked"

**Solución:**
1. Verifica que `FRONTEND_URL` en Render sea: `https://proyecto-csi.vercel.app`
2. Verifica que NO tenga `/` al final
3. Redeploy el backend

### Error 404 en rutas del frontend

**Solución:**
1. Crea `frontend/vercel.json`:
   ```json
   {
     "rewrites": [
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```
2. Sube a GitHub y Vercel redesplegará automáticamente

---

## 🔄 ACTUALIZAR TU APLICACIÓN

### Cuando hagas cambios en el código:

1. **Haz commit y push a GitHub:**
   ```bash
   git add .
   git commit -m "Descripción de tus cambios"
   git push origin main
   ```

2. **Vercel** se actualizará automáticamente (2-3 minutos)

3. **Render** se actualizará automáticamente (5-10 minutos)

4. Verifica los logs de ambos servicios para asegurarte de que todo salió bien

---

## 💰 COSTOS Y LÍMITES DEL PLAN GRATUITO

### MongoDB Atlas (M0 Free):
- ✅ 512MB de almacenamiento
- ✅ Compartido
- ✅ Límite de conexiones: 500
- ⚠️ No incluye backups automáticos

### Render (Free):
- ✅ 750 horas/mes (suficiente para 1 servicio 24/7)
- ✅ 100GB ancho de banda/mes
- ⚠️ Se duerme después de 15 min de inactividad
- ⚠️ Límite de 512MB RAM

### Vercel (Hobby - Free):
- ✅ 100GB ancho de banda/mes
- ✅ Despliegues ilimitados
- ✅ 100 GB-Horas de compute time
- ✅ SSL automático
- ⚠️ 1 dominio personalizado

---

## 🎯 PRÓXIMOS PASOS OPCIONALES

### 1. Configurar dominio personalizado:

**En Vercel:**
1. Ve a tu proyecto → Settings → Domains
2. Agrega tu dominio (ej: `proyectoscsi.com`)
3. Configura los DNS según las instrucciones

### 2. Configurar notificaciones por email:

**Usar SendGrid o Resend (gratis):**
1. Crear cuenta en sendgrid.com o resend.com
2. Obtener API Key
3. Agregar variable de entorno en Render:
   ```
   SENDGRID_API_KEY=tu-api-key
   ```

### 3. Monitorear uptime del backend:

**Usar UptimeRobot (gratis):**
1. Crear cuenta en uptimerobot.com
2. Agregar monitor HTTP(s)
3. URL: `https://proyecto-nexus-backend.onrender.com/api/auth/admin-count`
4. Intervalo: 5 minutos
5. Recibir alertas por email si cae

---

## 📞 SOPORTE Y AYUDA

### Documentación oficial:

- **MongoDB Atlas**: https://docs.atlas.mongodb.com/
- **Render**: https://render.com/docs
- **Vercel**: https://vercel.com/docs

### Comunidades:

- **Stack Overflow**: https://stackoverflow.com/
- **Reddit r/webdev**: https://reddit.com/r/webdev
- **Discord de Render**: https://render.com/discord

---

## 📝 CHECKLIST DE DESPLIEGUE

- [ ] MongoDB Atlas creado y configurado
- [ ] Cadena de conexión guardada
- [ ] Backend desplegado en Render
- [ ] Variables de entorno configuradas en Render
- [ ] Backend funcionando (prueba con /api/auth/admin-count)
- [ ] Frontend desplegado en Vercel
- [ ] Variable VITE_API_URL configurada en Vercel
- [ ] Frontend carga correctamente
- [ ] Login funciona
- [ ] Registro de admin funciona
- [ ] Socket.IO funciona (notificaciones en tiempo real)
- [ ] Zoho OAuth configurado (si aplica)
- [ ] Dominio personalizado configurado (opcional)
- [ ] Monitoreo de uptime configurado (opcional)

---

## 🎊 ¡ÉXITO!

Tu **Sistema de Gestión de Proyectos CSI** está ahora en producción, accesible desde cualquier parte del mundo, completamente **GRATIS**.

**Creado por**: Luis Tapia
**Fecha de despliegue**: Diciembre 2025
**Stack**: MongoDB + Express + React + Node.js (MERN)
**Hosting**: MongoDB Atlas + Render + Vercel

---

**¿Necesitas ayuda?** Revisa la sección de "Solución de Problemas" o contacta al equipo de desarrollo.
