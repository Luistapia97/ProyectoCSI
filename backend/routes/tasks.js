import express from 'express';
import { protect } from '../middleware/auth.js';
import { isAdmin, hasRole } from '../middleware/roleAuth.js';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import Comment from '../models/Comment.js';
import Notification from '../models/Notification.js';
import uploadTaskAttachment, { uploadToCloudinary, deleteFromCloudinary, cloudinary } from '../config/cloudinaryAttachments.js';
import effortMetricsService from '../services/effortMetricsService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// Zoho Tasks desactivado - API no disponible públicamente
// import { syncTaskToZoho, updateZohoTask, deleteZohoTask, completeZohoTask } from '../middleware/zohoTasksSync.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// @route   POST /api/tasks/test-reminders/24h
// @desc    Ejecutar verificación de recordatorios de 24h manualmente (testing)
// @access  Private
router.post('/test-reminders/24h', protect, async (req, res) => {
  try {
    const reminderService = req.app.get('reminderService');
    if (!reminderService) {
      return res.status(500).json({ message: 'Servicio de recordatorios no disponible' });
    }
    
    await reminderService.testCheck24h();
    res.json({ success: true, message: 'Verificación de 24h ejecutada' });
  } catch (error) {
    console.error('Error en test de recordatorios 24h:', error);
    res.status(500).json({ message: 'Error en verificación', error: error.message });
  }
});

// @route   POST /api/tasks/test-reminders/1h
// @desc    Ejecutar verificación de recordatorios de 1h manualmente (testing)
// @access  Private
router.post('/test-reminders/1h', protect, async (req, res) => {
  try {
    const reminderService = req.app.get('reminderService');
    if (!reminderService) {
      return res.status(500).json({ message: 'Servicio de recordatorios no disponible' });
    }
    
    await reminderService.testCheck1h();
    res.json({ success: true, message: 'Verificación de 1h ejecutada' });
  } catch (error) {
    console.error('Error en test de recordatorios 1h:', error);
    res.status(500).json({ message: 'Error en verificación', error: error.message });
  }
});

// @route   POST /api/tasks/test-reminders/overdue
// @desc    Ejecutar verificación de tareas vencidas manualmente (testing)
// @access  Private
router.post('/test-reminders/overdue', protect, async (req, res) => {
  try {
    const reminderService = req.app.get('reminderService');
    if (!reminderService) {
      return res.status(500).json({ message: 'Servicio de recordatorios no disponible' });
    }
    
    await reminderService.testCheckOverdue();
    res.json({ success: true, message: 'Verificación de tareas vencidas ejecutada' });
  } catch (error) {
    console.error('Error en test de tareas vencidas:', error);
    res.status(500).json({ message: 'Error en verificación', error: error.message });
  }
});

// @route   POST /api/tasks/test-reminders/today
// @desc    Ejecutar verificación de tareas que vencen HOY manualmente (testing)
// @access  Private
router.post('/test-reminders/today', protect, async (req, res) => {
  try {
    const reminderService = req.app.get('reminderService');
    if (!reminderService) {
      return res.status(500).json({ message: 'Servicio de recordatorios no disponible' });
    }
    
    await reminderService.testCheckToday();
    res.json({ success: true, message: 'Verificación de tareas que vencen HOY ejecutada' });
  } catch (error) {
    console.error('Error en test de tareas que vencen hoy:', error);
    res.status(500).json({ message: 'Error en verificación', error: error.message });
  }
});

// @route   GET /api/tasks/user-stats
// @desc    Obtener estadísticas del usuario actual
// @access  Private
router.get('/user-stats', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    // Tareas activas (no completadas, no archivadas)
    const activeTasks = await Task.countDocuments({
      assignedTo: userId,
      completed: false,
      archived: false,
    });

    // Tareas pendientes de validación
    const pendingValidation = await Task.countDocuments({
      assignedTo: userId,
      pendingValidation: true,
      archived: false,
    });

    // Tareas por vencer (próximas 7 días)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);
    
    const tasksDueSoon = await Task.countDocuments({
      assignedTo: userId,
      completed: false,
      archived: false,
      dueDate: {
        $gte: now,
        $lte: sevenDaysFromNow,
      },
    });

    res.json({
      activeTasks,
      pendingValidation,
      tasksDueSoon,
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas del usuario:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
  }
});

// @route   GET /api/tasks/pending-validation
// @desc    Obtener tareas pendientes de validación (solo administradores)
// @access  Private (Admin only)
router.get('/pending-validation', protect, isAdmin, async (req, res) => {
  try {
    const tasks = await Task.find({
      pendingValidation: true,
      archived: false,
    })
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name')
      .sort({ updatedAt: -1 });

    res.json({ success: true, tasks, count: tasks.length });
  } catch (error) {
    console.error('Error obteniendo tareas pendientes:', error);
    res.status(500).json({ message: 'Error al obtener tareas', error: error.message });
  }
});

// @route   GET /api/tasks/project/:projectId
// @desc    Obtener todas las tareas de un proyecto
// @access  Private
router.get('/project/:projectId', protect, async (req, res) => {
  try {
    const tasks = await Task.find({
      project: req.params.projectId,
      archived: false,
    })
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('validatedBy', 'name email avatar')
      .sort({ position: 1 });

    res.json({ success: true, tasks });
  } catch (error) {
    console.error('Error obteniendo tareas:', error);
    res.status(500).json({ message: 'Error al obtener tareas', error: error.message });
  }
});

