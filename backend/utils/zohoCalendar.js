import axios from 'axios';

// URLs de la API de Zoho Calendar
const ZOHO_API_BASE = 'https://calendar.zoho.com/api/v1';
const ZOHO_ACCOUNTS_URL = 'https://accounts.zoho.com/oauth/v2';

// Crear cliente HTTP para Zoho
const createZohoClient = (accessToken) => {
  return axios.create({
    baseURL: ZOHO_API_BASE,
    headers: {
      'Authorization': `Zohooauthtoken ${accessToken}`,
      'ContentType': 'application/json',
    },
  });
};

// Refrescar token de acceso si es necesario
const refreshAccessToken = async (refreshToken) => {
  try {
    const response = await axios.post(`${ZOHO_ACCOUNTS_URL}/token`, null, {
      params: {
        refresh_token: refreshToken,
        client_id: process.env.ZOHO_CLIENT_ID,
        client_secret: process.env.ZOHO_CLIENT_SECRET,
        grant_type: 'refresh_token',
      },
    });

    return {
      success: true,
      accessToken: response.data.access_token,
    };
  } catch (error) {
    console.error('Error refrescando token de Zoho:', error.response?.data || error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Obtener colores según prioridad
const getPriorityColor = (priority) => {
  const colors = {
    'baja': 'blue',
    'media': 'yellow',
    'alta': 'orange',
    'urgente': 'red',
  };
  return colors[priority] || 'blue';
};

// Crear evento en Zoho Calendar
export const createCalendarEvent = async (user, taskData) => {
  try {
    if (!user.zohoAccessToken) {
      throw new Error('Usuario no tiene cuenta de Zoho vinculada');
    }

    const zoho = createZohoClient(user.zohoAccessToken);

    // Extraer la fecha sin conversión de zona horaria
    let dateString;
    
    if (taskData.dueDate instanceof Date) {
      const utcYear = taskData.dueDate.getUTCFullYear();
      const utcMonth = String(taskData.dueDate.getUTCMonth() + 1).padStart(2, '0');
      const utcDay = String(taskData.dueDate.getUTCDate()).padStart(2, '0');
      dateString = `${utcYear}${utcMonth}${utcDay}`;
    } else if (typeof taskData.dueDate === 'string') {
      if (taskData.dueDate.includes('T')) {
        dateString = taskData.dueDate.split('T')[0];
      } else {
        dateString = taskData.dueDate;
      }
    } else {
      throw new Error('Formato de fecha no válido');
    }
    
    // Zoho Calendar usa formato de timestamp en milisegundos
    const startDate = new Date(`${dateString}T09:00:00`);
    const endDate = new Date(`${dateString}T10:00:00`);

    const event = {
      title: taskData.title,
      description: taskData.description || 'Tarea del proyecto Nexus',
      stime: startDate.getTime(), // Start time en milisegundos
      etime: endDate.getTime(),   // End time en milisegundos
      timezone: 'America/Mexico_City',
      isallday: false,
      reminder: [
        { minutes: 1440 }, // 1 día antes (1440 minutos)
        { minutes: 60 },   // 1 hora antes
        { minutes: 10 },   // 10 minutos antes
      ],
      color: getPriorityColor(taskData.priority),
    };

    const response = await zoho.post('/events', event);

    return {
      success: true,
      eventId: response.data.events[0].uid,
      eventLink: `https://calendar.zoho.com/event/${response.data.events[0].uid}`,
    };
  } catch (error) {
    console.error('Error creando evento en Zoho Calendar:', error.response?.data || error);
    
    // Si el token expiró, intentar refrescar
    if (error.response?.status === 401 && user.zohoRefreshToken) {
      const refreshResult = await refreshAccessToken(user.zohoRefreshToken);
      if (refreshResult.success) {
        // Actualizar token del usuario
        user.zohoAccessToken = refreshResult.accessToken;
        await user.save();
        
        // Reintentar la creación del evento
        return createCalendarEvent(user, taskData);
      }
    }

    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

// Actualizar evento en Zoho Calendar
export const updateCalendarEvent = async (user, eventId, taskData) => {
  try {
    if (!user.zohoAccessToken || !eventId) {
      return { success: false, error: 'No hay evento de Zoho Calendar para actualizar' };
    }

    const zoho = createZohoClient(user.zohoAccessToken);

    // Extraer la fecha sin conversión de zona horaria
    let dateString;
    
    if (taskData.dueDate instanceof Date) {
      const utcYear = taskData.dueDate.getUTCFullYear();
      const utcMonth = String(taskData.dueDate.getUTCMonth() + 1).padStart(2, '0');
      const utcDay = String(taskData.dueDate.getUTCDate()).padStart(2, '0');
      dateString = `${utcYear}${utcMonth}${utcDay}`;
    } else if (typeof taskData.dueDate === 'string') {
      if (taskData.dueDate.includes('T')) {
        dateString = taskData.dueDate.split('T')[0];
      } else {
        dateString = taskData.dueDate;
      }
    } else {
      throw new Error('Formato de fecha no válido');
    }
    
    const startDate = new Date(`${dateString}T09:00:00`);
    const endDate = new Date(`${dateString}T10:00:00`);

    const event = {
      title: taskData.title,
      description: taskData.description || 'Tarea del proyecto Nexus',
      stime: startDate.getTime(),
      etime: endDate.getTime(),
      timezone: 'America/Mexico_City',
      color: getPriorityColor(taskData.priority),
    };

    const response = await zoho.put(`/events/${eventId}`, event);

    return {
      success: true,
      eventLink: `https://calendar.zoho.com/event/${eventId}`,
    };
  } catch (error) {
    console.error('Error actualizando evento en Zoho Calendar:', error.response?.data || error);
    
    // Si el token expiró, intentar refrescar
    if (error.response?.status === 401 && user.zohoRefreshToken) {
      const refreshResult = await refreshAccessToken(user.zohoRefreshToken);
      if (refreshResult.success) {
        user.zohoAccessToken = refreshResult.accessToken;
        await user.save();
        return updateCalendarEvent(user, eventId, taskData);
      }
    }

    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

// Eliminar evento de Zoho Calendar
export const deleteCalendarEvent = async (user, eventId) => {
  try {
    if (!user.zohoAccessToken || !eventId) {
      return { success: false, error: 'No hay evento de Zoho Calendar para eliminar' };
    }

    const zoho = createZohoClient(user.zohoAccessToken);

    await zoho.delete(`/events/${eventId}`);

    return {
      success: true,
      message: 'Evento eliminado de Zoho Calendar',
    };
  } catch (error) {
    console.error('Error eliminando evento de Zoho Calendar:', error.response?.data || error);
    
    // Si el evento ya no existe (404), considerarlo éxito
    if (error.response?.status === 404) {
      return {
        success: true,
        message: 'Evento ya fue eliminado',
      };
    }

    // Si el token expiró, intentar refrescar
    if (error.response?.status === 401 && user.zohoRefreshToken) {
      const refreshResult = await refreshAccessToken(user.zohoRefreshToken);
      if (refreshResult.success) {
        user.zohoAccessToken = refreshResult.accessToken;
        await user.save();
        return deleteCalendarEvent(user, eventId);
      }
    }

    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

// Listar próximos eventos
export const listUpcomingEvents = async (user, maxResults = 10) => {
  try {
    if (!user.zohoAccessToken) {
      throw new Error('Usuario no tiene cuenta de Zoho vinculada');
    }

    const zoho = createZohoClient(user.zohoAccessToken);

    const now = Date.now();
    const oneMonthLater = now + (30 * 24 * 60 * 60 * 1000); // 30 días después

    const response = await zoho.get('/events', {
      params: {
        stime: now,
        etime: oneMonthLater,
        limit: maxResults,
      },
    });

    return {
      success: true,
      events: response.data.events || [],
    };
  } catch (error) {
    console.error('Error listando eventos de Zoho Calendar:', error.response?.data || error);
    
    // Si el token expiró, intentar refrescar
    if (error.response?.status === 401 && user.zohoRefreshToken) {
      const refreshResult = await refreshAccessToken(user.zohoRefreshToken);
      if (refreshResult.success) {
        user.zohoAccessToken = refreshResult.accessToken;
        await user.save();
        return listUpcomingEvents(user, maxResults);
      }
    }

    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

// Verificar estado de sincronización
export const getCalendarSyncStatus = async (user) => {
  try {
    if (!user.zohoAccessToken) {
      return {
        connected: false,
        message: 'No hay cuenta de Zoho vinculada',
      };
    }

    // Intentar hacer una petición simple para verificar
    const zoho = createZohoClient(user.zohoAccessToken);
    await zoho.get('/calendars');

    return {
      connected: true,
      message: 'Conectado a Zoho Calendar',
    };
  } catch (error) {
    return {
      connected: false,
      message: error.response?.data?.message || 'Error de conexión',
    };
  }
};

