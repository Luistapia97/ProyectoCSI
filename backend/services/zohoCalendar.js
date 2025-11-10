import axios from 'axios';

class ZohoCalendarService {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.apiBase = 'https://calendar.zoho.com/api/v1';
    this.calendarUid = null;
  }

  formatDateForZoho(date) {
    const d = new Date(date);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    const hours = String(d.getUTCHours()).padStart(2, '0');
    const minutes = String(d.getUTCMinutes()).padStart(2, '0');
    const seconds = String(d.getUTCSeconds()).padStart(2, '0');
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  }

  async getCalendarUid() {
    if (this.calendarUid) {
      return this.calendarUid;
    }

    try {
      console.log('Obteniendo lista de calendarios...');
      const response = await axios.get(
        `${this.apiBase}/calendars`,
        {
          headers: {
            'Authorization': `Zoho-oauthtoken ${this.accessToken}`,
          },
        }
      );

      const calendars = response.data.calendars || [];
      if (calendars.length === 0) {
        throw new Error('No se encontraron calendarios en la cuenta');
      }

      const primaryCalendar = calendars.find(cal => cal.isprimary === true) || calendars[0];
      
      this.calendarUid = primaryCalendar.uid;
      console.log(`Calendar UID obtenido: ${this.calendarUid}`);
      return this.calendarUid;
    } catch (error) {
      console.error('Error obteniendo calendar UID:', error.response?.data || error.message);
      throw error;
    }
  }

  async createEvent(eventData) {
    try {
      // Primero obtener el calendar UID
      const calendarUid = await this.getCalendarUid();
      
      const startDate = this.formatDateForZoho(eventData.start);
      const endDate = this.formatDateForZoho(eventData.end);

      console.log('📅 Creando evento:', eventData.title);
      console.log('   Start:', startDate);
      console.log('   End:', endDate);
      console.log('   Calendar UID:', calendarUid);

      // Según documentación oficial: eventdata se envía como QUERY PARAMETER
      const eventdataObject = {
        title: eventData.title,
        description: eventData.description || '',
        dateandtime: {
          start: startDate,
          end: endDate,
          timezone: 'America/Mexico_City'
        },
        location: eventData.location || '',
        isallday: false
      };

      // URL CORRECTA: POST /api/v1/calendars/{calendar_uid}/events
      const url = `${this.apiBase}/calendars/${calendarUid}/events`;
      
      console.log('📍 URL:', url);
      console.log('📤 eventdata (query param):', JSON.stringify(eventdataObject, null, 2));

      // IMPORTANTE: Según la documentación, eventdata va como QUERY PARAMETER
      const response = await axios.post(
        url,
        null, // Body vacío
        {
          params: {
            eventdata: JSON.stringify(eventdataObject) // Como query parameter
          },
          headers: {
            'Authorization': `Zoho-oauthtoken ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ Respuesta exitosa:', JSON.stringify(response.data, null, 2));

      // Extraer el ID del evento de la respuesta
      const eventId = response.data.events?.[0]?.uid || response.data.events?.[0]?.id || response.data.uid || response.data.id;

      return { 
        success: true, 
        event: response.data,
        eventId: eventId
      };
    } catch (error) {
      console.error('❌ Error creando evento en Zoho Calendar:');
      console.error('   Status:', error.response?.status);
      console.error('   Status Text:', error.response?.statusText);
      console.error('   URL completa:', error.config?.url);
      
      // Si la respuesta es HTML, mostrar mensaje más claro
      if (typeof error.response?.data === 'string' && error.response?.data.includes('<html')) {
        console.error('   ❌ Error HTML 404: Page not found');
        console.error('   Posibles causas:');
        console.error('   - calendar_uid inválido o no existe');
        console.error('   - Token sin scope ZohoCalendar.calendar.ALL o ZohoCalendar.event.CREATE');
        console.error('   - Usuario no autenticado o token expirado');
      } else {
        console.error('   Data:', JSON.stringify(error.response?.data, null, 2));
      }
      
      return { 
        success: false, 
        error: error.response?.data || error.message 
      };
    }
  }

  async syncTaskToEvent(task, eventData) {
    if (task.zohoCalendarEventIds && task.zohoCalendarEventIds.length > 0) {
      const eventId = task.zohoCalendarEventIds[0].eventId;
      return await this.updateEvent(eventId, eventData);
    } else {
      return await this.createEvent(eventData);
    }
  }
}

export default ZohoCalendarService;