// @route   GET /api/tasks/project/:projectId/active-by-user
// @desc    Obtener tareas activas y pendientes de validación agrupadas por usuario en un proyecto
// @access  Private
router.get('/project/:projectId/active-by-user', protect, async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    // Tareas activas (no completadas)
    const activeTasks = await Task.find({
      project: req.params.projectId,
      archived: false,
      completed: false,
    })
      .populate('assignedTo', 'name email avatar')
      .select('assignedTo');

    // Tareas pendientes de validación
    const pendingValidationTasks = await Task.find({
      project: req.params.projectId,
      archived: false,
      pendingValidation: true,
    })
      .populate('assignedTo', 'name email avatar')
      .select('assignedTo');

    // Tareas por vencer (próximas 7 días)
    const tasksDueSoon = await Task.find({
      project: req.params.projectId,
      archived: false,
      completed: false,
      dueDate: {
        $gte: now,
        $lte: sevenDaysFromNow,
      },
    })
      .populate('assignedTo', 'name email avatar')
      .select('assignedTo');

    // Agrupar tareas por usuario
    const tasksByUser = {};
    
    // Procesar tareas activas
    activeTasks.forEach(task => {
      task.assignedTo.forEach(user => {
        const userId = user._id.toString();
        if (!tasksByUser[userId]) {
          tasksByUser[userId] = {
            user: {
              _id: user._id,
              name: user.name,
              email: user.email,
              avatar: user.avatar
            },
            activeTasks: 0,
            pendingValidation: 0,
            tasksDueSoon: 0
          };
        }
        tasksByUser[userId].activeTasks++;
      });
    });

    // Procesar tareas pendientes de validación
    pendingValidationTasks.forEach(task => {
      task.assignedTo.forEach(user => {
        const userId = user._id.toString();
        if (!tasksByUser[userId]) {
          tasksByUser[userId] = {
            user: {
              _id: user._id,
              name: user.name,
              email: user.email,
              avatar: user.avatar
            },
            activeTasks: 0,
            pendingValidation: 0,
            tasksDueSoon: 0
          };
        }
        tasksByUser[userId].pendingValidation++;
      });
    });

    // Procesar tareas por vencer
    tasksDueSoon.forEach(task => {
      task.assignedTo.forEach(user => {
        const userId = user._id.toString();
        if (!tasksByUser[userId]) {
          tasksByUser[userId] = {
            user: {
              _id: user._id,
              name: user.name,
              email: user.email,
              avatar: user.avatar
            },
            activeTasks: 0,
            pendingValidation: 0,
            tasksDueSoon: 0
          };
        }
        tasksByUser[userId].tasksDueSoon++;
      });
    });

    // Convertir a array
    const result = Object.values(tasksByUser);

    res.json({ success: true, tasksByUser: result });
  } catch (error) {
    console.error('Error obteniendo tareas activas por usuario:', error);
    res.status(500).json({ message: 'Error al obtener tareas activas', error: error.message });
  }
});

// @route   GET /api/tasks/:id
// @desc    Obtener una tarea especÃ­fica
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('validatedBy', 'name email avatar')
      .populate('project');

    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    res.json({ success: true, task });
  } catch (error) {
    console.error('Error obteniendo tarea:', error);
    res.status(500).json({ message: 'Error al obtener tarea', error: error.message });
  }
});

