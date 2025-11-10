import ZohoTasksService from '../services/zohoTasks.js';
import Task from '../models/Task.js';
import User from '../models/User.js';

/**
 * Middleware para sincronizar automáticamente tareas con Zoho Tasks
 * Se ejecuta después de crear o actualizar una tarea en Nexus
 */

/**
 * Sincronizar tarea con Zoho Tasks después de crearla
 */
export async function syncTaskToZoho(req, res, next) {
  try {
    // Solo continuar si la tarea se guardó correctamente
    if (!res.locals.task) {
      return next();
    }

    const task = res.locals.task;

    console.log('📋 Iniciando sincronización con Zoho Tasks');
    console.log(`   Tarea: ${task.title}`);
    console.log(`   Usuarios asignados: ${task.assignedTo?.length || 0}`);

    // Si no hay usuarios asignados, no hay nada que sincronizar
    if (!task.assignedTo || task.assignedTo.length === 0) {
      console.log('⚠️ No hay usuarios asignados, no se sincronizará con Zoho Tasks');
      return next();
    }

    // Obtener información completa de los usuarios asignados
    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email zohoAccessToken')
      .populate('project', 'name');

    const syncResults = [];

    // Sincronizar con Zoho Tasks para cada usuario asignado
    for (const user of populatedTask.assignedTo) {
      // Verificar si el usuario tiene cuenta de Zoho conectada
      if (!user.zohoAccessToken) {
        console.log(`⚠️ ${user.name} no tiene cuenta de Zoho conectada`);
        syncResults.push({
          userId: user._id,
          success: false,
          reason: 'no_zoho_account',
        });
        continue;
      }

      console.log(`📤 Sincronizando tarea con Zoho Tasks de ${user.email}...`);

      // Crear servicio de Zoho Tasks
      const zohoTasksService = new ZohoTasksService(user.zohoAccessToken, user.email);

      // Preparar datos de la tarea
      const taskData = {
        title: `📋 ${task.title}`,
        description: `${task.description || ''}\n\nProyecto: ${populatedTask.project?.name || 'Sin proyecto'}\n\nSincronizado desde Nexus`,
        dueDate: task.dueDate,
        priority: task.priority,
        taskId: task._id.toString(),
      };

      // Crear tarea en Zoho
      const result = await zohoTasksService.createTask(taskData);

      if (result.success) {
        console.log(`✅ Tarea sincronizada con Zoho Tasks de ${user.email}`);
        console.log(`   Zoho Task ID: ${result.zohoTaskId}`);

        // Guardar el ID de Zoho en la tarea de Nexus
        if (!task.zohoTaskIds) {
          task.zohoTaskIds = [];
        }

        task.zohoTaskIds.push({
          userId: user._id,
          taskId: result.zohoTaskId,
          syncedAt: new Date(),
        });

        syncResults.push({
          userId: user._id,
          success: true,
          zohoTaskId: result.zohoTaskId,
        });
      } else {
        console.log(`❌ Error sincronizando con Zoho Tasks de ${user.email}`);
        console.log(`   Error: ${result.error}`);

        syncResults.push({
          userId: user._id,
          success: false,
          error: result.error,
          needsReauth: result.needsReauth,
        });
      }
    }

    // Guardar los IDs de Zoho en la tarea
    if (syncResults.some(r => r.success)) {
      await task.save();
      console.log('✅ IDs de Zoho Tasks guardados en la tarea');
    }

    // Adjuntar resultados a res.locals para el siguiente middleware
    res.locals.zohoSyncResults = syncResults;

    next();
  } catch (error) {
    console.error('❌ Error en sincronización con Zoho Tasks:', error);
    // No fallar la request si la sincronización falla
    next();
  }
}

/**
 * Actualizar tarea en Zoho Tasks cuando se modifica en Nexus
 */
