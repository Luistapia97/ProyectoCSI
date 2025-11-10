import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del proyecto es requerido'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  color: {
    type: String,
    default: '#6366f1', // Indigo
  },
  tags: [{
    type: String,
    trim: true,
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member', 'guest'],
      default: 'member',
    },
  }],
  // Columnas del tablero Kanban
  columns: [{
    name: {
      type: String,
      required: true,
      default: 'Pendiente',
    },
    order: {
      type: Number,
      required: true,
    },
    color: {
      type: String,
      default: '#94a3b8',
    },
  }],
  // Estadísticas
  stats: {
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
  },
  archived: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Índices para búsquedas rápidas
projectSchema.index({ owner: 1, createdAt: 1 });
projectSchema.index({ 'members.user': 1 });

const Project = mongoose.model('Project', projectSchema);

export default Project;