// @route   POST /api/tasks
// @desc    Crear una nueva tarea
// @access  Private (todos los usuarios)
router.post('/', protect, async (req, res) => {
  try {
    const {
      title,
      description,
      project,
      column,
      assignedTo,
      priority,
      dueDate,
      tags,
      color,
      subtasks,
      effortMetrics,
    } = req.body;

    if (!title || !project) {
      return res.status(400).json({ message: 'Título y proyecto son requeridos' });
    }

    // Verificar acceso al proyecto
    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }

    // Obtener posicion para la nueva tarea
    const tasksInColumn = await Task.countDocuments({ project, column: column || 'Pendiente' });

    // Convertir subtasks del frontend al formato del modelo
    const formattedSubtasks = subtasks && subtasks.length > 0
      ? subtasks.map(st => ({
          title: st.text || st.title,
          completed: st.completed || false
        }))
      : [];

    // Inicializar effortMetrics con valores por defecto si no se proporcionan
    const initialEffortMetrics = effortMetrics || {
      estimatedSize: 'M',
      estimatedHours: 6,
      timeTracking: [],
      blockedBy: 'none',
      actualHours: 0,
      effectiveHours: 0
    };

    const task = await Task.create({
      title,
      description,
      project,
      column: column || 'Pendiente',
      position: tasksInColumn,
      assignedTo: assignedTo || [],
      createdBy: req.user._id,
      priority: priority || 'media',
      dueDate,
      tags: tags || [],
      color,
      subtasks: formattedSubtasks,
      effortMetrics: initialEffortMetrics,
    });

    // Actualizar estadi­sticas del proyecto
    await Project.findByIdAndUpdate(project, {
      $inc: { 'stats.totalTasks': 1 },
    });

    // Agregar usuarios asignados como miembros del proyecto si no estÃ¡n ya
    if (assignedTo && assignedTo.length > 0) {
      for (const userId of assignedTo) {
        const isMember = projectDoc.members.some(
          m => m.user.toString() === userId.toString()
        );
        const isOwner = projectDoc.owner.toString() === userId.toString();

        if (!isMember && !isOwner) {
          console.log(`âž• Agregando usuario ${userId} como miembro del proyecto ${project}`);
          await Project.findByIdAndUpdate(project, {
            $push: {
              members: {
                user: userId,
                role: 'member'
              }
            }
          });
        }
      }
    }

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    // Crear notificaciones para asignados
    if (assignedTo && assignedTo.length > 0) {
      const notifications = assignedTo.map(userId => ({
        user: userId,
        type: 'task_assigned',
        title: 'Nueva tarea asignada',
        message: `${req.user.name} te asignó la tarea: ${title}`,
        relatedTask: task._id,
        relatedProject: project,
        relatedUser: req.user._id,
      }));

      const createdNotifications = await Notification.insertMany(notifications);
      
      // Emitir notificaciones por Socket.IO a cada usuario
      const io = req.app.get('io');
      createdNotifications.forEach(notification => {
        io.to(`user-${notification.user}`).emit('notification', notification);
      });
    }

    // Emitir evento
    const io = req.app.get('io');
    io.to(`project-${project}`).emit('task-created', { task: populatedTask });

    // Responder inmediatamente (Zoho Tasks sync desactivado)
    res.status(201).json({ 
      success: true, 
      task: populatedTask
    });
  } catch (error) {
    console.error('Error creando tarea:', error);
    res.status(500).json({ message: 'Error al crear tarea', error: error.message });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Actualizar una tarea
// @access  Private (Admin puede editar todo, Usuario solo puede actualizar estado/subtareas)
router.put('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    const {
      title,
      description,
      column,
      position,
      assignedTo,
      priority,
      dueDate,
      tags,
      color,
      completed,
      subtasks,
      effortMetrics,
    } = req.body;

    const isAdmin = req.user.role === 'administrador';
    const isAssigned = task.assignedTo && task.assignedTo.some(
      assignee => assignee.toString() === req.user._id.toString()
    );

    // Verificar que el usuario es miembro del proyecto
    const projectDoc = await Project.findById(task.project);
    if (!projectDoc) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }

    const isOwner = projectDoc.owner.toString() === req.user._id.toString();
    const isMember = projectDoc.members.some(
      m => m.user.toString() === req.user._id.toString()
    );

    // Validar permisos: Admin, Owner, Miembro del proyecto o Asignado
    if (!isAdmin && !isOwner && !isMember && !isAssigned) {
      return res.status(403).json({ 
        message: 'No tienes permiso para editar esta tarea' 
      });
    }

    // Variables para tracking de cambios en el calendario
    let changes = {};
    let assignedToChanged = false;
    let oldAssignedTo = [];
    let newUsers = [];

    // Admin y miembros del proyecto pueden editar todo
    if (isAdmin || isOwner || isMember) {
      oldAssignedTo = task.assignedTo || [];
      const oldDueDate = task.dueDate;
      
      if (title) task.title = title;
      if (description !== undefined) task.description = description;
      if (column) task.column = column;
      if (position !== undefined) task.position = position;
      
      // Si se actualiza assignedTo, agregar usuarios como miembros del proyecto
      if (assignedTo) {
        const newAssignedUsers = assignedTo.filter(
          userId => !oldAssignedTo.some(oldId => oldId.toString() === userId.toString())
        );

        if (newAssignedUsers.length > 0) {
          const projectDoc = await Project.findById(task.project);
          
          for (const userId of newAssignedUsers) {
            const isMember = projectDoc.members.some(
              m => m.user.toString() === userId.toString()
            );
            const isOwner = projectDoc.owner.toString() === userId.toString();

            if (!isMember && !isOwner) {
              console.log(`➕ Agregando usuario ${userId} como miembro del proyecto ${task.project}`);
              await Project.findByIdAndUpdate(task.project, {
                $push: {
                  members: {
                    user: userId,
                    role: 'member'
                  }
                }
              });
            }
          }

          // Crear notificaciones para nuevos asignados
          const notifications = newAssignedUsers.map(userId => ({
            user: userId,
            type: 'task_assigned',
            title: 'Nueva tarea asignada',
            message: `${req.user.name} te asignó la tarea: ${task.title}`,
            relatedTask: task._id,
            relatedProject: task.project,
            relatedUser: req.user._id,
          }));

          await Notification.insertMany(notifications);
        }

        // Usuarios removidos de la tarea
        const removedUsers = oldAssignedTo.filter(
          oldId => !assignedTo.some(newId => newId.toString() === oldId.toString())
        );

        // Si hay usuarios removidos, verificar si deben ser removidos del proyecto
        if (removedUsers.length > 0) {
          for (const userId of removedUsers) {
            // Verificar si el usuario tiene otras tareas en el proyecto
            const userIdStr = userId.toString();
            const otherTasks = await Task.countDocuments({
              project: task.project,
              _id: { $ne: task._id }, // Excluir la tarea actual
              assignedTo: userIdStr,
              archived: { $ne: true }
            });

            // NOTA: Se removió la lógica de eliminación automática de miembros sin tareas
            // Los miembros ahora deben ser gestionados manualmente por los administradores
            // Comentado para evitar que se eliminen miembros agregados manualmente
            /*
            if (otherTasks === 0) {
              const projectDoc = await Project.findById(task.project);
              const isOwner = projectDoc.owner.toString() === userIdStr;

              if (!isOwner) {
                console.log(`➖ Removiendo usuario ${userId} del proyecto ${task.project} (sin tareas asignadas)`);
                await Project.findByIdAndUpdate(task.project, {
                  $pull: {
                    members: { user: userId }
                  }
                });
              }
            }
            */
          }
        }

        task.assignedTo = assignedTo;
        
        // Verificar si cambiÃ³ la lista de asignados
        assignedToChanged = JSON.stringify(oldAssignedTo.map(id => id.toString()).sort()) !== 
          JSON.stringify(assignedTo.map(id => id.toString()).sort());
        
        // Identificar nuevos usuarios para sincronizar
        newUsers = assignedTo.filter(
          newId => !oldAssignedTo.some(oldId => oldId.toString() === newId.toString())
        );
      }
      
      if (priority) task.priority = priority;
      if (dueDate !== undefined) task.dueDate = dueDate;
      if (tags) task.tags = tags;
      if (color !== undefined) task.color = color;

      // Actualizar effortMetrics si se proporciona
      if (effortMetrics) {
        if (!task.effortMetrics) {
          task.effortMetrics = {};
        }
        if (effortMetrics.estimatedSize) task.effortMetrics.estimatedSize = effortMetrics.estimatedSize;
        if (effortMetrics.estimatedHours !== undefined) task.effortMetrics.estimatedHours = effortMetrics.estimatedHours;
      }

      // Preparar cambios para actualizar el calendario
      if (title) changes.title = title;
      if (description !== undefined) changes.description = description;
      if (priority) changes.priority = priority;
      if (dueDate !== undefined && (!oldDueDate || new Date(dueDate).getTime() !== new Date(oldDueDate).getTime())) {
        changes.dueDate = dueDate;
      }
    }
    
    // Usuarios pueden actualizar estado y subtareas
    if (subtasks) task.subtasks = subtasks;
    
    if (completed !== undefined) {
      const wasCompleted = task.completed;
      task.completed = completed;
      
      // Actualizar estadÃ­sticas del proyecto
      if (completed && !wasCompleted) {
        await Project.findByIdAndUpdate(task.project, {
          $inc: { 'stats.completedTasks': 1 },
        });
      } else if (!completed && wasCompleted) {
        await Project.findByIdAndUpdate(task.project, {
          $inc: { 'stats.completedTasks': -1 },
        });
      }
    }

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name');

    // Emitir evento
    const io = req.app.get('io');
    io.to(`project-${task.project}`).emit('task-updated', { task: updatedTask });

    // Responder inmediatamente (Zoho Tasks sync desactivado)
    res.json({ success: true, task: updatedTask });
  } catch (error) {
    console.error('Error actualizando tarea:', error);
    res.status(500).json({ message: 'Error al actualizar tarea', error: error.message });
  }
});

