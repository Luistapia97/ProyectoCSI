# 📧 Configuración de Notificaciones por Email

## Descripción General

El sistema Nexus envía notificaciones por correo electrónico cuando se asignan tareas a los usuarios.

### 🎯 Métodos de Envío

#### 🔵 **Método Principal: Zoho Mail** (RECOMENDADO)

Los correos se envían **desde la cuenta de Zoho del usuario** que asigna la tarea, haciendo las notificaciones más personales y auténticas.

 ✅ Sin configuración adicional necesaria
 ✅ Correos enviados desde la cuenta real del asignador
 ✅ Mejor deliverability (menos spam)
 ✅ Respuestas directas al asignador

👉 **Ver documentación completa**: [ZOHO_MAIL_NOTIFICATIONS.md](./ZOHO_MAIL_NOTIFICATIONS.md)

#### 📧 **Método Alternativo: SMTP (Fallback)**

Si el usuario no tiene cuenta de Zoho o su token expiró, el sistema automáticamente usa SMTP tradicional.

Este documento describe la configuración del **método SMTP fallback**.

## ✨ Características

 ✅ **Email de asignación de tarea**: Se envía automáticamente cuando se asigna una tarea a un usuario
 ✅ **Diseño profesional**: Emails con formato HTML responsive
 ✅ **Deep linking**: Enlaces directos a la tarea en la plataforma
 ✅ **Información completa**: Título, descripción, fecha límite, prioridad, asignador
 ✅ **Fallback de texto plano**: Para clientes de email que no soportan HTML

## 🔧 Configuración SMTP (Opcional)

> **Nota**: Solo necesitas configurar SMTP si quieres un método alternativo cuando Zoho Mail no esté disponible.

### 1. Variables de Entorno

Edita el archivo `.env` en la carpeta `backend`:

```env
# Email Configuration (SMTP Fallback)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=tu_password_de_aplicacion
```

### 2. Configurar Gmail (Recomendado para Fallback)

#### Opción A: Contraseña de Aplicación (Más Seguro)

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. Navega a **Seguridad**
3. Activa la **Verificación en dos pasos** (si no está activada)
4. Busca **Contraseñas de aplicaciones**
5. Genera una nueva contraseña para "Correo"
6. Copia la contraseña de 16 caracteres
7. Úsala en `EMAIL_PASSWORD`

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tucuenta@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop  # Contraseña de aplicación
```

#### Opción B: "Permitir aplicaciones menos seguras" (No Recomendado)

⚠️ **No recomendado por seguridad**

1. Ve a https://myaccount.google.com/lesssecureapps
2. Activa "Permitir aplicaciones menos seguras"
3. Usa tu contraseña normal en `EMAIL_PASSWORD`

### 3. Otros Proveedores de Email

#### SendGrid (Profesional  Recomendado para producción)

```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=TU_SENDGRID_API_KEY
```

#### Mailgun

```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=postmaster@tudominio.mailgun.org
EMAIL_PASSWORD=TU_MAILGUN_PASSWORD
```

#### Zoho ZeptoMail (Emails Transaccionales)

```env
EMAIL_HOST=smtp.zeptomail.com
EMAIL_PORT=587
EMAIL_USER=tu_usuario_zepto
EMAIL_PASSWORD=tu_password_zepto
```

#### Outlook/Hotmail

```env
EMAIL_HOST=smtpmail.outlook.com
EMAIL_PORT=587
EMAIL_USER=tucuenta@outlook.com
EMAIL_PASSWORD=tu_password
```

## 🚀 Uso

### Asignación de Tarea

Cuando un administrador asigna una tarea a un usuario, el sistema:

1. Crea la notificación en la base de datos
2. **Envía automáticamente un email** al usuario asignado
3. Emite un evento en tiempo real via Socket.IO

### Formato del Email

El email incluye:

 **Header atractivo** con gradiente morado
 **Tarjeta de tarea** con:
   Título de la tarea
   Fecha límite formateada
   Prioridad con íconos (🟢 🟡 🔴)
   Nombre y email del asignador
   Proyecto (si aplica)
   Descripción completa
 **Botón de acción** para ir directo a la tarea
 **Footer** con información del sistema

### Ejemplo de Email

```
📋 Nueva Tarea Asignada
━━━━━━━━━━━━━━━━━━━━━━━━

Hola Juan Pérez,

Luis Ramírez te ha asignado una nueva tarea en el sistema Nexus.

┌─────────────────────────────────┐
│ Implementar API de usuarios     │
├─────────────────────────────────┤
│ 📅 Fecha límite:                │
│    miércoles, 15 de noviembre   │
│    de 2025, 18:00               │
│                                 │
│ ⚡ Prioridad: 🔴 Alta           │
│ 👤 Asignado por:                │
│    Luis Ramírez                 │
│    (admin@nexus.com)            │
│ 📁 Proyecto: API Backend        │
└─────────────────────────────────┘

