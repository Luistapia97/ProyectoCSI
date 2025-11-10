# 🔧 Guía Paso a Paso: Crear Cliente OAuth en Zoho

## ⚠️ IMPORTANTE: El Client ID actual no es válido

El error "Cliente no válido" indica que necesitas crear un nuevo cliente en Zoho API Console.

---

## 📋 Pasos para Crear un Cliente OAuth en Zoho

### Paso 1: Acceder a Zoho API Console

1. Abre tu navegador y ve a: **https://api-console.zoho.com/**
2. Inicia sesión con tu cuenta de Zoho

### Paso 2: Crear un Nuevo Cliente

1. Click en el botón **"Add Client"** (esquina superior derecha)

2. Selecciona el tipo de cliente:
   - ✅ **"Server-based Applications"** (Recomendado para producción)
   - ✅ **"Self Client"** (Más fácil para desarrollo/testing)

### Paso 3: Configurar el Cliente

#### Si elegiste "Server-based Applications":

**Client Name:**
```
Nexus Project Manager
```

**Homepage URL:**
```
http://localhost:5173
```

**Authorized Redirect URIs:**
```
http://localhost:5000/api/auth/zoho/callback
```

#### Si elegiste "Self Client":

Solo necesitas un nombre:
```
Nexus OAuth Client
```

### Paso 4: Copiar las Credenciales

Después de crear el cliente, Zoho te mostrará:

- **Client ID:** (algo como `1000.XXXXXXXXXXXXXXXXX`)
- **Client Secret:** (algo como `xxxxxxxxxxxxxxxxxxxx`)

**⚠️ IMPORTANTE:** Guarda estas credenciales en un lugar seguro.

### Paso 5: Configurar Scopes (Solo para Server-based)

Si usaste "Server-based Applications":

1. Ve a la sección **"Scopes"**
2. Busca y selecciona:
   - ✅ `ZohoAssist.userapi.READ`
   - ✅ `ZohoCalendar.calendar.ALL`
   - ✅ `ZohoCalendar.event.ALL`

**Nota:** Para "Self Client", todos los scopes están disponibles automáticamente.

---

## 🔑 Actualizar las Credenciales en tu Proyecto

### Opción 1: Editar el archivo .env (Recomendado)

1. Abre el archivo: `c:\Users\luiso\OneDrive\Desktop\Proyecto_Nexus\backend\.env`

2. Reemplaza las líneas:
```env
ZOHO_CLIENT_ID=1000.PV5VLITLAS39ZUV6L26PDH87BFTQQK
ZOHO_CLIENT_SECRET=d3b5b398b36b34f61700a407c36bc020d4b49b8361
```

Por tus nuevas credenciales:
```env
ZOHO_CLIENT_ID=TU_NUEVO_CLIENT_ID
ZOHO_CLIENT_SECRET=TU_NUEVO_CLIENT_SECRET
```

3. Guarda el archivo

### Opción 2: Usar PowerShell (Rápido)

Ejecuta estos comandos reemplazando los valores:

```powershell
cd "c:\Users\luiso\OneDrive\Desktop\Proyecto_Nexus\backend"

# Reemplazar Client ID
(Get-Content .env) -replace 'ZOHO_CLIENT_ID=.*', 'ZOHO_CLIENT_ID=TU_NUEVO_CLIENT_ID' | Set-Content .env

# Reemplazar Client Secret
(Get-Content .env) -replace 'ZOHO_CLIENT_SECRET=.*', 'ZOHO_CLIENT_SECRET=TU_NUEVO_CLIENT_SECRET' | Set-Content .env
```

---

## 🔄 Reiniciar el Servidor

Después de actualizar las credenciales:

```powershell
# Detener Node.js
taskkill /F /IM node.exe

# Iniciar backend
cd c:\Users\luiso\OneDrive\Desktop\Proyecto_Nexus\backend
node server.js
```

Deberías ver en la consola:
```
🔑 Configurando Zoho OAuth
✅ Zoho OAuth Configurado
```

---

## ✅ Verificar que Funciona

1. Ve a: http://localhost:5173/login
2. Click en "Continuar con Zoho"
3. Ahora deberías ver la pantalla de autorización de Zoho (sin error de cliente)

---

## 🎯 Resumen Rápido

### Para "Self Client" (Más Fácil):
```
1. https://api-console.zoho.com/
2. Add Client → Self Client
3. Name: "Nexus OAuth Client"
4. Copiar Client ID y Client Secret
5. Pegar en backend/.env
6. Reiniciar servidor
```

### Para "Server-based" (Producción):
```
1. https://api-console.zoho.com/
2. Add Client → Server-based Applications
3. Name: "Nexus Project Manager"
4. Homepage: http://localhost:5173
5. Redirect URI: http://localhost:5000/api/auth/zoho/callback
6. Agregar scopes: ZohoAssist.userapi.READ, ZohoCalendar.calendar.ALL
7. Copiar Client ID y Client Secret
8. Pegar en backend/.env
9. Reiniciar servidor
```

---

## 🐛 Si Sigues Teniendo Problemas

### Verifica que:
- ✅ El Client ID comienza con "1000."
- ✅ El Client Secret no tiene espacios
- ✅ El archivo .env se guardó correctamente
- ✅ Reiniciaste el servidor después de cambiar las credenciales
- ✅ El cliente está "Active" en Zoho API Console

### Logs a Verificar:
En la consola del backend deberías ver:
```
🔑 Configurando Zoho OAuth
   Client ID: 1000.XXXXXX (tu nuevo ID)
   Redirect URI: http://localhost:5000/api/auth/zoho/callback
✅ Zoho OAuth Configurado
```

---

## 📞 Siguiente Paso

Después de crear el cliente y actualizar las credenciales, **avísame** y te ayudo a probar el login nuevamente.

**Dame el nuevo Client ID** (solo los primeros 20 caracteres por seguridad) y verifico que esté configurado correctamente.
