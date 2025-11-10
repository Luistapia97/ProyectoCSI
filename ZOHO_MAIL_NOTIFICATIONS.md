# 📧 Sistema de Notificaciones por Email con Zoho Mail

## 🎯 Descripción

El sistema de notificaciones envía correos electrónicos **exclusivamente desde la cuenta de Zoho del usuario que asigna la tarea**. 

⚠️ **IMPORTANTE**: Solo se enviarán notificaciones si el usuario que asigna la tarea ha iniciado sesión con Zoho.

## ⚙️ Cómo Funciona

### 🔵 Método Único: Zoho Mail API

Cuando un usuario con una cuenta de Zoho asigna una tarea:

1. **El sistema verifica que el usuario tenga token de Zoho**
2. **Usa el token de acceso de Zoho** del usuario que está asignando la tarea
3. **Envía el correo desde su cuenta de Zoho Mail** usando la API de Zoho
4. **El destinatario recibe el correo desde la cuenta real** del asignador (ej: `juan.perez@zohomail.com`)

### ❌ Si el usuario NO tiene cuenta de Zoho:

- **NO se enviará email** 
- La tarea se crea/asigna normalmente
- Se muestra un mensaje en los logs:
  ```
  ⚠️ Usuario sin cuenta de Zoho conectada
  💡 El usuario debe iniciar sesión con Zoho para enviar notificaciones
  ```

## 🔐 Permisos Necesarios

### Scopes de OAuth de Zoho:

Para que el sistema funcione correctamente, necesitas los siguientes scopes en tu aplicación de Zoho:

```
- openid                        (Autenticación)
- email                         (Obtener email del usuario)
- profile                       (Obtener información del perfil)
- ZohoMail.messages.CREATE      (Enviar correos desde Zoho Mail) ✨ NUEVO
```

### Configuración en Zoho API Console:

1. Ve a [Zoho API Console](https://api-console.zoho.com/)
2. Selecciona tu aplicación
3. Ve a **Client Secret** → **Scopes**
4. Agrega el scope: `ZohoMail.messages.CREATE`
5. Guarda los cambios

## 🚀 Configuración

### Variables de Entorno

Tu archivo `backend/.env` debe contener:

```env
# Zoho OAuth (para login y envío de correos)
ZOHO_CLIENT_ID=tu_client_id
ZOHO_CLIENT_SECRET=tu_client_secret
ZOHO_REDIRECT_URI=http://localhost:5000/api/auth/zoho/callback

# Frontend URL (para enlaces en los correos)
FRONTEND_URL=http://localhost:5173
```

⚠️ **Ya NO necesitas configurar EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD**

## 📨 Flujo de Envío de Correos

```
Usuario asigna tarea
   ↓
¿Tiene token de Zoho?
   ↓
   ├─ SÍ → Enviar desde Zoho Mail
   │        ├─ ✅ Éxito → Correo enviado
   │        └─ ❌ Error → Tarea creada sin email
   │
   └─ NO → ⚠️ No se envía email
            Tarea creada sin notificación
            Usuario debe iniciar sesión con Zoho
```

## 💡 Ventajas de Usar Solo Zoho Mail

### ✅ Beneficios:

1. **Autenticidad**: Los correos llegan desde la cuenta real del asignador
2. **Personalización**: El destinatario sabe exactamente quién le asignó la tarea
3. **Sin configuración SMTP**: No necesitas configurar cuentas de email adicionales
4. **Mejor deliverability**: Los correos tienen menos probabilidad de ser marcados como spam
5. **Respuestas directas**: El usuario puede responder directamente al correo del asignador
6. **Seguridad**: No almacenas contraseñas de email en el servidor

### 📊 Logs del Sistema:

Cuando se envía un correo, verás logs como estos:

**✅ Usuario CON cuenta de Zoho:**
```
� Enviando notificaciones por email...
🔵 Enviando email desde Zoho Mail...
   De: juan.perez@zohomail.com
   Para: maria.garcia@example.com
✅ Email enviado desde Zoho Mail: <message_id>
   Tarea: Implementar nueva funcionalidad
```

**⚠️ Usuario SIN cuenta de Zoho:**
```
📧 Enviando notificaciones por email...
⚠️ Usuario que asigna no tiene cuenta de Zoho conectada
   Usuario: Juan Pérez
   Email: juan.perez@example.com
   Token Zoho: No disponible
💡 El usuario debe iniciar sesión con Zoho para enviar notificaciones
⚠️ María García no recibirá email - El usuario no tiene cuenta de Zoho conectada
```

**❌ Token de Zoho expirado:**
```
� Enviando email desde Zoho Mail...
❌ Error al enviar email desde Zoho Mail
   Error: Token de Zoho expirado
🔄 El token de Zoho ha expirado. El usuario debe volver a iniciar sesión.
⚠️ Token de Zoho expirado - El usuario debe volver a iniciar sesión con Zoho
```

## 🔄 Re-autenticación de Usuarios

### ⚠️ Si un usuario NO puede enviar notificaciones:

**Causa**: El usuario no ha iniciado sesión con Zoho o su token expiró.

**Solución**:

1. **Cerrar sesión en Nexus**
2. **Iniciar sesión con Zoho** (botón "Iniciar sesión con Zoho")
3. **Aprobar los permisos de Zoho Mail** cuando se soliciten
4. ✅ **Listo!** Ahora las notificaciones se enviarán desde tu cuenta de Zoho

### 📋 Instrucciones para Usuarios:

Si ves este mensaje en los logs:
```
⚠️ Usuario que asigna no tiene cuenta de Zoho conectada
```

Significa que **debes iniciar sesión con Zoho** para poder enviar notificaciones por email.

## 🎨 Plantilla de Email

La plantilla de email incluye:

- **Encabezado con gradiente morado** (Nexus branding)
- **Tarjeta de tarea** con:
  - Título de la tarea
  - Fecha límite (formateada en español)
  - Prioridad con emojis (🟢 🟡 🔴)
  - Información del asignador
  - Proyecto (si aplica)
  - Descripción completa
- **Botón de acción** con enlace directo a la tarea
- **Diseño responsive** que se ve bien en todos los dispositivos
- **Versión de texto plano** como fallback

## 🛠️ Troubleshooting

### Problema: "Usuario no tiene cuenta de Zoho conectada"

**Solución**: El usuario debe iniciar sesión con Zoho

```
1. Cerrar sesión
2. Iniciar sesión con "Iniciar sesión con Zoho"
3. Aprobar permisos
```

### Problema: "Token de Zoho expirado"

**Causa**: El token de acceso ha caducado

**Solución**: Re-autenticarse con Zoho

```
1. Cerrar sesión
2. Iniciar sesión nuevamente con Zoho
3. El sistema obtendrá un nuevo token
```

### Problema: "No se pudo enviar email desde Zoho Mail"

**Causas posibles**:
1. Token de Zoho inválido o expirado → Re-autenticarse
2. Permisos insuficientes (falta `ZohoMail.messages.CREATE`) → Verificar scopes
3. Cuenta de Zoho Mail no activada → Activar Zoho Mail
4. API de Zoho Mail temporalmente no disponible → Reintentar más tarde

**Solución**: La tarea se crea de todas formas, solo falla el envío del email

## 📊 API del Servicio

### ZohoMailService

```javascript
import ZohoMailService from '../services/zohoMail.js';

// Crear instancia del servicio
const zohoMail = new ZohoMailService(
  userAccessToken,  // Token OAuth de Zoho del usuario
  userEmail         // Email del usuario en Zoho
);

// Enviar correo
const result = await zohoMail.sendEmail({
  to: 'destinatario@example.com',
  subject: 'Asunto del correo',
  htmlContent: '<h1>HTML del correo</h1>',
  textContent: 'Versión en texto plano'
});

if (result.success) {
  console.log('Correo enviado:', result.messageId);
} else {
  console.error('Error:', result.error);
  if (result.needsReauth) {
    // Usuario necesita re-autenticarse
  }
}
```

### sendTaskAssignmentEmail (Modificado)

```javascript
import { sendTaskAssignmentEmail } from '../utils/emailService.js';

// El tercer parámetro (assignedBy) ahora debe incluir el token de Zoho
const result = await sendTaskAssignmentEmail(
  taskData,      // Información de la tarea
  assignedUser,  // Usuario al que se asigna
  {
    name: 'Juan Pérez',
    email: 'juan.perez@zohomail.com',
    zohoAccessToken: 'xyz123...'  // ✨ Token de Zoho del asignador
  }
);

// Respuesta incluye el método usado
{
  success: true,
  messageId: '<message-id>',
  recipient: 'maria.garcia@example.com',
  method: 'zoho'  // o 'smtp' si se usó fallback
}
```

## 📈 Próximas Mejoras

- [ ] **Refresh automático de tokens**: Usar refresh tokens para renovar tokens expirados
- [ ] **Dashboard de correos enviados**: Ver estadísticas de correos enviados por usuario
- [ ] **Plantillas personalizables**: Permitir a cada usuario personalizar sus plantillas
- [ ] **Firma de correo**: Agregar firma personalizada del usuario
- [ ] **CC y BCC**: Permitir copiar a otras personas
- [ ] **Adjuntos**: Adjuntar archivos a las notificaciones

## 🔗 Enlaces Útiles

- [Zoho Mail API Documentation](https://www.zoho.com/mail/help/api/)
- [Zoho OAuth Scopes](https://www.zoho.com/accounts/protocol/oauth/scopes.html)
- [Zoho API Console](https://api-console.zoho.com/)

## ✅ Resumen

**Sistema**: Notificaciones por email **exclusivamente desde Zoho Mail**

**Requisito**: El usuario que asigna la tarea **debe** haber iniciado sesión con Zoho

**Comportamiento**:
- ✅ Usuario CON Zoho → Email enviado desde su cuenta
- ⚠️ Usuario SIN Zoho → Email NO se envía (tarea se crea normalmente)

**Ventaja principal**: Correos auténticos y personales desde la cuenta real del asignador

**Sin necesidad de**: Configurar SMTP, contraseñas de email, o cuentas adicionales

---

**¿Preguntas o problemas?** Consulta los logs del servidor o contacta al equipo de desarrollo.