// @route   GET /api/tasks/archived/:projectId
// @desc    Obtener tareas archivadas de un proyecto
// @access  Private
router.get('/archived/:projectId', protect, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Verificar que el proyecto existe y el usuario tiene acceso
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }
    
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isMember = project.members.some(m => m.user.toString() === req.user._id.toString());
    const isAdmin = req.user.role === 'administrador';
    
    if (!isOwner && !isMember && !isAdmin) {
      return res.status(403).json({ message: 'No tienes acceso a este proyecto' });
    }
    
    const tasks = await Task.find({ 
      project: projectId, 
      archived: true 
    })
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort({ updatedAt: -1 });
    
    res.json(tasks);
  } catch (error) {
    console.error('Error obteniendo tareas archivadas:', error);
    res.status(500).json({ message: 'Error al obtener tareas archivadas', error: error.message });
  }
});

// @route   PATCH /api/tasks/:id/archive
// @desc    Archivar o desarchivar una tarea
// @access  Private (Assigned user or Admin)
router.patch('/:id/archive', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    const { archived } = req.body;
    task.archived = archived !== undefined ? archived : !task.archived;
    
    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('validatedBy', 'name email avatar')
      .populate('project', 'name');

    // Emitir evento
    const io = req.app.get('io');
    io.to(`project-${task.project}`).emit('task-updated', { task: updatedTask });

    res.json({ 
      success: true, 
      task: updatedTask,
      message: task.archived ? 'Tarea archivada' : 'Tarea desarchivada'
    });
  } catch (error) {
    console.error('Error archivando tarea:', error);
    res.status(500).json({ message: 'Error al archivar tarea', error: error.message });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Eliminar una tarea
// @access  Private (Assigned user or Admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    // Guardar usuarios asignados antes de eliminar
    const assignedUsers = task.assignedTo || [];
    const projectId = task.project;

    // Archivar en lugar de eliminar
    task.archived = true;
    await task.save();

    // Verificar si los usuarios removidos deben ser eliminados del proyecto
    if (assignedUsers.length > 0) {
      for (const userId of assignedUsers) {
        // Verificar si el usuario tiene otras tareas en el proyecto
        const userIdStr = userId.toString();
        const otherTasks = await Task.countDocuments({
          project: projectId,
          _id: { $ne: task._id },
          assignedTo: userIdStr,
          archived: { $ne: true }
        });

        // NOTA: Se removió la lógica de eliminación automática de miembros sin tareas
        // Los miembros ahora deben ser gestionados manualmente por los administradores
        /*
        if (otherTasks === 0) {
          const projectDoc = await Project.findById(projectId);
          if (projectDoc) {
            const isOwner = projectDoc.owner.toString() === userIdStr;

            if (!isOwner) {
              console.log(`➖ Removiendo usuario ${userId} del proyecto ${projectId} (tarea eliminada, sin otras tareas)`);
              await Project.findByIdAndUpdate(projectId, {
                $pull: {
                  members: { user: userId }
                }
              });
            }
          }
        }
        */
      }
    }

    // Emitir evento de actualización para que el dashboard se refresque
    const io = req.app.get('io');
    if (io) {
      io.to(`project-${projectId}`).emit('task-deleted', { 
        taskId: task._id,
        projectId: projectId 
      });
    }

    // Responder inmediatamente (Zoho Tasks sync desactivado)
    res.json({ success: true, message: 'Tarea eliminada exitosamente' });
  } catch (error) {
    console.error('Error eliminando tarea:', error);
    res.status(500).json({ message: 'Error al eliminar tarea', error: error.message });
  }
});

// @route   POST /api/tasks/:id/comments
// @desc    Agregar comentario a una tarea
// @access  Private
router.post('/:id/comments', protect, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'El contenido del comentario es requerido' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    const comment = await Comment.create({
      task: req.params.id,
      user: req.user._id,
      content,
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate('user', 'name email avatar');

    // Emitir evento
    const io = req.app.get('io');
    io.to(`project-${task.project}`).emit('comment-added', { 
      comment: populatedComment,
      taskId: req.params.id,
    });

    res.status(201).json({ success: true, comment: populatedComment });
  } catch (error) {
    console.error('Error creando comentario:', error);
    res.status(500).json({ message: 'Error al crear comentario', error: error.message });
  }
});

// @route   GET /api/tasks/:id/comments
// @desc    Obtener comentarios de una tarea
// @access  Private
router.get('/:id/comments', protect, async (req, res) => {
  try {
    const comments = await Comment.find({ task: req.params.id })
      .populate('user', 'name email avatar')
      .sort({ createdAt: 1 });

    res.json({ success: true, comments });
  } catch (error) {
    console.error('Error obteniendo comentarios:', error);
    res.status(500).json({ message: 'Error al obtener comentarios', error: error.message });
  }
});

// @route   PUT /api/tasks/:taskId/comments/:commentId
// @desc    Editar un comentario
// @access  Private (solo el autor del comentario)
router.put('/:taskId/comments/:commentId', protect, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'El contenido del comentario es requerido' });
    }

    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comentario no encontrado' });
    }

    // Verificar que el usuario sea el autor del comentario
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No tienes permiso para editar este comentario' });
    }

    // Actualizar comentario
    comment.content = content;
    comment.edited = true;
    comment.editedAt = new Date();
    await comment.save();

    const populatedComment = await Comment.findById(comment._id)
      .populate('user', 'name email avatar');

    // Emitir evento
    const io = req.app.get('io');
    const task = await Task.findById(req.params.taskId);
    io.to(`project-${task.project}`).emit('comment-updated', { 
      comment: populatedComment,
      taskId: req.params.taskId,
    });

    res.json({ success: true, comment: populatedComment });
  } catch (error) {
    console.error('Error editando comentario:', error);
    res.status(500).json({ message: 'Error al editar comentario', error: error.message });
  }
});

