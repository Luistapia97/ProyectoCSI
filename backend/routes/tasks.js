import express from 'express';
import { protect } from '../middleware/auth.js';
import { isAdmin, hasRole } from '../middleware/roleAuth.js';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import Comment from '../models/Comment.js';
import Notification from '../models/Notification.js';
// Zoho Tasks desactivado  API no disponible públicamente
// import { syncTaskToZoho, updateZohoTask, deleteZohoTask, completeZohoTask } from '../middleware/zohoTasksSync.js';

const router = express.Router();

// @route   POST /api/tasks/testreminders/24h
// @desc    Ejecutar verificación de recordatorios de 24h manualmente (testing)
// @access  Private
router.post('/testreminders/24h', protect, async (req, res) => {
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

// @route   POST /api/tasks/testreminders/1h
// @desc    Ejecutar verificación de recordatorios de 1h manualmente (testing)
// @access  Private
router.post('/testreminders/1h', protect, async (req, res) => {
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

// @route   POST /api/tasks/testreminders/overdue
// @desc    Ejecutar verificación de tareas vencidas manualmente (testing)
// @access  Private
router.post('/testreminders/overdue', protect, async (req, res) => {
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

// @route   GET /api/tasks/pendingvalidation
// @desc    Obtener tareas pendientes de validaciÃ³n (solo administradores)
// @access  Private (Admin only)
router.get('/pendingvalidation', protect, isAdmin, async (req, res) => {
  try {
    const tasks = await Task.find({
      pendingValidation: true,
      archived: false,
    })
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name')
      .sort({ updatedAt: 1 });

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
      .sort({ position: 1 });

    res.json({ success: true, tasks });
  } catch (error) {
    console.error('Error obteniendo tareas:', error);
    res.status(500).json({ message: 'Error al obtener tareas', error: error.message });
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
// @desc    Crear una nueva tarea (solo administradores)
// @access  Private (Admin only)
router.post('/', protect, isAdmin, async (req, res) => {
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
    } = req.body;

    if (!title || !project) {
      return res.status(400).json({ message: 'TÃ­tulo y proyecto son requeridos' });
    }

    // Verificar acceso al proyecto
    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }

    // Obtener posiciÃ³n para la nueva tarea
    const tasksInColumn = await Task.countDocuments({ project, column: column || 'Pendiente' });

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
    });

    // Actualizar estadÃ­sticas del proyecto
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
        io.to(`user${notification.user}`).emit('notification', notification);
      });
    }

    // Emitir evento
    const io = req.app.get('io');
    io.to(`project${project}`).emit('taskcreated', { task: populatedTask });

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
    } = req.body;

    const isAdmin = req.user.role === 'administrador';
    const isAssigned = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();

    // Validar permisos
    if (!isAdmin && !isAssigned) {
      return res.status(403).json({ 
        message: 'No tienes permiso para editar esta tarea' 
      });
    }

    // Variables para tracking de cambios en el calendario
    let changes = {};
    let assignedToChanged = false;
    let oldAssignedTo = [];
    let newUsers = [];

    // Admin puede editar todo
    if (isAdmin) {
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
              console.log(`âž• Agregando usuario ${userId} como miembro del proyecto ${task.project}`);
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
            message: `${req.user.name} te asignÃ³ la tarea: ${task.title}`,
            relatedTask: task._id,
            relatedProject: task.project,
            relatedUser: req.user._id,
          }));

          await Notification.insertMany(notifications);
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
          $inc: { 'stats.completedTasks': 1 },
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
    io.to(`project${task.project}`).emit('taskupdated', { task: updatedTask });

    // Responder inmediatamente (Zoho Tasks sync desactivado)
    res.json({ success: true, task: updatedTask });
  } catch (error) {
    console.error('Error actualizando tarea:', error);
    res.status(500).json({ message: 'Error al actualizar tarea', error: error.message });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Eliminar una tarea
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    // Archivar en lugar de eliminar
    task.archived = true;
    await task.save();

    // Actualizar estadÃ­sticas
    await Project.findByIdAndUpdate(task.project, {
      $inc: { 
        'stats.totalTasks': 1,
        'stats.completedTasks': task.completed ? 1 : 0,
      },
    });

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
    io.to(`project${task.project}`).emit('commentadded', { 
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
    io.to(`project${task.project}`).emit('commentupdated', { 
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
    io.to(`project${task.project}`).emit('commentdeleted', { 
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
      // Mismo columna  solo reordenar
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
      // Diferente columna  mover y reordenar
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
    io.to(`project${task.project}`).emit('taskmoved', { 
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

// @route   POST /api/tasks/:id/requestvalidation
// @desc    Solicitar validaciÃ³n de tarea (usuario marca como lista para validar)
// @access  Private
router.post('/:id/requestvalidation', protect, async (req, res) => {
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
        message: 'Solo los usuarios asignados pueden solicitar validaciÃ³n' 
      });
    }

    // Cambiar estado a pendiente de validaciÃ³n
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
      title: 'Tarea pendiente de validaciÃ³n',
      message: `${req.user.name} solicita validaciÃ³n para: ${task.title}`,
      relatedTask: task._id,
      relatedProject: project._id,
      relatedUser: req.user._id,
    }));

    await Notification.insertMany(notifications);

    // Emitir evento
    const io = req.app.get('io');
    io.to(`project${task.project}`).emit('taskvalidationrequested', { task: updatedTask });

    res.json({ 
      success: true, 
      task: updatedTask,
      message: 'ValidaciÃ³n solicitada exitosamente'
    });
  } catch (error) {
    console.error('Error solicitando validaciÃ³n:', error);
    res.status(500).json({ message: 'Error al solicitar validaciÃ³n', error: error.message });
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
        message: 'Esta tarea no estÃ¡ pendiente de validaciÃ³n' 
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

      // Actualizar estadÃ­sticas del proyecto
      await Project.findByIdAndUpdate(task.project, {
        $inc: { 'stats.completedTasks': 1 },
      });

      // Crear notificaciÃ³n para usuarios asignados
      if (task.assignedTo && task.assignedTo.length > 0) {
        const notifications = task.assignedTo.map(userId => ({
          user: userId,
          type: 'task_validated',
          title: 'Tarea validada',
          message: `${req.user.name} validÃ³ la tarea: ${task.title}`,
          relatedTask: task._id,
          relatedProject: task.project,
          relatedUser: req.user._id,
        }));

        await Notification.insertMany(notifications);
      }
    } else {
      // Rechazar validaciÃ³n
      task.pendingValidation = false;
      task.completed = false;
      if (comment) task.validationComment = comment;

      // Crear notificaciÃ³n para usuarios asignados
      if (task.assignedTo && task.assignedTo.length > 0) {
        const notifications = task.assignedTo.map(userId => ({
          user: userId,
          type: 'task_validation_rejected',
          title: 'ValidaciÃ³n rechazada',
          message: `${req.user.name} rechazÃ³ la validaciÃ³n de: ${task.title}`,
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
    io.to(`project${task.project}`).emit('taskvalidated', { 
      task: updatedTask,
      approved,
    });

    res.json({ 
      success: true, 
      task: updatedTask,
      message: approved ? 'Tarea validada exitosamente' : 'ValidaciÃ³n rechazada'
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

export default router;

