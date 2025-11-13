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

    res.json({ success: true, projects });
  } catch (error) {
    console.error('Error obteniendo proyectos:', error);
    res.status(500).json({ message: 'Error al obtener proyectos', error: error.message });
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
// @desc    Eliminar (archivar) un proyecto
// @access  Private (Admin o Owner)
router.delete('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }

    // Solo el owner o un administrador pueden eliminar
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'administrador';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'No tienes permisos para eliminar este proyecto' });
    }

    project.archived = true;
    await project.save();

    res.json({ success: true, message: 'Proyecto archivado exitosamente' });
  } catch (error) {
    console.error('Error eliminando proyecto:', error);
    res.status(500).json({ message: 'Error al eliminar proyecto', error: error.message });
  }
});

// @route   POST /api/projects/:id/members
// @desc    Agregar miembro a un proyecto
// @access  Private
router.post('/:id/members', protect, async (req, res) => {
  try {
    const { email, role } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }

    // Verificar permisos
    const isOwner = project.owner.toString() === req.user._id.toString();
    const member = project.members.find(m => m.user.toString() === req.user._id.toString());

    if (!isOwner && (!member || member.role === 'member' || member.role === 'guest')) {
      return res.status(403).json({ message: 'No tienes permisos para agregar miembros' });
    }

    // Buscar usuario por email
    const userToAdd = await User.findOne({ email });

    if (!userToAdd) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar si ya es miembro
    const alreadyMember = project.members.some(m => m.user.toString() === userToAdd._id.toString());

    if (alreadyMember) {
      return res.status(400).json({ message: 'El usuario ya es miembro del proyecto' });
    }

    // Agregar miembro
    project.members.push({
      user: userToAdd._id,
      role: role || 'member',
    });

    await project.save();

    // Agregar proyecto al usuario
    await User.findByIdAndUpdate(userToAdd._id, {
      $push: { projects: project._id },
    });

    const updatedProject = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    res.json({ success: true, project: updatedProject });
  } catch (error) {
    console.error('Error agregando miembro:', error);
    res.status(500).json({ message: 'Error al agregar miembro', error: error.message });
  }
});

export default router;
