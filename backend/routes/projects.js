import express from 'express';
import { protect } from '../middleware/auth.js';
import { isAdmin, hasRole } from '../middleware/roleAuth.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import User from '../models/User.js';

const router = express.Router();

// @route   GET /api/projects
// @desc    Obtener todos los proyectos del usuario
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    console.log('🔍 GET /projects - Usuario:', req.user.email, req.user._id.toString());
    
    // Primero, consultar directamente de la DB SIN populate para ver miembros crudos
    const rawProjects = await Project.find({
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id },
      ],
      archived: false,
      name: 'Plan Marketing' // Solo el proyecto problemático
    }).lean();
    
    if (rawProjects.length > 0) {
      console.log('🔬 DATOS CRUDOS de MongoDB - Plan Marketing members count:', rawProjects[0].members.length);
      console.log('🔬 DATOS CRUDOS de MongoDB - Plan Marketing members:', JSON.stringify(rawProjects[0].members, null, 2));
    }
    
    const projects = await Project.find({
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id },
      ],
      archived: false,
    })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort({ createdAt: -1 });

    // Agregar estadísticas de tareas a cada proyecto
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        // NOTA: Se removió la lógica de limpieza automática de miembros sin tareas
        // Los miembros ahora deben ser gestionados manualmente por los administradores
        
        const tasks = await Task.find({ 
          project: project._id,
          archived: { $ne: true }
        });
        
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.completed).length;
        
        // Calcular progreso basado en columnas (igual que en Board.jsx)
        let totalProgress = 0;
        if (totalTasks > 0) {
          tasks.forEach(task => {
            const columnName = task.column?.toLowerCase() || '';
            let columnProgress = 0;
            
            if (columnName.includes('completad') || columnName.includes('hecho') || columnName === 'done') {
              // En completado: 100% solo si está validada, sino 75%
              columnProgress = (!task.pendingValidation && task.validatedBy) ? 100 : 75;
            } else if (columnName.includes('progreso') || columnName.includes('proceso') || columnName === 'in progress') {
              columnProgress = 50;
            } else if (columnName.includes('pendiente') || columnName.includes('hacer') || columnName === 'to do') {
              columnProgress = 0;
            } else {
              // Fallback: usar estado de completado
              columnProgress = task.completed ? 75 : 0;
            }
            
            totalProgress += columnProgress;
          });
        }
        
        const progressPercentage = totalTasks > 0 ? Math.min(Math.round(totalProgress / totalTasks), 100) : 0;
        
        // Debug: verificar miembros ANTES de toObject()
        if (project.name === 'Plan Marketing') {
          console.log('📊 ANTES toObject - Plan Marketing members count:', project.members.length);
          console.log('📊 ANTES toObject - Plan Marketing members:', JSON.stringify(project.members, null, 2));
        }
        
        const projectObj = {
          ...project.toObject(),
          stats: {
            totalTasks,
            completedTasks,
            progressPercentage,
          },
        };
        
        // Debug: verificar miembros DESPUÉS de toObject()
        if (project.name === 'Plan Marketing') {
          console.log('📊 DESPUÉS toObject - Plan Marketing members:', JSON.stringify(projectObj.members, null, 2));
        }
        
        return projectObj;
      })
    );

    res.json({ success: true, projects: projectsWithStats });
  } catch (error) {
    console.error('Error obteniendo proyectos:', error);
    res.status(500).json({ message: 'Error al obtener proyectos', error: error.message });
  }
});

// @route   GET /api/projects/archived
// @desc    Obtener proyectos archivados del usuario
// @access  Private
router.get('/archived', protect, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id },
      ],
      archived: true,
    })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort({ updatedAt: -1 });

    res.json(projects);
  } catch (error) {
    console.error('Error obteniendo proyectos archivados:', error);
    res.status(500).json({ message: 'Error al obtener proyectos archivados', error: error.message });
  }
});

// @route   GET /api/projects/:id
// @desc    Obtener un proyecto específico
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }

    // Verificar que el usuario tenga acceso
    const hasAccess = 
      project.owner._id.toString() === req.user._id.toString() ||
      project.members.some(m => m.user._id.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({ message: 'No tienes acceso a este proyecto' });
    }

    res.json({ success: true, project });
  } catch (error) {
    console.error('Error obteniendo proyecto:', error);
    res.status(500).json({ message: 'Error al obtener proyecto', error: error.message });
  }
});

