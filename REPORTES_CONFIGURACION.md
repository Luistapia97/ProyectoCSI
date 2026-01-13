# 📊 Sistema de Reportes Automáticos - Guía de Configuración

## 🎯 Descripción General
El sistema de reportes automáticos genera informes semanales en PDF con métricas detalladas de:
- ✅ Desempeño de cada usuario
- 📁 Progreso de proyectos
- 📈 Tasas de cumplimiento
- ⏰ Tareas atrasadas y próximas a vencer
- 👥 Estadísticas del equipo

## 📋 Requisitos Previos
- Node.js instalado
- MongoDB configurado
- Cuenta de correo con SMTP habilitado

## 🔧 Configuración del Correo Electrónico

### Opción 1: Gmail (Recomendado)
1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. Activa la verificación en 2 pasos
3. Crea una "Contraseña de aplicación":
   - Ve a "Seguridad" > "Verificación en 2 pasos"
   - Desplázate a "Contraseñas de aplicaciones"
   - Selecciona "Correo" y "Windows"
   - Copia la contraseña generada (16 caracteres sin espacios)

4. Configura en el archivo `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx  # La contraseña de aplicación
```

### Opción 2: Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=tu_email@outlook.com
SMTP_PASS=tu_contraseña_normal
```

### Opción 3: Yahoo Mail
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=tu_email@yahoo.com
SMTP_PASS=contraseña_de_aplicacion  # Generar en configuración de Yahoo
```

## 📧 Configuración de Destinatarios
En el archivo `.env`, agrega los correos que recibirán los reportes (separados por comas):
```env
REPORT_RECIPIENTS=admin@empresa.com,gerente@empresa.com,director@empresa.com
```

## ⏰ Configuración del Horario de Envío
El sistema usa formato Cron para programar el envío automático:
```env
CRON_WEEKLY_REPORT=0 9 * * 1  # Lunes 9:00 AM
```

### Ejemplos de configuración:
- `0 9 * * 1` = Lunes a las 9:00 AM
- `0 18 * * 5` = Viernes a las 6:00 PM
- `0 8 * * 1,3,5` = Lunes, Miércoles y Viernes a las 8:00 AM
- `0 12 * * 0` = Domingo a las 12:00 PM
- `30 14 * * 2` = Martes a las 2:30 PM

**Formato:** `minuto hora * * día-semana`
- Minuto: 0-59
- Hora: 0-23 (formato 24 horas)
- Día semana: 0-6 (0=Domingo, 1=Lunes, ..., 6=Sábado)

## 🌍 Zona Horaria
Configura tu zona horaria para que los reportes se envíen a la hora correcta:
```env
TIMEZONE=America/Mexico_City
```

Otras zonas horarias comunes:
- `America/New_York` - Hora del Este (USA)
- `America/Los_Angeles` - Hora del Pacífico (USA)
- `America/Chicago` - Hora Central (USA)
- `America/Bogota` - Colombia
- `America/Lima` - Perú
- `Europe/Madrid` - España

## 🚀 Pasos de Instalación

### 1. Instalar Dependencias
Si aún no lo has hecho:
```bash
cd backend
npm install
```

### 2. Configurar Variables de Entorno
Edita el archivo `backend/.env` con la configuración de correo y destinatarios.

### 3. Verificar Configuración
Puedes probar la configuración del correo usando el endpoint de verificación:
```bash
# Inicia el servidor
npm run dev

# En otra terminal, ejecuta:
curl -X POST http://localhost:5000/api/reports/verify-email
```

### 4. Probar Envío Manual
Desde la interfaz web:
1. Inicia sesión como administrador
2. Haz clic en el ícono de configuración ⚙️
3. Selecciona "Reportes de Seguimiento"
4. Haz clic en "Generar Reporte" para crear un PDF
5. Haz clic en "Enviar por Email" para enviarlo

O desde la API:
```bash
curl -X POST http://localhost:5000/api/reports/trigger
```

## 📱 Uso de la Interfaz Web

### Como Administrador puedes:
1. **Generar Reportes Manualmente**: Crear un PDF con las métricas actuales
2. **Ver Historial**: Lista de todos los reportes generados con fecha y tamaño
3. **Descargar Reportes**: Descarga cualquier reporte previo
4. **Enviar por Email**: Envía el reporte a destinatarios específicos
5. **Ver Estado del Cron**: Consulta cuándo será el próximo envío automático
6. **Ejecutar Envío Ahora**: Fuerza el envío automático sin esperar

## 📊 Contenido del Reporte

El reporte PDF incluye:

### 1. Resumen Global
- Total de proyectos activos
- Total de usuarios
- Total de tareas
- Tareas completadas esta semana
- Tasa de cumplimiento global

### 2. Por Proyecto
- Nombre y descripción
- Progreso general (%)
- Tamaño del equipo
- Tareas completadas esta semana
- Tareas pendientes y atrasadas

### 3. Por Usuario
- Nombre y email
- Tasa de cumplimiento personal
- Tareas activas
- Tareas completadas
- Tareas atrasadas
- Tareas próximas a vencer (7 días)
- Desglose de tareas por proyecto

## 🔍 Solución de Problemas

### Error: "Error verificando configuración de correo"
- Verifica que SMTP_USER y SMTP_PASS estén configurados
- Si usas Gmail, asegúrate de usar una contraseña de aplicación
- Verifica que la verificación en 2 pasos esté activa

### Error: "Authentication failed"
- Gmail: Usa contraseña de aplicación, no tu contraseña normal
- Outlook: Verifica que tu cuenta permita aplicaciones menos seguras
- Yahoo: Genera y usa una contraseña de aplicación específica

### No se envían correos automáticamente
- Verifica que el servidor esté corriendo constantemente
- Revisa los logs del servidor para ver si hay errores
- Confirma que CRON_WEEKLY_REPORT esté configurado correctamente
- Usa el endpoint `/api/reports/cron-status` para ver el estado

### PDF vacío o con errores
- Verifica que haya datos en la base de datos (usuarios, proyectos, tareas)
- Revisa los logs del servidor para ver errores específicos
- Asegúrate de que el directorio `backend/reports/` existe y tiene permisos de escritura

## 📝 API Endpoints

Para administradores:

- `GET /api/reports/generate` - Genera un nuevo reporte PDF
- `GET /api/reports/history` - Lista todos los reportes generados
- `GET /api/reports/download/:filename` - Descarga un reporte específico
- `POST /api/reports/email` - Envía reporte por email a destinatarios específicos
- `POST /api/reports/trigger` - Ejecuta manualmente el envío automático
- `GET /api/reports/cron-status` - Estado de tareas programadas
- `POST /api/reports/verify-email` - Verifica configuración de correo
- `DELETE /api/reports/:filename` - Elimina un reporte

## 🔒 Seguridad

- Solo los administradores tienen acceso a los reportes
- Los archivos PDF se almacenan en `backend/reports/` (no accesibles públicamente)
- Se requiere autenticación con token JWT para todos los endpoints
- Las contraseñas SMTP se almacenan en variables de entorno (no en el código)

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs del servidor backend
2. Verifica que todas las variables de entorno estén configuradas
3. Prueba el envío manual antes de confiar en el automático
4. Consulta la documentación de tu proveedor de correo sobre SMTP

## 🎉 ¡Listo!

Una vez configurado, el sistema:
- ✅ Generará reportes PDF automáticamente
- 📧 Los enviará por correo a los destinatarios configurados
- 📊 Incluirá todas las métricas importantes
- 🕐 Se ejecutará en el horario que configuraste

No necesitas hacer nada más, el sistema trabajará automáticamente en segundo plano.