📝 Descripción:
Crear endpoints REST para gestión
de usuarios con autenticación JWT.

        [Ver Tarea en Nexus]
```

## 🧪 Pruebas

### Verificar Configuración

El sistema verifica automáticamente la configuración de email al iniciar:

```bash
✅ Configuración de email verificada correctamente
```

Si hay error:

```bash
❌ Error en la configuración de email: Authentication failed
```

### Probar Envío Manual

Puedes crear un script de prueba en `backend/scripts/testemail.js`:

```javascript
import { sendTaskAssignmentEmail } from '../utils/emailService.js';

const testTask = {
  _id: '123456',
  title: 'Tarea de Prueba',
  description: 'Esta es una prueba de email',
  priority: 'alta',
  dueDate: new Date(Date.now() + 86400000), // Mañana
  project: { name: 'Proyecto Test' }
};

const testUser = {
  name: 'Usuario Test',
  email: 'tu_email@ejemplo.com'
};

const assigner = {
  name: 'Admin',
  email: 'admin@nexus.com'
};

const result = await sendTaskAssignmentEmail(testTask, testUser, assigner);
console.log('Resultado:', result);
```

Ejecutar:

```bash
node scripts/testemail.js
```

## 📊 Logs

El sistema registra todas las operaciones de email:

### Email Enviado Exitosamente

```bash
📧 Enviando notificaciones por email...
✅ Email enviado: <messageid@gmail.com>
   Para: usuario@ejemplo.com
   Tarea: Implementar nueva funcionalidad
```

### Usuario sin Email

```bash
⚠️ Usuario sin email, no se puede enviar notificación: Juan Pérez
```

### Error de Envío

```bash
❌ Error enviando email: Authentication failed
```

## 🔒 Seguridad

### Buenas Prácticas

1. **Nunca** comitees el archivo `.env` con credenciales reales
2. Usa **contraseñas de aplicación** en lugar de contraseñas reales
3. Para producción, usa servicios profesionales (SendGrid, Mailgun)
4. Implementa **rate limiting** para prevenir abuso
5. Valida que los emails sean reales antes de enviar

### Límites de Envío

#### Gmail
 **500 emails/día** (cuentas gratuitas)
 **2,000 emails/día** (Google Workspace)

#### SendGrid
 **100 emails/día** (plan gratuito)
 Ilimitados (planes pagos)

## 🐛 Solución de Problemas

### "Invalid login: 5355.7.8 Username and Password not accepted"

**Solución**: Usa contraseña de aplicación, no tu contraseña normal de Gmail.

### "Timeout connecting to server"

**Soluciones**:
 Verifica el `EMAIL_HOST` y `EMAIL_PORT`
 Revisa tu firewall
 Prueba con puerto 465 (SSL) o 587 (TLS)

### "Self signed certificate"

**Solución**: Agrega a la configuración del transporter:

```javascript
tls: {
  rejectUnauthorized: false
}
```

### Emails van a SPAM

**Soluciones**:
 Configura registros SPF y DKIM en tu dominio
 Usa un servicio profesional de emails transaccionales
 No uses palabras spam en el asunto
 Incluye botón de "darse de baja" (requisito legal)

## 📈 Mejoras Futuras

Posibles mejoras a implementar:

 [ ] **Notificaciones de recordatorio** (1 día antes de vencimiento)
 [ ] **Digest diario** (resumen de tareas pendientes)
 [ ] **Email de actualización** cuando cambia el estado
 [ ] **Plantillas personalizables** por proyecto
 [ ] **Preferencias de usuario** (frecuencia de emails)
 [ ] **Webhooks** para integración con otros sistemas
 [ ] **Analytics** de tasas de apertura y clics
 [ ] **Soporte multiidioma** en los emails

## 📝 Código de Ejemplo

### Enviar Email Personalizado

```javascript
import { sendTaskAssignmentEmail } from '../utils/emailService.js';

// En tu controlador o ruta
const result = await sendTaskAssignmentEmail(
  task,           // Objeto de tarea poblado
  assignedUser,   // Usuario asignado
  req.user        // Usuario que asigna
);

if (result.success) {
  console.log('Email enviado:', result.messageId);
} else {
  console.error('Error:', result.error);
}
```

## 🔗 Referencias

 [Nodemailer Documentation](https://nodemailer.com/)
 [SendGrid API](https://docs.sendgrid.com/)
 [Mailgun Documentation](https://documentation.mailgun.com/)
 [Gmail SMTP Settings](https://support.google.com/mail/answer/7126229)



**¿Necesitas ayuda?** Contacta al equipo de desarrollo de Nexus.