// @route   POST /api/projects
// @desc    Crear un nuevo proyecto (solo administradores)
// @access  Private (Admin only)
router.post('/', protect, isAdmin, async (req, res) => {
  try {
    const { name, description, color, tags } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'El nombre del proyecto es requerido' });
    }

    // Crear proyecto con columnas por defecto
    const project = await Project.create({
      name,
      description,
      color: color || '#6366f1',
      tags: tags || [],
      owner: req.user._id,
      members: [
        {
          user: req.user._id,
          role: 'owner',
        },
      ],
      columns: [
        { name: 'Pendiente', order: 0, color: '#94a3b8' },
        { name: 'En progreso', order: 1, color: '#3b82f6' },
        { name: 'Completado', order: 2, color: '#22c55e' },
      ],
    });

    // Agregar proyecto al usuario
    await User.findByIdAndUpdate(req.user._id, {
      $push: { projects: project._id },
    });

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    // Emitir evento de socket
    const io = req.app.get('io');
    io.emit('project-created', { project: populatedProject });

    res.status(201).json({ success: true, project: populatedProject });
  } catch (error) {
    console.error('Error creando proyecto:', error);
    res.status(500).json({ message: 'Error al crear proyecto', error: error.message });
  }
});

// @route   PUT /api/projects/:id
// @desc    Actualizar un proyecto
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }

    // Verificar permisos (owner o admin)
    const member = project.members.find(m => m.user.toString() === req.user._id.toString());
    const isOwner = project.owner.toString() === req.user._id.toString();

    if (!isOwner && (!member || member.role === 'guest')) {
      return res.status(403).json({ message: 'No tienes permisos para editar este proyecto' });
    }

    const { name, description, color, tags, columns } = req.body;

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (color) project.color = color;
    if (tags) project.tags = tags;
    if (columns) project.columns = columns;

    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    // Emitir evento
    const io = req.app.get('io');
    io.to(`project-${project._id}`).emit('project-updated', { project: updatedProject });

    res.json({ success: true, project: updatedProject });
  } catch (error) {
    console.error('Error actualizando proyecto:', error);
    res.status(500).json({ message: 'Error al actualizar proyecto', error: error.message });
  }
});

// @route   DELETE /api/projects/:id
// @desc    Eliminar permanentemente un proyecto
// @access  Private (Admin o Owner)
router.delete('/:id', protect, async (req, res) => {
  try {
    console.log('🗑️ Intentando eliminar proyecto:', req.params.id);
    const project = await Project.findById(req.params.id);

    if (!project) {
      console.log('❌ Proyecto no encontrado:', req.params.id);
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }

    console.log('✅ Proyecto encontrado:', project.name);

    // Solo el owner o un administrador pueden eliminar
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'administrador';
    
    console.log('🔐 Permisos - isOwner:', isOwner, 'isAdmin:', isAdmin);
    
    if (!isOwner && !isAdmin) {
      console.log('❌ Sin permisos para eliminar');
      return res.status(403).json({ message: 'No tienes permisos para eliminar este proyecto' });
    }

    // Eliminar todas las tareas asociadas al proyecto
    console.log('🗑️ Eliminando tareas asociadas...');
    const deletedTasks = await Task.deleteMany({ project: req.params.id });
    console.log('✅ Tareas eliminadas:', deletedTasks.deletedCount);

    // Eliminar el proyecto
    console.log('🗑️ Eliminando proyecto...');
    const deletedProject = await Project.findByIdAndDelete(req.params.id);
    console.log('✅ Proyecto eliminado:', deletedProject ? deletedProject.name : 'null');

    res.json({ success: true, message: 'Proyecto eliminado permanentemente' });
  } catch (error) {
    console.error('Error eliminando proyecto:', error);
    res.status(500).json({ message: 'Error al eliminar proyecto', error: error.message });
  }
});

// @route   PATCH /api/projects/:id/archive
// @desc    Archivar o desarchivar un proyecto
// @access  Private (Admin or Owner)
router.patch('/:id/archive', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }

    // Solo el owner o un administrador pueden archivar
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'administrador';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'No tienes permisos para archivar este proyecto' });
    }

    const { archived } = req.body;
    project.archived = archived !== undefined ? archived : !project.archived;
    
    await project.save();

    res.json({ 
      success: true, 
      project,
      message: project.archived ? 'Proyecto archivado' : 'Proyecto desarchivado'
    });
  } catch (error) {
    console.error('Error archivando proyecto:', error);
    res.status(500).json({ message: 'Error al archivar proyecto', error: error.message });
  }
});

