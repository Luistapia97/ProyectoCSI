import axios from 'axios';

/**
 * Servicio para sincronizar tareas con Zoho Tasks (Zoho Mail)
 * 
 * Zoho Tasks es parte de Zoho Mail y permite crear tareas directamente
 * en el sistema de tareas de Zoho, visible en mail.zoho.com
 * 
 * API Docs: https://www.zoho.com/mail/help/api/
 */
class ZohoTasksService {
  constructor(accessToken, userEmail) {
    this.accessToken = accessToken;
    this.userEmail = userEmail;
    // Usar el endpoint correcto de Zoho Tasks
    // Zoho Tasks puede estar en diferentes URLs según la región
    this.baseURL = 'https://tasks.zoho.com/api/v1';
    // Alternativa: usar accountid en lugar de email
    this.accountId = null;
  }

  /**
   * Crear una tarea en Zoho Tasks
   * @param {Object} taskData  Datos de la tarea
   * @param {string} taskData.title  Título de la tarea
   * @param {string} taskData.description  Descripción
   * @param {Date} taskData.dueDate  Fecha de vencimiento
   * @param {string} taskData.priority  Prioridad (low, medium, high, urgent)
   * @param {string} taskData.taskId  ID interno de Nexus
   * @returns {Object}  Resultado con ID de la tarea en Zoho
   */
  async createTask({ title, description, dueDate, priority, taskId }) {
    try {
      console.log('📋 Creando tarea en Zoho Tasks...');
      console.log(`   Título: ${title}`);
      console.log(`   Usuario: ${this.userEmail}`);

      // Mapear prioridad de Nexus a Zoho
      const priorityMap = {
        low: 1,
        medium: 2,
        high: 3,
        urgent: 3
      };

      // Preparar la fecha de vencimiento
      let dueDateTimestamp = null;
      if (dueDate) {
        dueDateTimestamp = new Date(dueDate).getTime();
      }

      // Payload para Zoho Tasks API
      const payload = {
        subject: title,
        notes: description || '',
        priority: priorityMap[priority] || 2,
        status: 'notstarted',
        percentcomplete: 0,
      };

      // Agregar fecha de vencimiento si existe
      if (dueDateTimestamp) {
        payload.duedate = dueDateTimestamp;
      }

      // Agregar referencia a Nexus en las notas
      if (taskId) {
        payload.notes += `\n\n[Nexus Task ID: ${taskId}]`;
      }

      console.log('   Payload:', JSON.stringify(payload, null, 2));

      // Realizar petición a Zoho Tasks API v1
      // Primero intentamos con el endpoint de tasklists
      const response = await axios.post(
        `${this.baseURL}/tasks`,
        {
          name: title,
          description: payload.notes,
          priority: payload.priority,
          status: payload.status,
          ...(dueDateTimestamp && { due_date: new Date(dueDateTimestamp).toISOString() })
        },
        {
          headers: {
            'Authorization': `Zohooauthtoken ${this.accessToken}`,
            'ContentType': 'application/json',
          },
        }
      );

      console.log('✅ Tarea creada en Zoho Tasks');
      console.log('   Zoho Task ID:', response.data.data?.taskid);

      return {
        success: true,
        zohoTaskId: response.data.data?.taskid || response.data.data?.id,
        data: response.data,
      };
    } catch (error) {
      console.error('❌ Error creando tarea en Zoho Tasks');
      console.error('   Status:', error.response?.status);
      console.error('   Error:', error.response?.data || error.message);

      // Manejar errores específicos
      if (error.response?.status === 401) {
        return {
          success: false,
          error: 'Token de Zoho expirado',
          needsReauth: true,
        };
      }

      if (error.response?.data?.data?.errorCode === 'URL_RULE_NOT_CONFIGURED') {
        return {
          success: false,
          error: 'Zoho Tasks API no está habilitada. Necesitas habilitar el scope ZohoMail.tasks.ALL',
          needsScope: true,
        };
      }

      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Actualizar una tarea en Zoho Tasks
   * @param {string} zohoTaskId  ID de la tarea en Zoho
   * @param {Object} updates  Datos a actualizar
   * @returns {Object}  Resultado de la operación
   */
  async updateTask(zohoTaskId, { title, description, dueDate, priority, completed }) {
    try {
      console.log('📝 Actualizando tarea en Zoho Tasks...');
      console.log(`   Zoho Task ID: ${zohoTaskId}`);

      const payload = {};

      if (title) payload.subject = title;
      if (description !== undefined) payload.notes = description;
      if (dueDate) payload.duedate = new Date(dueDate).getTime();
      
      if (priority) {
        const priorityMap = { low: 1, medium: 2, high: 3, urgent: 3 };
        payload.priority = priorityMap[priority] || 2;
      }

      if (completed !== undefined) {
        payload.status = completed ? 'completed' : 'notstarted';
        payload.percentcomplete = completed ? 100 : 0;
      }

      const response = await axios.put(
        `${this.baseURL}/${this.userEmail}/tasks/${zohoTaskId}`,
        payload,
        {
          headers: {
            'Authorization': `Zohooauthtoken ${this.accessToken}`,
            'ContentType': 'application/json',
          },
        }
      );

      console.log('✅ Tarea actualizada en Zoho Tasks');

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('❌ Error actualizando tarea en Zoho Tasks:', error.response?.data || error.message);

      if (error.response?.status === 401) {
        return {
          success: false,
          error: 'Token de Zoho expirado',
          needsReauth: true,
        };
      }

      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Eliminar una tarea de Zoho Tasks
   * @param {string} zohoTaskId  ID de la tarea en Zoho
   * @returns {Object}  Resultado de la operación
   */
  async deleteTask(zohoTaskId) {
    try {
      console.log('🗑️ Eliminando tarea de Zoho Tasks...');
      console.log(`   Zoho Task ID: ${zohoTaskId}`);

      await axios.delete(
        `${this.baseURL}/${this.userEmail}/tasks/${zohoTaskId}`,
        {
          headers: {
            'Authorization': `Zohooauthtoken ${this.accessToken}`,
          },
        }
      );

      console.log('✅ Tarea eliminada de Zoho Tasks');

      return {
        success: true,
      };
    } catch (error) {
      console.error('❌ Error eliminando tarea de Zoho Tasks:', error.response?.data || error.message);

      // Si la tarea ya no existe, considerarlo éxito
      if (error.response?.status === 404) {
        console.log('⚠️ Tarea no encontrada en Zoho (ya eliminada)');
        return { success: true };
      }

      if (error.response?.status === 401) {
        return {
          success: false,
          error: 'Token de Zoho expirado',
          needsReauth: true,
        };
      }

      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Marcar tarea como completada en Zoho
   * @param {string} zohoTaskId  ID de la tarea en Zoho
   * @returns {Object}  Resultado de la operación
   */
  async completeTask(zohoTaskId) {
    return this.updateTask(zohoTaskId, {
      completed: true,
    });
  }

  /**
   * Obtener todas las tareas de Zoho Tasks
   * @returns {Object}  Lista de tareas
   */
  async getTasks() {
    try {
      const response = await axios.get(
        `${this.baseURL}/${this.userEmail}/tasks`,
        {
          headers: {
            'Authorization': `Zohooauthtoken ${this.accessToken}`,
          },
        }
      );

      return {
        success: true,
        tasks: response.data.data || [],
      };
    } catch (error) {
      console.error('❌ Error obteniendo tareas de Zoho:', error.response?.data || error.message);

      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }
}

export default ZohoTasksService;