// @route   DELETE /api/tasks/:taskId/comments/:commentId
// @desc    Eliminar un comentario
// @access  Private (solo el autor o admin)
router.delete('/:taskId/comments/:commentId', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comentario no encontrado' });
    }

    // Verificar que el usuario sea el autor o admin
    const isAuthor = comment.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'administrador';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: 'No tienes permiso para eliminar este comentario' });
    }

    await Comment.findByIdAndDelete(req.params.commentId);

    // Emitir evento
    const io = req.app.get('io');
    const task = await Task.findById(req.params.taskId);
    io.to(`project-${task.project}`).emit('comment-deleted', { 
      commentId: req.params.commentId,
      taskId: req.params.taskId,
    });

    res.json({ success: true, message: 'Comentario eliminado' });
  } catch (error) {
    console.error('Error eliminando comentario:', error);
    res.status(500).json({ message: 'Error al eliminar comentario', error: error.message });
  }
});

// @route   POST /api/tasks/reorder
// @desc    Reordenar tareas (drag & drop)
// @access  Private
router.post('/reorder', protect, async (req, res) => {
  try {
    const { taskId, sourceColumn, destColumn, sourceIndex, destIndex } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    if (sourceColumn === destColumn) {
      // Mismo columna - solo reordenar
      const tasks = await Task.find({ 
        project: task.project, 
        column: sourceColumn,
        archived: false,
      }).sort({ position: 1 });

      tasks.splice(sourceIndex, 1);
      tasks.splice(destIndex, 0, task);

      // Actualizar posiciones
      for (let i = 0; i < tasks.length; i++) {
        tasks[i].position = i;
        await tasks[i].save();
      }
    } else {
      // Diferente columna - mover y reordenar
      task.column = destColumn;
      
      // Actualizar posiciones en columna origen
      const sourceTasks = await Task.find({
        project: task.project,
        column: sourceColumn,
        archived: false,
        _id: { $ne: taskId },
      }).sort({ position: 1 });

      for (let i = 0; i < sourceTasks.length; i++) {
        sourceTasks[i].position = i;
        await sourceTasks[i].save();
      }

      // Actualizar posiciones en columna destino
      const destTasks = await Task.find({
        project: task.project,
        column: destColumn,
        archived: false,
      }).sort({ position: 1 });

      destTasks.splice(destIndex, 0, task);

      for (let i = 0; i < destTasks.length; i++) {
        destTasks[i].position = i;
        await destTasks[i].save();
      }
    }

    const updatedTask = await Task.findById(taskId)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    // Emitir evento
    const io = req.app.get('io');
    io.to(`project-${task.project}`).emit('task-moved', { 
      task: updatedTask,
      sourceColumn,
      destColumn,
    });

    res.json({ success: true, task: updatedTask });
  } catch (error) {
    console.error('Error reordenando tarea:', error);
    res.status(500).json({ message: 'Error al reordenar tarea', error: error.message });
  }
});

// @route   POST /api/tasks/:id/request-validation
// @desc    Solicitar validación de tarea (usuario marca como lista para validar)
// @access  Private
router.post('/:id/request-validation', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    // Verificar que el usuario estÃ© asignado a la tarea
    const isAssigned = task.assignedTo && task.assignedTo.some(
      userId => userId.toString() === req.user._id.toString()
    );

    if (!isAssigned && req.user.role !== 'administrador') {
      return res.status(403).json({ 
        message: 'Solo los usuarios asignados pueden solicitar validación' 
      });
    }

    // Cambiar estado a pendiente de validación
    task.pendingValidation = true;
    task.completed = false;
    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    // Crear notificaciones para administradores
    const Project = await import('../models/Project.js').then(m => m.default);
    const User = await import('../models/User.js').then(m => m.default);
    const project = await Project.findById(task.project);
    const admins = await User.find({ role: 'administrador' });

    const notifications = admins.map(admin => ({
      user: admin._id,
      type: 'task_validation_requested',
      title: 'Tarea pendiente de validación',
      message: `${req.user.name} solicita validación para: ${task.title}`,
      relatedTask: task._id,
      relatedProject: project._id,
      relatedUser: req.user._id,
    }));

    await Notification.insertMany(notifications);

    // Emitir evento
    const io = req.app.get('io');
    io.to(`project-${task.project}`).emit('task-validation-requested', { task: updatedTask });

    res.json({ 
      success: true, 
      task: updatedTask,
      message: 'Validación solicitada exitosamente'
    });
  } catch (error) {
    console.error('Error solicitando validación:', error);
    res.status(500).json({ message: 'Error al solicitar validación', error: error.message });
  }
});

