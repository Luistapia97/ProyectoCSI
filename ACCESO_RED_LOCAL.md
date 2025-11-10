# 🌐 Guía de Acceso desde Red Local

Esta guía te ayudará a acceder a Nexus desde otros dispositivos en tu red local (celular, tablet, otra computadora).

---

## 📋 Requisitos Previos

1. **Firewall de Windows**: Debes permitir conexiones en los puertos 5000 y 5173
2. **Misma red WiFi**: Todos los dispositivos deben estar en la misma red
3. **Backend y Frontend corriendo**: Ambos servidores deben estar activos

---

## 🚀 Cómo Acceder

### 1️⃣ **Iniciar los Servidores**

#### Backend:
```powershell
cd backend
npm run dev
```

Verás algo como:
```
🚀 Servidor corriendo en puerto 5000
📡 Socket.IO listo para conexiones en tiempo real
🌐 Acceso local: http://localhost:5000

📱 Acceso desde red local:
   http://172.21.240.1:5000
   http://192.168.56.1:5000
   http://192.168.1.85:5000    ← Esta es tu IP principal
```

#### Frontend:
```powershell
cd frontend
npm run dev
```

Verás algo como:
```
➜  Local:   http://localhost:5173/
➜  Network: http://172.21.240.1:5173/
➜  Network: http://192.168.56.1:5173/
➜  Network: http://192.168.1.85:5173/    ← Esta es tu IP principal
```

---

### 2️⃣ **Identificar tu IP Principal**

La IP que comienza con **192.168.1.** suele ser tu red WiFi principal.

En el ejemplo anterior: `192.168.1.85`

---

### 3️⃣ **Acceder desde Otros Dispositivos**

Desde tu **celular, tablet o otra computadora** en la misma red WiFi:

1. Abre el navegador web
2. Ingresa la URL del frontend: **`http://192.168.1.85:5173`**
   *(Reemplaza con tu IP real)*
3. ¡Deberías ver la pantalla de login de Nexus! 🎉

---

## 🔧 Configurar Firewall de Windows

Si no puedes acceder, es probable que el firewall esté bloqueando las conexiones:

### Opción 1: Permitir a través de Windows Defender

1. Abre **"Firewall de Windows Defender"**
2. Clic en **"Configuración avanzada"**
3. Selecciona **"Reglas de entrada"**
4. Clic en **"Nueva regla..."**
5. Selecciona **"Puerto"** → Siguiente
6. Selecciona **"TCP"** y escribe: `5000, 5173`
7. Selecciona **"Permitir la conexión"**
8. Aplica a todas las opciones (Dominio, Privado, Público)
9. Dale un nombre: **"Nexus - Servidor"**
10. Finalizar

### Opción 2: Comando PowerShell (Como Administrador)

```powershell
# Permitir puerto 5000 (Backend)
New-NetFirewallRule -DisplayName "Nexus Backend" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow

# Permitir puerto 5173 (Frontend)
New-NetFirewallRule -DisplayName "Nexus Frontend" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
```

---

## 📱 Probar en tu Celular

1. **Conecta tu celular a la misma WiFi** que tu computadora
2. Abre el **navegador** (Chrome, Safari, etc.)
3. Ingresa: `http://192.168.1.85:5173` *(tu IP)*
4. Inicia sesión con tu cuenta
5. ¡Listo! Ahora puedes usar Nexus desde tu celular 📱

---

## 🔍 Verificar tu IP

Si no estás seguro de tu IP, ejecuta en PowerShell:

```powershell
ipconfig
```

Busca la sección **"Adaptador de LAN inalámbrica Wi-Fi"** y encuentra:
```
Dirección IPv4. . . . . . . . . . : 192.168.1.85
```

---

## 🛑 Troubleshooting

### Problema: "No se puede conectar al servidor"

**Solución 1**: Verifica que ambos servidores estén corriendo
```powershell
# En una terminal
cd backend
npm run dev

# En otra terminal
cd frontend
npm run dev
```

**Solución 2**: Verifica tu firewall (ver sección de arriba)

**Solución 3**: Intenta con otra IP mostrada en la consola

---

### Problema: "Error de CORS" o "Network Error"

**Solución**: El backend ya está configurado para aceptar conexiones desde la red local, pero si sigues teniendo problemas, verifica que tu antivirus no esté bloqueando las conexiones.

---

### Problema: Funciona en localhost pero no en IP

**Solución**: Es un problema de firewall. Sigue los pasos de configuración del firewall arriba.

---

## 📊 URLs de Acceso Resumidas

| Dispositivo | Frontend | Backend |
|-------------|----------|---------|
| Misma PC | `http://localhost:5173` | `http://localhost:5000` |
| Red Local | `http://192.168.1.85:5173` | `http://192.168.1.85:5000` |

*Reemplaza `192.168.1.85` con tu IP real*

---

## ⚡ Comandos Rápidos

### Ver IPs disponibles:
```powershell
ipconfig | findstr "IPv4"
```

### Probar conexión al backend desde otro dispositivo:
Abre en el navegador: `http://192.168.1.85:5000/api/auth/admin-count`

Si ves un JSON, ¡el backend está accesible! ✅

---

## 🔒 Nota de Seguridad

Esta configuración es **SOLO para red local**. No expongas estos puertos a internet sin:
- Configurar HTTPS (SSL)
- Agregar autenticación adicional
- Configurar un firewall apropiado
- Usar un proxy inverso (nginx/Apache)

---

## 🎯 Resumen Rápido

1. ✅ Inicia backend: `cd backend && npm run dev`
2. ✅ Inicia frontend: `cd frontend && npm run dev`
3. ✅ Anota tu IP (ej: 192.168.1.85)
4. ✅ Configura firewall (permitir puertos 5000 y 5173)
5. ✅ Accede desde otro dispositivo: `http://TU-IP:5173`

**¡Listo! Ahora puedes usar Nexus desde cualquier dispositivo en tu red local! 🎉**