export async function updateZohoTask(req, res, next) {
  try {
    const task = res.locals.task;

    if (!task || !task.zohoTaskIds || task.zohoTaskIds.length === 0) {
      return next();
    }

    console.log('📝 Actualizando tareas en Zoho Tasks...');

    // Obtener usuarios asignados con sus tokens
    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email zohoAccessToken');

    // Actualizar cada tarea en Zoho
    for (const zohoTaskInfo of task.zohoTaskIds) {
      const user = populatedTask.assignedTo.find(u => u._id.equals(zohoTaskInfo.userId));

      if (!user || !user.zohoAccessToken) {
        console.log(`⚠️ Usuario no encontrado o sin token Zoho para task ID: ${zohoTaskInfo.taskId}`);
        continue;
      }

      console.log(`📤 Actualizando tarea en Zoho de ${user.email}...`);

      const zohoTasksService = new ZohoTasksService(user.zohoAccessToken, user.email);

      const updates = {
        title: `📋 ${task.title}`,
        description: task.description,
        dueDate: task.dueDate,
        priority: task.priority,
        completed: task.completed,
      };

      const result = await zohoTasksService.updateTask(zohoTaskInfo.taskId, updates);

      if (result.success) {
        console.log(`✅ Tarea actualizada en Zoho Tasks de ${user.email}`);
      } else {
        console.log(`❌ Error actualizando tarea en Zoho: ${result.error}`);
      }
    }

    next();
  } catch (error) {
    console.error('❌ Error actualizando tareas en Zoho:', error);
    next();
  }
}

/**
 * Eliminar tarea de Zoho Tasks cuando se elimina en Nexus
 */
export async function deleteZohoTask(req, res, next) {
  try {
    const task = res.locals.task;

    if (!task || !task.zohoTaskIds || task.zohoTaskIds.length === 0) {
      return next();
    }

    console.log('🗑️ Eliminando tareas de Zoho Tasks...');

    // Obtener usuarios asignados
    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email zohoAccessToken');

    // Eliminar de Zoho para cada usuario
    for (const zohoTaskInfo of task.zohoTaskIds) {
      const user = populatedTask.assignedTo.find(u => u._id.equals(zohoTaskInfo.userId));

      if (!user || !user.zohoAccessToken) {
        continue;
      }

      console.log(`📤 Eliminando tarea de Zoho de ${user.email}...`);

      const zohoTasksService = new ZohoTasksService(user.zohoAccessToken, user.email);
      const result = await zohoTasksService.deleteTask(zohoTaskInfo.taskId);

      if (result.success) {
        console.log(`✅ Tarea eliminada de Zoho Tasks de ${user.email}`);
      } else {
        console.log(`❌ Error eliminando tarea de Zoho: ${result.error}`);
      }
    }

    next();
  } catch (error) {
    console.error('❌ Error eliminando tareas de Zoho:', error);
    next();
  }
}

/**
 * Marcar como completada en Zoho cuando se completa en Nexus
 */
export async function completeZohoTask(req, res, next) {
  try {
    const task = res.locals.task;

    // Solo actuar si la tarea se marcó como completada
    if (!task || !task.completed || !task.zohoTaskIds || task.zohoTaskIds.length === 0) {
      return next();
    }

    console.log('✅ Marcando tareas como completadas en Zoho...');

    // Obtener usuarios
    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email zohoAccessToken');

    // Completar en Zoho para cada usuario
    for (const zohoTaskInfo of task.zohoTaskIds) {
      const user = populatedTask.assignedTo.find(u => u._id.equals(zohoTaskInfo.userId));

      if (!user || !user.zohoAccessToken) {
        continue;
      }

      const zohoTasksService = new ZohoTasksService(user.zohoAccessToken, user.email);
      const result = await zohoTasksService.completeTask(zohoTaskInfo.taskId);

      if (result.success) {
        console.log(`✅ Tarea marcada como completada en Zoho de ${user.email}`);
      }
    }

    next();
  } catch (error) {
    console.error('❌ Error completando tareas en Zoho:', error);
    next();
  }
}
