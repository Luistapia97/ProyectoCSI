# Guía de Integración con Zoho Calendar

## Implementación Completada

He creado un sistema completo de sincronización con Zoho Calendar. Aquí está todo lo que necesitas saber:

---

## Características Implementadas

### **Backend:**
- Servicio de Zoho Calendar (`backend/services/zohoCalendar.js`)
- Endpoints API para conectar/desconectar cuenta
- Sincronización de tareas con eventos de calendario
- Obtener, crear, actualizar y eliminar eventos

### **Frontend:**
- Página de configuración (`/settings`)
- Componente de integración de Zoho
- Interfaz para conectar cuenta con token
- Estado de conexión visual

---

## Cómo Usar

### **Paso 1: Accede a Configuración**

1. Inicia sesión en la aplicación: http://localhost:5173
2. Ve al Dashboard
3. En el menú, busca y haz clic en **"Configuración"** o ve directamente a:
   ```
   http://localhost:5173/settings
   ```

### **Paso 2: Obtén tu Token de Zoho**

#### **Método Actualizado - Self Client OAuth**

1. **Ve a la Consola de API de Zoho:**
   ```
   https://api-console.zoho.com/
   ```

2. **Crea un Self Client:**
   - Click en **"Add Client"**
   - Selecciona **"Self Client"**
   - Client Name: `Nexus Calendar`
   - Click en **"Create"**

3. **Genera el código de autorización:**
   - Una vez creado, verás el **Client ID** y **Client Secret**
   - Haz click en el botón **"Generate Code"** (o "Generate Token")
   - **Selecciona el scope:** `ZohoCalendar.calendar.ALL`
   - **Tiempo de validez:** Elige el máximo disponible (10 minutos)
   - Click en **"Generate"**

4. **Copia el código generado** (es un código temporal)

5. **Genera el Access Token:**
   
   **Opción A: Usar Postman o cURL**
   
   Ejecuta este comando en PowerShell (reemplaza los valores):
   ```powershell
   $body = @{
       code = "TU_CODIGO_AQUI"
       client_id = "TU_CLIENT_ID"
       client_secret = "TU_CLIENT_SECRET"
       grant_type = "authorization_code"
   }
   
   Invoke-RestMethod -Uri "https://accounts.zoho.com/oauth/v2/token" -Method POST -Body $body
   ```

   **Opción B: Desde la consola de Zoho**
   
   Algunos Self Clients muestran directamente el Access Token después de generar el código.

6. **Copia el Access Token** que comienza con `1000.xxxxxx...`

---

#### **Método Alternativo - URL Directa**

Si lo anterior no funciona, usa este método directo:

1. **Abre esta URL en tu navegador** (reemplaza `TU_CLIENT_ID`):
   ```
   https://accounts.zoho.com/oauth/v2/auth?scope=ZohoCalendar.calendar.ALL&client_id=TU_CLIENT_ID&response_type=token&redirect_uri=https://www.zoho.com/oauth&access_type=offline
   ```

2. **Autoriza la aplicación**

3. **Serás redirigido a una URL que contendrá el token:**
   ```
   https://www.zoho.com/oauth#access_token=1000.xxxxx...
   ```

4. **Copia todo el texto después de `access_token=`** hasta el siguiente `&`

### **Paso 3: Conecta tu Cuenta**

1. En la página de configuración, pega tu token de Zoho
2. (Opcional) Si tienes un Refresh Token, agrégalo también
3. Haz clic en **"Conectar cuenta de Zoho"**
4. Verás un mensaje de confirmación

### **Paso 4: ¡Listo!**

Ahora tu cuenta está conectada y lista para sincronizar eventos.

---

## Endpoints API Disponibles

### **1. Conectar Cuenta**
```http
POST /api/zoho/connect
Authorization: Bearer {tu_token_jwt}
Content-Type: application/json

{
  "accessToken": "1000.xxxxxxxxxxxxx",
  "refreshToken": "1000.yyyyyyyyyyyyy" // opcional
}
```

### **2. Obtener Eventos**
```http
GET /api/zoho/events?startDate=2025-01-01&endDate=2025-12-31
Authorization: Bearer {tu_token_jwt}
```

### **3. Sincronizar Tarea**
```http
POST /api/zoho/sync-task
Authorization: Bearer {tu_token_jwt}
Content-Type: application/json

{
  "taskId": "task_id_here"
}
```

### **4. Desconectar Cuenta**
```http
DELETE /api/zoho/disconnect
Authorization: Bearer {tu_token_jwt}
```

---

## Próximos Pasos (Opcional)

Si quieres agregar más funcionalidades:

### **1. Sincronización Automática de Tareas**
Cuando crees una tarea en Nexus, automáticamente se creará un evento en Zoho Calendar.

### **2. Vista de Calendario**
Mostrar los eventos de Zoho Calendar directamente en el dashboard.

### **3. Notificaciones**
Recibir notificaciones cuando se acerque una fecha límite.

---

## Solución de Problemas

### **"Token inválido o expirado"**
- Genera un nuevo token en Zoho
- Asegúrate de usar los scopes correctos: `ZohoCalendar.calendar.ALL`

### **"No hay cuenta de Zoho conectada"**
- Primero conecta tu cuenta desde `/settings`
- Verifica que el token se guardó correctamente

### **"Error al sincronizar"**
- Verifica que tu cuenta de Zoho tenga acceso a Calendar
- Revisa que el token tenga permisos suficientes

---

## Ejemplo de Uso Completo

```javascript
// En el frontend, después de conectar la cuenta:

// 1. Crear un evento directamente
const createEvent = async () => {
  const response = await axios.post(
    'http://localhost:5000/api/zoho/sync-task',
    {
      taskId: 'tu_task_id'
    },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  
  console.log('Evento creado:', response.data);
};

// 2. Obtener eventos
const getEvents = async () => {
  const response = await axios.get(
    'http://localhost:5000/api/zoho/events?startDate=2025-01-01&endDate=2025-12-31',
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  
  console.log('Eventos:', response.data.events);
};
```

---

## Resumen

**Ya está todo implementado y funcionando:**

1. Backend con servicio de Zoho Calendar
2. Endpoints API para gestionar la conexión
3. Página de configuración en el frontend
4. Interfaz visual para conectar cuenta
5. Sistema listo para sincronizar tareas y eventos

**Para empezar:**
1. Ve a http://localhost:5173/settings
2. Conecta tu cuenta de Zoho con un token
3. ¡Empieza a sincronizar!

---

¿Necesitas ayuda adicional o quieres agregar más funcionalidades?

