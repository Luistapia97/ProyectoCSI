# 🚨 Problema con Zoho Mail API y Soluciones

## ❌ Error Actual: `URL_RULE_NOT_CONFIGURED`

Este error ocurre porque **Zoho Mail API REST tiene limitaciones severas**:

1. **No está disponible para OAuth estándar**: La API REST de Zoho Mail requiere configuración especial en la consola de desarrolladores
2. **El scope `ZohoMail.messages.CREATE` no es suficiente**: Zoho Mail API requiere permisos adicionales
3. **OAuth2 con SMTP tampoco funciona bien**: Zoho Mail SMTP requiere contraseñas de aplicación

## ✅ Soluciones Disponibles

### Solución 1: Contraseña de Aplicación de Zoho (RECOMENDADO) ⭐

Esta es la **forma más confiable** de enviar emails desde Zoho Mail.

#### Pasos:

1. **Inicia sesión en Zoho Mail**: https://mail.zoho.com
2. **Ve a Configuración**:
   - Haz clic en el ícono de engranaje (⚙️) arriba a la derecha
   - Selecciona "Configuración de cuenta"
3. **Navega a Seguridad**:
   - En el menú izquierdo, selecciona "Seguridad"
   - Busca la sección "Contraseñas de aplicación" o "App Passwords"
4. **Genera una contraseña**:
   - Haz clic en "Generar nueva contraseña"
   - Dale un nombre: "Nexus App"
   - Selecciona servicio: "Mail"
   - Copia la contraseña generada (16 caracteres)

5. **Agrega a las variables de entorno** (.env):
```env
# Zoho Mail con contraseña de aplicación
ZOHO_MAIL_APP_PASSWORD=tu_contraseña_generada
ZOHO_MAIL_USER=info@proyectoscsi.mx
```

6. **Modifica el código** para usar esta contraseña en lugar de OAuth

### Solución 2: Usar Gmail o Otro Proveedor

Si Zoho Mail es complicado, puedes usar:

#### Gmail con App Password:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu_app_password_de_16_caracteres
```

#### SendGrid (Gratis hasta 100 emails/día):
```env
SENDGRID_API_KEY=tu_api_key
```

### Solución 3: Habilitar Zoho Mail API (Avanzado)

Requiere configuración adicional en Zoho Developer Console:

1. Ve a https://api-console.zoho.com/
2. Crea un "Server-based Application"
3. Habilita específicamente "Zoho Mail API"
4. Solicita permisos extendidos
5. Espera aprobación de Zoho (puede tardar días)

## 🔧 Implementación Recomendada

### Paso 1: Generar Contraseña de Aplicación

Sigue los pasos de la **Solución 1** arriba.

### Paso 2: Actualizar ZohoMailService

Crea un nuevo método en `backend/services/zohoMail.js`:

```javascript
/**
 * Enviar email usando contraseña de aplicación de Zoho
 */
static async sendWithAppPassword({ from, to, subject, htmlContent, textContent, appPassword }) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.com',
    port: 465,
    secure: true,
    auth: {
      user: from,
      pass: appPassword, // Contraseña de aplicación de 16 caracteres
    },
  });

  const mailOptions = {
    from: from,
    to: to,
    subject: subject,
    text: textContent,
    html: htmlContent,
  };

  const info = await transporter.sendMail(mailOptions);
  return { success: true, messageId: info.messageId };
}
```

### Paso 3: Actualizar emailService.js

```javascript
// Si el usuario no tiene OAuth o falla, usar contraseña de aplicación
if (process.env.ZOHO_MAIL_APP_PASSWORD) {
  const result = await ZohoMailService.sendWithAppPassword({
    from: process.env.ZOHO_MAIL_USER,
    to: assignedUser.email,
    subject: mailOptions.subject,
    htmlContent: mailOptions.html,
    textContent: mailOptions.text,
    appPassword: process.env.ZOHO_MAIL_APP_PASSWORD,
  });
  
  if (result.success) {
    return { success: true, messageId: result.messageId, method: 'zoho_app_password' };
  }
}
```

## 📊 Comparación de Métodos

| Método | Confiabilidad | Configuración | OAuth | Límites |
|--------|--------------|---------------|-------|---------|
| **App Password** | ⭐⭐⭐⭐⭐ | Fácil | No | 500/día |
| **Zoho Mail API** | ⭐⭐ | Muy difícil | Sí | Limitado |
| **OAuth2 SMTP** | ⭐⭐ | Difícil | Sí | Limitado |
| **Gmail SMTP** | ⭐⭐⭐⭐⭐ | Fácil | No | 500/día |
| **SendGrid** | ⭐⭐⭐⭐⭐ | Muy fácil | No | 100/día gratis |

## 🎯 Recomendación Final

**Para producción**, usa una de estas opciones:

1. **Zoho Mail con App Password** (si ya tienes Zoho Mail)
2. **SendGrid** (más fácil, gratis, confiable)
3. **Gmail con App Password** (alternativa sólida)

**Evita**:
- ❌ Zoho Mail API REST (muy limitada)
- ❌ OAuth2 para SMTP (no soportado bien por Zoho)

## 🚀 Siguiente Paso

¿Quieres que implemente la solución con **contraseña de aplicación de Zoho** o prefieres cambiar a **SendGrid/Gmail**?