// @route   POST /api/tasks/:id/validate
// @desc    Validar y completar tarea (solo administradores)
// @access  Private (Admin only)
router.post('/:id/validate', protect, isAdmin, async (req, res) => {
  try {
    const { approved, comment } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    if (!task.pendingValidation) {
      return res.status(400).json({ 
        message: 'Esta tarea no está pendiente de validación' 
      });
    }

    if (approved) {
      // Aprobar tarea
      task.completed = true;
      task.completedAt = new Date();
      task.pendingValidation = false;
      task.validatedBy = req.user._id;
      task.validatedAt = new Date();
      if (comment) task.validationComment = comment;

      // Actualizar estadísticas del proyecto
      await Project.findByIdAndUpdate(task.project, {
        $inc: { 'stats.completedTasks': 1 },
      });

      // Crear notificación para usuarios asignados
      if (task.assignedTo && task.assignedTo.length > 0) {
        const notifications = task.assignedTo.map(userId => ({
          user: userId,
          type: 'task_validation_approved',
          title: 'Tarea validada',
          message: `${req.user.name} validó la tarea: ${task.title}`,
          relatedTask: task._id,
          relatedProject: task.project,
          relatedUser: req.user._id,
        }));

        await Notification.insertMany(notifications);
      }
    } else {
      // Rechazar validación
      task.pendingValidation = false;
      task.completed = false;
      if (comment) task.validationComment = comment;

      // Crear notificación para usuarios asignados
      if (task.assignedTo && task.assignedTo.length > 0) {
        const notifications = task.assignedTo.map(userId => ({
          user: userId,
          type: 'task_validation_rejected',
          title: 'Validación rechazada',
          message: `${req.user.name} rechazó la validación de: ${task.title}`,
          relatedTask: task._id,
          relatedProject: task.project,
          relatedUser: req.user._id,
        }));

        await Notification.insertMany(notifications);
      }
    }

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('validatedBy', 'name email avatar');

    // Emitir evento
    const io = req.app.get('io');
    io.to(`project-${task.project}`).emit('task-validated', { 
      task: updatedTask,
      approved,
    });

    res.json({ 
      success: true, 
      task: updatedTask,
      message: approved ? 'Tarea validada exitosamente' : 'Validación rechazada'
    });
  } catch (error) {
    console.error('Error validando tarea:', error);
    res.status(500).json({ message: 'Error al validar tarea', error: error.message });
  }
});

// @route   POST /api/tasks/:id/remind
// @desc    Enviar recordatorio manual de una tarea
// @access  Private
router.post('/:id/remind', protect, async (req, res) => {
  try {
    const reminderService = req.app.get('reminderService');
    
    if (!reminderService) {
      return res.status(500).json({ message: 'Servicio de recordatorios no disponible' });
    }

    const result = await reminderService.sendManualReminder(req.params.id);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Recordatorio enviado exitosamente',
        notifications: result.notifications
      });
    } else {
      res.status(400).json({ success: false, message: result.error });
    }
  } catch (error) {
    console.error('Error enviando recordatorio:', error);
    res.status(500).json({ message: 'Error al enviar recordatorio', error: error.message });
  }
});

// @route   POST /api/tasks/:id/attachments
// @desc    Subir archivo adjunto a una tarea (Cloudinary)
// @access  Private
router.post('/:id/attachments', protect, uploadTaskAttachment.single('file'), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    // Verificar que el usuario tenga acceso al proyecto
    const project = await Project.findById(task.project);
    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }

    const isMember = project.members.some(m => m.user && m.user.toString() === req.user._id.toString());
    const isCreator = project.createdBy && project.createdBy.toString() === req.user._id.toString();

    if (!isMember && !isCreator) {
      return res.status(403).json({ message: 'No tienes acceso a este proyecto' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No se ha subido ningún archivo' });
    }

    // Subir a Cloudinary
    const result = await uploadToCloudinary(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    // Crear objeto de archivo adjunto
    const attachment = {
      filename: result.public_id,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: result.public_url || result.secure_url, // Usar URL pública si está disponible
      cloudinaryId: result.public_id,
      uploadedBy: req.user._id,
      uploadedAt: new Date(),
    };

    // Agregar archivo adjunto a la tarea
    task.attachments.push(attachment);
    await task.save();

    // Poblar información del usuario que subió el archivo
    await task.populate('attachments.uploadedBy', 'name email');

    res.status(201).json({
      message: 'Archivo subido exitosamente',
      attachment: task.attachments[task.attachments.length - 1],
    });
  } catch (error) {
    console.error('Error subiendo archivo:', error);
    res.status(500).json({ message: 'Error al subir archivo', error: error.message });
  }
});

// @route   DELETE /api/tasks/:taskId/attachments/:attachmentId
// @desc    Eliminar archivo adjunto de una tarea
// @access  Private
router.delete('/:taskId/attachments/:attachmentId', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    // Verificar que el usuario tenga acceso al proyecto
    const project = await Project.findById(task.project);
    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }

    const isMember = project.members.some(m => m.user && m.user.toString() === req.user._id.toString());
    const isCreator = project.createdBy && project.createdBy.toString() === req.user._id.toString();

    if (!isMember && !isCreator) {
      return res.status(403).json({ message: 'No tienes acceso a este proyecto' });
    }

    // Buscar el archivo adjunto
    const attachment = task.attachments.id(req.params.attachmentId);

    if (!attachment) {
      return res.status(404).json({ message: 'Archivo adjunto no encontrado' });
    }

    // Verificar que el usuario sea quien subió el archivo o sea admin/creador del proyecto
    const isUploader = attachment.uploadedBy && attachment.uploadedBy.toString() === req.user._id.toString();
    if (!isUploader && !isCreator) {
      return res.status(403).json({ message: 'No tienes permiso para eliminar este archivo' });
    }

    // Eliminar archivo de Cloudinary
    if (attachment.cloudinaryId) {
      try {
        await deleteFromCloudinary(attachment.cloudinaryId);
      } catch (error) {
        console.error('Error eliminando archivo de Cloudinary:', error.message);
        // Continuar aunque falle la eliminación en Cloudinary
      }
    }

    // Eliminar del array de attachments
    task.attachments.pull(req.params.attachmentId);
    await task.save();

    res.json({ message: 'Archivo eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando archivo:', error);
    res.status(500).json({ message: 'Error al eliminar archivo', error: error.message });
  }
});

// @route   GET /api/tasks/attachment-proxy/:cloudinaryId
// @desc    Proxy para servir archivos de Cloudinary
// @access  Private (pero acepta token por query)
router.get('/attachment-proxy/:cloudinaryId', async (req, res) => {
  try {
    // Aceptar token desde query params para PDFs que se abren en nueva pestaña
    const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No autorizado, sin token' });
    }

    // Verificar token manualmente
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
    
    const { cloudinaryId } = req.params;
    
    // Usar el SDK de Cloudinary para generar URLs privadas con autenticación
    const privateUrl = cloudinary.utils.private_download_url(
      cloudinaryId,
      'pdf',
      {
        resource_type: 'raw',
        attachment: false
      }
    );
    
    // Hacer fetch del archivo usando la URL autenticada
    const response = await fetch(privateUrl);
    
    if (!response.ok) {
      console.error('Error al obtener archivo de Cloudinary, status:', response.status);
      return res.status(404).json({ message: 'Archivo no encontrado' });
    }
    
    // Copiar headers importantes
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    
    // Stream el contenido
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Error en proxy de archivo:', error.message);
    res.status(500).json({ message: 'Error al obtener archivo', error: error.message });
  }
});

