# 📧 Configuración de Envío Automático de Reportes

## Configuración SMTP

Para habilitar el envío automático de reportes por correo electrónico, necesitas configurar las credenciales SMTP en el archivo `.env` del backend.

### 1. Agregar Variables de Entorno

Edita el archivo `backend/.env` y agrega las siguientes variables:

```env
# Configuración SMTP para envío de correos
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-correo@gmail.com
SMTP_PASS=tu-contraseña-de-aplicación

# Destinatarios de reportes (separados por coma)
REPORT_RECIPIENTS=admin1@empresa.com,admin2@empresa.com,admin3@empresa.com

# Configuración del cron job (opcional)
# Formato: segundos minutos horas día-del-mes mes día-de-la-semana
# Por defecto: Lunes a las 9:00 AM
CRON_WEEKLY_REPORT=0 9 * * 1

# Zona horaria (opcional)
TIMEZONE=America/Mexico_City
```

### 2. Configuración para Gmail

Si usas Gmail, necesitas:

1. **Habilitar "Verificación en 2 pasos"** en tu cuenta de Google
2. **Generar una "Contraseña de aplicación"**:
   - Ve a: https://myaccount.google.com/apppasswords
   - Selecciona "Correo" y "Otro dispositivo personalizado"
   - Copia la contraseña generada (16 caracteres sin espacios)
   - Úsala como `SMTP_PASS`

**Ejemplo:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=sistemas@proyectoscsi.mx
SMTP_PASS=abcd efgh ijkl mnop  # (sin espacios: abcdefghijklmnop)
REPORT_RECIPIENTS=luis@csi.com,admin@csi.com
```

### 3. Configuración para Otros Proveedores

#### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=tu-correo@outlook.com
SMTP_PASS=tu-contraseña
```

#### Yahoo
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=tu-correo@yahoo.com
SMTP_PASS=tu-contraseña-de-aplicación
```

#### Zoho Mail
```env
SMTP_HOST=smtp.zoho.com
SMTP_PORT=587
SMTP_USER=tu-correo@zohomail.com
SMTP_PASS=tu-contraseña
```

**Nota:** Zoho no requiere contraseña de aplicación, usa tu contraseña normal.

#### Servidor SMTP Personalizado
```env
SMTP_HOST=mail.tuempresa.com
SMTP_PORT=587
SMTP_USER=tu-usuario
SMTP_PASS=tu-contraseña
```

## Programación de Reportes

### Formato del Cron Job

El formato del cron job es: `segundos minutos horas día-del-mes mes día-de-la-semana`

**Ejemplos comunes:**

```env
# Lunes a las 9:00 AM (por defecto)
CRON_WEEKLY_REPORT=0 9 * * 1

# Viernes a las 5:00 PM
CRON_WEEKLY_REPORT=0 17 * * 5

# Todos los días a las 8:00 AM
CRON_WEEKLY_REPORT=0 8 * * *

# Primer día del mes a las 10:00 AM
CRON_WEEKLY_REPORT=0 10 1 * *

# Cada domingo a las 7:00 PM
CRON_WEEKLY_REPORT=0 19 * * 0
```

**Días de la semana:**
- 0 = Domingo
- 1 = Lunes
- 2 = Martes
- 3 = Miércoles
- 4 = Jueves
- 5 = Viernes
- 6 = Sábado

## Verificación y Pruebas

### 1. Verificar Configuración SMTP

Desde el panel de administración:
1. Ve a la sección de **Reportes**
2. Haz clic en **"Verificar Email"**
3. Si todo está bien configurado, recibirás un correo de prueba

### 2. Enviar Reporte Manualmente

1. Genera un reporte con el botón **"Generar Reporte"**
2. Haz clic en el ícono de sobre (✉️) del reporte
3. Ingresa las direcciones de correo (separadas por coma)
4. Haz clic en **"Enviar"**

### 3. Ejecutar Cron Manualmente

En el panel de administración:
- Haz clic en **"Ejecutar Ahora"** para probar el envío automático
- Esto generará un reporte y lo enviará a todos los destinatarios configurados

### 4. Verificar Estado del Cron Job

El panel muestra:
- ✅ **Estado**: Activo/Inactivo
- 📅 **Próxima ejecución**: Fecha y hora
- ⏰ **Programación**: Cron expression actual

## Solución de Problemas

### Error: "Error sending email: Invalid login"
- Verifica que `SMTP_USER` y `SMTP_PASS` sean correctos
- Para Gmail, asegúrate de usar una contraseña de aplicación

### Error: "ECONNREFUSED"
- Verifica que `SMTP_HOST` y `SMTP_PORT` sean correctos
- Revisa tu firewall/antivirus

### No recibo correos
1. Revisa la carpeta de SPAM
2. Verifica que `REPORT_RECIPIENTS` tenga los correos correctos
3. Revisa los logs del backend para ver si hay errores

### Logs del Backend

Los logs mostrarán:
```
✅ Trabajos programados inicializados:
   - weekly-report: 0 9 * * 1
🕐 Ejecutando tarea programada: Reporte semanal
📊 Generando reporte semanal...
✅ Reporte generado: reporte-semanal-2026-01-13T09-00-00-000Z.pdf
✅ Reporte enviado exitosamente: <mensaje-id>
```

## Ejemplo Completo de Configuración

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/proyecto_nexus

# JWT
JWT_SECRET=tu-secreto-super-seguro-aqui

# Frontend URL
FRONTEND_URL=http://localhost:5173

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=sistemas@proyectoscsi.mx
SMTP_PASS=abcdefghijklmnop

# Report Recipients
REPORT_RECIPIENTS=luis.tapia@csi.com,admin@csi.com,gerencia@csi.com

# Cron Schedule (Lunes 9:00 AM)
CRON_WEEKLY_REPORT=0 9 * * 1

# Timezone
TIMEZONE=America/Mexico_City
```

## Seguridad

⚠️ **IMPORTANTE:**
- **NUNCA** subas el archivo `.env` al repositorio
- Usa contraseñas de aplicación, no tu contraseña principal
- Mantén las credenciales SMTP en un lugar seguro
- Revisa periódicamente los destinatarios configurados

## Soporte

Si necesitas ayuda adicional:
1. Revisa los logs del backend: `backend/logs/`
2. Verifica la consola del servidor
3. Usa la función "Verificar Email" del panel de administración
