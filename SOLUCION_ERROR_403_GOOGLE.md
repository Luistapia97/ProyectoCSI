# 🔐 Solución Error 403: access_denied  Google OAuth

## El Problema
Tu aplicación está en modo de **prueba** en Google Cloud Console, lo que significa que solo los usuarios específicamente autorizados pueden iniciar sesión.

## ✅ Solución Rápida  Agregar Usuarios de Prueba

### Opción 1: Agregar tu correo como usuario de prueba (Recomendado para desarrollo)

1. **Ve a Google Cloud Console**: https://console.cloud.google.com/

2. **Selecciona tu proyecto** (Nexusgestortareas o el que hayas creado)

3. **Ve a "APIs & Services" → "OAuth consent screen"**
    En el menú lateral izquierdo: **APIs y servicios** → **Pantalla de consentimiento de OAuth**

4. **En la sección "Test users"** (Usuarios de prueba):
    Haz clic en **"+ ADD USERS"** (Agregar usuarios)
    Ingresa tu correo electrónico (y el de cualquier otra persona que quiera probar)
    Haz clic en **"Save"** (Guardar)

5. **Espera 23 minutos** para que los cambios se propaguen

6. **Intenta iniciar sesión nuevamente** en tu aplicación



### Opción 2: Publicar la aplicación (Para producción)

Si quieres que **cualquier persona** pueda usar tu aplicación:

1. **Ve a "OAuth consent screen"**

2. **Cambia el "Publishing status"** de "Testing" a "In production"

3. **IMPORTANTE**: Para publicar necesitarás:
    ⚠️ **Verificación de Google** (puede tomar varios días)
    Completar toda la información de la aplicación
    Política de privacidad
    Términos de servicio
    Logo de la aplicación

**Para desarrollo, usa la Opción 1** (Agregar usuarios de prueba)



## 📋 Pasos Detallados (Opción 1)

### 1. Accede a Google Cloud Console
```
https://console.cloud.google.com/
```

### 2. Navega a OAuth consent screen
 Menú hamburguesa (☰) → **APIs & Services** → **OAuth consent screen**

### 3. Agrega usuarios de prueba
En la sección **"Test users"**:

```
┌─────────────────────────────────────────────┐
│ Test users                                  │
│                                             │
│ While publishing status is "Testing", only │
│ test users can access your app. There is   │
│ no limit on number of users.               │
│                                             │
│ [+ ADD USERS]                              │
│                                             │
│ No test users added                         │
└─────────────────────────────────────────────┘
```

Haz clic en **[+ ADD USERS]** y agrega:
```
tu_correo@gmail.com
otro_correo@gmail.com (si necesitas)
```

### 4. Guarda los cambios
Haz clic en **"Save"** (Guardar)



## 🎯 Correos que debes agregar

Agrega **TODOS** los correos electrónicos que usarás para probar:

 ✅ Tu correo personal principal
 ✅ Correos de otros desarrolladores del equipo
 ✅ Correos de prueba
 ✅ Correos de cualquier persona que vaya a usar la aplicación en modo de desarrollo



## ⏱️ Tiempo de propagación

Después de agregar los usuarios:
 **Espera 23 minutos** antes de intentar iniciar sesión nuevamente
 Los cambios no son instantáneos



## 🔍 Verificación

Para verificar que todo está correcto:

1. Ve a **OAuth consent screen**
2. Verifica que el **Publishing status** sea **"Testing"**
3. Verifica que tu correo aparezca en **"Test users"**
4. Deberías ver algo como:

```
┌─────────────────────────────────────────────┐
│ Publishing status: Testing 🟡              │
│                                             │
│ Test users (1)                             │
│ • tu_correo@gmail.com                      │
└─────────────────────────────────────────────┘
```



## 🚫 Si el error persiste

### 1. Verifica que las APIs estén habilitadas:
    **Google+ API** ✓
    **Google Calendar API** ✓

### 2. Verifica las URIs de redirección:
   En **Credentials** → Tu OAuth 2.0 Client:
   ```
   Authorized redirect URIs:
   http://localhost:5000/api/auth/google/callback
   ```

### 3. Revisa los scopes solicitados:
   Tu aplicación solicita:
    `userinfo.profile` ✓
    `userinfo.email` ✓
    `calendar` ✓
    `calendar.events` ✓

   Asegúrate de que estos scopes estén configurados en la pantalla de consentimiento.



## 📸 Guía Visual

### Ubicación de "OAuth consent screen":
```
Google Cloud Console
  └─ ☰ (Menú)
      └─ APIs & Services
          └─ OAuth consent screen  ← AQUÍ
```

### Ubicación de "Test users":
```
OAuth consent screen
  ├─ App information
  ├─ Scopes
  └─ Test users  ← AQUÍ
      └─ [+ ADD USERS]  ← CLIC AQUÍ
```



## ✅ Después de agregar usuarios

1. **Cierra todas las pestañas** de tu aplicación
2. **Borra cookies** (opcional pero recomendado):
    Chrome: F12 → Application → Cookies → Clear
3. **Ve a** http://localhost:5173
4. **Haz clic en "Continuar con Google"**
5. **Selecciona tu correo** (ahora debería funcionar)
6. **Acepta los permisos**
7. ¡Listo! 🎉



## 💡 Tip Pro

Si vas a trabajar con múltiples cuentas de Google:
 Usa **modo incógnito** para probar con diferentes cuentas
 Agrega todas las cuentas como usuarios de prueba



## 🆘 Recursos Adicionales

 [Documentación oficial de OAuth](https://developers.google.com/identity/protocols/oauth2)
 [Configurar pantalla de consentimiento](https://support.google.com/cloud/answer/10311615)
 [Límites de usuarios de prueba](https://support.google.com/cloud/answer/9110914)



## ⚡ Resumen Rápido

1. Ve a: https://console.cloud.google.com/
2. **APIs & Services** → **OAuth consent screen**
3. Sección **"Test users"** → **[+ ADD USERS]**
4. Agrega tu correo: `tu_correo@gmail.com`
5. **Save**
6. Espera 23 minutos
7. Intenta iniciar sesión nuevamente



**Estado actual de tu aplicación:**
 ✅ Backend configurado correctamente
 ✅ Credenciales OAuth válidas
 ❌ Tu correo NO está en la lista de usuarios de prueba ← **ESTO DEBES ARREGLAR**

Una vez que agregues tu correo, todo funcionará perfectamente. 🚀