// @route   GET /api/tasks/attachment-url/:cloudinaryId
// @desc    Generar URL firmada para archivo de Cloudinary
// @access  Private
router.get('/attachment-url/:cloudinaryId', protect, async (req, res) => {
  try {
    const { cloudinaryId } = req.params;
    
    // Generar URL firmada válida por 4 horas
    const timestamp = Math.round(Date.now() / 1000) + (4 * 60 * 60);
    
    const signedUrl = cloudinary.url(cloudinaryId, {
      resource_type: 'raw',
      secure: true,
      type: 'authenticated',
      sign_url: true,
      expires_at: timestamp
    });
    
    res.json({ url: signedUrl });
  } catch (error) {
    console.error('Error generando URL:', error);
    res.status(500).json({ message: 'Error al generar URL', error: error.message });
  }
});

// ============================================
// ENDPOINTS DE MÉTRICAS DE ESFUERZO
// ============================================

// @route   POST /api/tasks/:id/time-tracking/start
// @desc    Iniciar timer de seguimiento de tiempo
// @access  Private
router.post('/:id/time-tracking/start', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');
    
    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }
    
    // Verificar que el usuario esté asignado a la tarea O sea miembro del proyecto
    const isAssigned = task.assignedTo.some(user => user.toString() === req.user._id.toString());
    const isMember = task.project?.members?.some(member => 
      member.user.toString() === req.user._id.toString()
    );
    
    if (!isAssigned && !isMember) {
      return res.status(403).json({ message: 'No tienes permisos para trackear tiempo en esta tarea' });
    }
    
    // Verificar si ya hay un timer activo para este usuario
    if (task.effortMetrics?.activeTimer?.isActive && 
        task.effortMetrics.activeTimer.userId?.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Ya tienes un timer activo en esta tarea' });
    }
    
    // Inicializar effortMetrics si no existe
    if (!task.effortMetrics) {
      task.effortMetrics = {
        estimatedSize: 'M',
        estimatedHours: 6,
        timeTracking: [],
        blockedBy: 'none',
        actualHours: 0,
        effectiveHours: 0
      };
    }
    
    // Iniciar timer
    task.effortMetrics.activeTimer = {
      userId: req.user._id,
      startTime: new Date(),
      isActive: true
    };
    
    await task.save();
    
    res.json({
      message: 'Timer iniciado',
      timer: task.effortMetrics.activeTimer
    });
  } catch (error) {
    console.error('Error iniciando timer:', error);
    res.status(500).json({ message: 'Error al iniciar timer', error: error.message });
  }
});

// @route   POST /api/tasks/:id/time-tracking/stop
// @desc    Detener timer y guardar sesión
// @access  Private
router.post('/:id/time-tracking/stop', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }
    
    // Verificar que hay un timer activo para este usuario
    if (!task.effortMetrics?.activeTimer?.isActive || 
        task.effortMetrics.activeTimer.userId?.toString() !== req.user._id.toString()) {
      return res.status(400).json({ message: 'No tienes un timer activo en esta tarea' });
    }
    
    const { note } = req.body;
    const now = new Date();
    const startTime = task.effortMetrics.activeTimer.startTime;
    const duration = Math.floor((now - startTime) / 60000); // Minutos
    
    // Sanitizar la nota para evitar problemas con caracteres especiales
    const sanitizedNote = note ? note.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim() : '';
    
    // Guardar sesión de tracking
    task.effortMetrics.timeTracking.push({
      userId: req.user._id,
      startTime,
      endTime: now,
      duration,
      method: 'timer',
      note: sanitizedNote,
      createdAt: now
    });
    
    // Desactivar timer
    task.effortMetrics.activeTimer.isActive = false;
    
    await task.save();
    
    res.json({
      message: 'Timer detenido y sesión guardada',
      session: {
        duration,
        hours: Number((duration / 60).toFixed(2))
      },
      totalActualHours: task.effortMetrics.actualHours
    });
  } catch (error) {
    console.error('Error deteniendo timer:', error);
    res.status(500).json({ message: 'Error al detener timer', error: error.message });
  }
});

// @route   POST /api/tasks/:id/time-tracking/add-session
// @desc    Agregar sesión de tiempo manualmente
// @access  Private
router.post('/:id/time-tracking/add-session', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }
    
    const isAssigned = task.assignedTo.some(user => user.toString() === req.user._id.toString());
    if (!isAssigned) {
      return res.status(403).json({ message: 'No estás asignado a esta tarea' });
    }
    
    const { startTime, endTime, duration, note } = req.body;
    
    // Validar datos
    if (!duration || duration <= 0) {
      return res.status(400).json({ message: 'Duración inválida' });
    }
    
    // Sanitizar la nota para evitar problemas con caracteres especiales
    const sanitizedNote = note ? note.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim() : '';
    
    // Inicializar effortMetrics si no existe
    if (!task.effortMetrics) {
      task.effortMetrics = {
        estimatedSize: 'M',
        estimatedHours: 6,
        timeTracking: [],
        blockedBy: 'none',
        actualHours: 0,
        effectiveHours: 0
      };
    }
    
    // Agregar sesión
    task.effortMetrics.timeTracking.push({
      userId: req.user._id,
      startTime: startTime ? new Date(startTime) : new Date(),
      endTime: endTime ? new Date(endTime) : new Date(),
      duration, // en minutos
      method: 'manual',
      note: sanitizedNote,
      createdAt: new Date()
    });
    
    await task.save();
    
    res.json({
      message: 'Sesión agregada',
      totalActualHours: task.effortMetrics.actualHours
    });
  } catch (error) {
    console.error('Error agregando sesión:', error);
    res.status(500).json({ message: 'Error al agregar sesión', error: error.message });
  }
});