// @route   POST /api/projects/:id/members
// @desc    Agregar miembro a un proyecto
// @access  Private
router.post('/:id/members', protect, async (req, res) => {
  try {
    console.log('🔵 POST /api/projects/:id/members - Iniciando...');
    console.log('📝 Body recibido:', req.body);
    console.log('👤 Usuario que hace la petición:', req.user._id);
    
    const { email, role } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      console.log('❌ Proyecto no encontrado:', req.params.id);
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }

    console.log('✅ Proyecto encontrado:', project.name);
    console.log('👥 Miembros actuales:', project.members.length);

    // Verificar permisos - soportar tanto owner como createdBy
    const projectOwnerId = project.owner || project.createdBy;
    const isOwner = projectOwnerId && projectOwnerId.toString() === req.user._id.toString();
    const member = project.members.find(m => m.user.toString() === req.user._id.toString());

    console.log('🔐 Verificación de permisos:', {
      projectOwnerId: projectOwnerId?.toString(),
      userId: req.user._id.toString(),
      isOwner,
      memberRole: member?.role
    });

    // Solo owner, admin, leader y supervisor pueden agregar miembros
    const allowedRoles = ['admin', 'leader', 'supervisor'];
    const hasPermission = isOwner || (member && allowedRoles.includes(member.role));

    if (!hasPermission) {
      console.log('❌ Sin permisos para agregar miembros');
      return res.status(403).json({ 
        message: 'No tienes permisos para agregar miembros. Solo owner, admin, leader y supervisor pueden hacerlo.',
        debug: {
          projectOwnerId: projectOwnerId?.toString(),
          userId: req.user._id.toString(),
          isOwner,
          memberRole: member?.role,
          allowedRoles
        }
      });
    }

    // Buscar usuario por email
    const userToAdd = await User.findOne({ email });

    if (!userToAdd) {
      console.log('❌ Usuario no encontrado con email:', email);
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    console.log('✅ Usuario encontrado:', userToAdd.name, userToAdd.email);

    // Verificar si ya es miembro
    const alreadyMember = project.members.some(m => m.user.toString() === userToAdd._id.toString());

    if (alreadyMember) {
      console.log('⚠️ El usuario ya es miembro');
      return res.status(400).json({ message: 'El usuario ya es miembro del proyecto' });
    }

    // Agregar miembro
    console.log('➕ Agregando miembro con rol:', role || 'member');
    project.members.push({
      user: userToAdd._id,
      role: role || 'member',
    });

    console.log('👥 Members array antes de guardar:', JSON.stringify(project.members, null, 2));
    await project.save();
    console.log('💾 Proyecto guardado');

    // Verificar que se guardó correctamente
    const savedProject = await Project.findById(project._id);
    console.log('🔍 Members después de guardar:', JSON.stringify(savedProject.members, null, 2));

    // Agregar proyecto al usuario
    await User.findByIdAndUpdate(userToAdd._id, {
      $push: { projects: project._id },
    });
    console.log('💾 Usuario actualizado');

    const updatedProject = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    console.log('✅ Miembro agregado exitosamente');
    res.json({ success: true, project: updatedProject });
  } catch (error) {
    console.error('❌ Error agregando miembro:', error);
    res.status(500).json({ message: 'Error al agregar miembro', error: error.message });
  }
});
// @route   DELETE /api/projects/:id/members/:userId
// @desc    Eliminar miembro de un proyecto
// @access  Private
router.delete('/:id/members/:userId', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }

    // Verificar permisos - soportar tanto owner como createdBy
    const projectOwnerId = project.owner || project.createdBy;
    const isOwner = projectOwnerId && projectOwnerId.toString() === req.user._id.toString();
    const member = project.members.find(m => m.user.toString() === req.user._id.toString());

    // Solo owner, admin, leader y supervisor pueden eliminar miembros
    const allowedRoles = ['admin', 'leader', 'supervisor'];
    const hasPermission = isOwner || (member && allowedRoles.includes(member.role));

    if (!hasPermission) {
      return res.status(403).json({ 
        message: 'No tienes permisos para eliminar miembros. Solo owner, admin, leader y supervisor pueden hacerlo.',
        debug: {
          projectOwnerId: projectOwnerId?.toString(),
          userId: req.user._id.toString(),
          isOwner,
          memberRole: member?.role,
          allowedRoles
        }
      });
    }

    // No permitir eliminar al owner
    if (req.params.userId === projectOwnerId?.toString()) {
      return res.status(400).json({ message: 'No puedes eliminar al propietario del proyecto' });
    }

    // Eliminar miembro
    project.members = project.members.filter(m => m.user.toString() !== req.params.userId);
    await project.save();

    // Eliminar proyecto del usuario
    await User.findByIdAndUpdate(req.params.userId, {
      $pull: { projects: project._id },
    });

    const updatedProject = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    res.json({ success: true, project: updatedProject });
  } catch (error) {
    console.error('Error eliminando miembro:', error);
    res.status(500).json({ message: 'Error al eliminar miembro', error: error.message });
  }
});
export default router;
