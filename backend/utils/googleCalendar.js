import { google } from 'googleapis';

// Crear cliente de Google Calendar
const createCalendarClient = (accessToken, refreshToken) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
};

// Crear evento en Google Calendar
export const createCalendarEvent = async (user, taskData) => {
  try {
    if (!user.googleAccessToken) {
      throw new Error('Usuario no tiene cuenta de Google vinculada');
    }

    const calendar = createCalendarClient(user.googleAccessToken, user.googleRefreshToken);

    // Extraer la fecha sin conversión de zona horaria
    let dateString;
    
    // Si dueDate es un objeto Date, convertirlo a string en UTC
    if (taskData.dueDate instanceof Date) {
      const utcYear = taskData.dueDate.getUTCFullYear();
      const utcMonth = String(taskData.dueDate.getUTCMonth() + 1).padStart(2, '0');
      const utcDay = String(taskData.dueDate.getUTCDate()).padStart(2, '0');
      dateString = `${utcYear}${utcMonth}${utcDay}`;
    } else if (typeof taskData.dueDate === 'string') {
      // Si es string, extraer solo la parte de la fecha
      if (taskData.dueDate.includes('T')) {
        dateString = taskData.dueDate.split('T')[0];
      } else {
        dateString = taskData.dueDate;
      }
    } else {
      throw new Error('Formato de fecha no válido');
    }
    
    // dateString ahora es "20251103" (sin desfase de zona horaria)
    // Crear fecha en formato ISO con hora específica (9:00 AM hora local)
    const startDateTime = `${dateString}T09:00:00`;
    const endDateTime = `${dateString}T10:00:00`; // 1 hora después

    const event = {
      summary: taskData.title,
      description: taskData.description || 'Tarea del proyecto Nexus',
      start: {
        dateTime: startDateTime,
        timeZone: 'America/Mexico_City',
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'America/Mexico_City',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 día antes
          { method: 'popup', minutes: 60 }, // 1 hora antes
          { method: 'popup', minutes: 10 }, // 10 minutos antes
        ],
      },
      colorId: getPriorityColor(taskData.priority),
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });

    return {
      success: true,
      eventId: response.data.id,
      eventLink: response.data.htmlLink,
    };
  } catch (error) {
    console.error('Error creando evento en Calendar:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Actualizar evento en Google Calendar
export const updateCalendarEvent = async (user, eventId, taskData) => {
  try {
    if (!user.googleAccessToken || !eventId) {
      return { success: false, error: 'No hay evento de Calendar para actualizar' };
    }

    const calendar = createCalendarClient(user.googleAccessToken, user.googleRefreshToken);

    // Extraer la fecha sin conversión de zona horaria
    let dateString;
    
    // Si dueDate es un objeto Date, convertirlo a string en UTC
    if (taskData.dueDate instanceof Date) {
      const utcYear = taskData.dueDate.getUTCFullYear();
      const utcMonth = String(taskData.dueDate.getUTCMonth() + 1).padStart(2, '0');
      const utcDay = String(taskData.dueDate.getUTCDate()).padStart(2, '0');
      dateString = `${utcYear}${utcMonth}${utcDay}`;
    } else if (typeof taskData.dueDate === 'string') {
      // Si es string, extraer solo la parte de la fecha
      if (taskData.dueDate.includes('T')) {
        dateString = taskData.dueDate.split('T')[0];
      } else {
        dateString = taskData.dueDate;
      }
    } else {
      throw new Error('Formato de fecha no válido');
    }
    
    // Crear fecha en formato ISO con hora específica (9:00 AM hora local)
    const startDateTime = `${dateString}T09:00:00`;
    const endDateTime = `${dateString}T10:00:00`; // 1 hora después

    const event = {
      summary: taskData.title,
      description: taskData.description || 'Tarea del proyecto Nexus',
      start: {
        dateTime: startDateTime,
        timeZone: 'America/Mexico_City',
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'America/Mexico_City',
      },
      colorId: getPriorityColor(taskData.priority),
    };

    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      resource: event,
    });

    return {
      success: true,
      eventLink: response.data.htmlLink,
    };
  } catch (error) {
    console.error('Error actualizando evento en Calendar:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Eliminar evento de Google Calendar
export const deleteCalendarEvent = async (user, eventId) => {
  try {
    if (!user.googleAccessToken || !eventId) {
      return { success: false, error: 'No hay evento de Calendar para eliminar' };
    }

    const calendar = createCalendarClient(user.googleAccessToken, user.googleRefreshToken);

    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error eliminando evento en Calendar:', error);
    
    // Si el evento ya fue eliminado (error 410 o 404), considerarlo como éxito
    if (error.code === 410 || error.code === 404 || 
        error.message.includes('Resource has been deleted') ||
        error.message.includes('Not Found')) {
      console.log('El evento ya fue eliminado de Calendar, continuando...');
      return { success: true };
    }
    
    return {
      success: false,
      error: error.message,
    };
  }
};

// Obtener color según prioridad
const getPriorityColor = (priority) => {
  const colors = {
    baja: '2',    // Verde
    media: '5',   // Amarillo
    alta: '11',   // Rojo
    urgente: '11', // Rojo
  };
  return colors[priority] || '1'; // Azul por defecto
};

// Listar próximos eventos del usuario
export const listUpcomingEvents = async (user, maxResults = 10) => {
  try {
    if (!user.googleAccessToken) {
      throw new Error('Usuario no tiene cuenta de Google vinculada');
    }

    const calendar = createCalendarClient(user.googleAccessToken, user.googleRefreshToken);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return {
      success: true,
      events: response.data.items,
    };
  } catch (error) {
    console.error('Error obteniendo eventos:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