// @route   POST /api/tasks/:id/block
// @desc    Marcar tarea como bloqueada
// @access  Private
router.post('/:id/block', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }
    
    const isAssigned = task.assignedTo.some(user => user.toString() === req.user._id.toString());
    if (!isAssigned) {
      return res.status(403).json({ message: 'No estás asignado a esta tarea' });
    }
    
    const { blockedBy, reason } = req.body;
    
    if (!['external', 'dependency', 'approval', 'information'].includes(blockedBy)) {
      return res.status(400).json({ message: 'Tipo de bloqueo inválido' });
    }
    
    // Inicializar effortMetrics si no existe
    if (!task.effortMetrics) {
      task.effortMetrics = {
        estimatedSize: 'M',
        estimatedHours: 6,
        timeTracking: [],
        blockedBy: 'none',
        actualHours: 0,
        effectiveHours: 0,
        blockHistory: []
      };
    }
    
    // Inicializar blockHistory si no existe
    if (!task.effortMetrics.blockHistory) {
      task.effortMetrics.blockHistory = [];
    }
    
    task.effortMetrics.blockedBy = blockedBy;
    task.effortMetrics.blockedSince = new Date();
    task.effortMetrics.blockedReason = reason || '';
    task.effortMetrics.blockedUntil = null; // Limpiar blockedUntil cuando se bloquea
    
    await task.save();
    
    res.json({
      message: 'Tarea marcada como bloqueada',
      effortMetrics: task.effortMetrics
    });
  } catch (error) {
    console.error('Error bloqueando tarea:', error);
    res.status(500).json({ message: 'Error al bloquear tarea', error: error.message });
  }
});

// @route   POST /api/tasks/:id/unblock
// @desc    Desbloquear tarea
// @access  Private
router.post('/:id/unblock', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }
    
    if (!task.effortMetrics || task.effortMetrics.blockedBy === 'none') {
      return res.status(400).json({ message: 'La tarea no está bloqueada' });
    }
    
    const blockedUntil = new Date();
    const blockedSince = task.effortMetrics.blockedSince;
    const duration = (blockedUntil - blockedSince) / (1000 * 60 * 60); // horas
    
    // Inicializar blockHistory si no existe
    if (!task.effortMetrics.blockHistory) {
      task.effortMetrics.blockHistory = [];
    }
    
    // Agregar al historial de bloqueos
    task.effortMetrics.blockHistory.push({
      blockedBy: task.effortMetrics.blockedBy,
      reason: task.effortMetrics.blockedReason || 'Sin especificar',
      blockedSince: blockedSince,
      blockedUntil: blockedUntil,
      duration: duration
    });
    
    task.effortMetrics.blockedUntil = blockedUntil;
    task.effortMetrics.blockedBy = 'none';
    
    // Si el bloqueo fue de más de 24 horas (1 día), extender la fecha límite
    if (duration >= 24 && task.dueDate) {
      const daysBlocked = Math.ceil(duration / 24);
      const currentDueDate = new Date(task.dueDate);
      currentDueDate.setDate(currentDueDate.getDate() + daysBlocked);
      task.dueDate = currentDueDate;
      console.log(`📅 Fecha límite extendida por ${daysBlocked} día(s) debido a bloqueo de ${duration.toFixed(2)}h`);
    }
    
    await task.save();
    
    // Calcular si se extendi\u00f3 la fecha
    const daysBlocked = duration >= 24 ? Math.ceil(duration / 24) : 0;
    const dateExtended = daysBlocked > 0 && task.dueDate;
    
    res.json({
      message: dateExtended 
        ? `Tarea desbloqueada. Fecha l\u00edmite extendida por ${daysBlocked} d\u00eda(s)` 
        : 'Tarea desbloqueada',
      blockedHours: task.effortMetrics.blockedHours,
      duration: duration,
      dateExtended,
      daysExtended: daysBlocked,
      newDueDate: task.dueDate
    });
  } catch (error) {
    console.error('Error desbloqueando tarea:', error);
    res.status(500).json({ message: 'Error al desbloquear tarea', error: error.message });
  }
});

// @route   GET /api/tasks/:id/metrics
// @desc    Obtener métricas de una tarea
// @access  Private
router.get('/:id/metrics', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('project', 'name');
    
    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }
    
    const efficiency = effortMetricsService.calculateTaskEfficiency(task);
    
    res.json({
      task: {
        id: task._id,
        title: task.title,
        project: task.project,
        assignedTo: task.assignedTo
      },
      effortMetrics: task.effortMetrics,
      efficiency,
      summary: {
        estimated: task.effortMetrics?.estimatedHours || 0,
        actual: task.effortMetrics?.actualHours || 0,
        blocked: task.effortMetrics?.blockedHours || 0,
        effective: task.effortMetrics?.effectiveHours || 0,
        efficiency
      }
    });
  } catch (error) {
    console.error('Error obteniendo métricas:', error);
    res.status(500).json({ message: 'Error al obtener métricas', error: error.message });
  }
});

// @route   GET /api/tasks/metrics/user/:userId
// @desc    Obtener reporte de métricas de usuario
// @access  Private
router.get('/metrics/user/:userId', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Se requieren fechas de inicio y fin' });
    }
    
    const report = await effortMetricsService.generateUserReport(
      req.params.userId,
      new Date(startDate),
      new Date(endDate)
    );
    
    res.json(report);
  } catch (error) {
    console.error('Error generando reporte de usuario:', error);
    res.status(500).json({ message: 'Error al generar reporte', error: error.message });
  }
});

// @route   GET /api/tasks/metrics/project/:projectId
// @desc    Obtener métricas de proyecto
// @access  Private
router.get('/metrics/project/:projectId', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Se requieren fechas de inicio y fin' });
    }
    
    const report = await effortMetricsService.generateProjectReport(
      req.params.projectId,
      new Date(startDate),
      new Date(endDate)
    );
    
    res.json(report);
  } catch (error) {
    console.error('Error generando reporte de proyecto:', error);
    res.status(500).json({ message: 'Error al generar reporte', error: error.message });
  }
});

export default router;

