import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'El título de la tarea es requerido'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  column: {
    type: String,
    required: true,
    default: 'Pendiente',
  },
  position: {
    type: Number,
    required: true,
    default: 0,
  },
  // Asignación
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Prioridad y fechas
  priority: {
    type: String,
    enum: ['baja', 'media', 'alta', 'urgente'],
    default: 'media',
  },
  dueDate: {
    type: Date,
  },
  // Etiquetas y categorías
  tags: [{
    type: String,
    trim: true,
  }],
  color: {
    type: String,
  },
  // Subtareas
  subtasks: [{
    title: {
      type: String,
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  }],
  // Estado
  completed: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
  },
  // Validación
  pendingValidation: {
    type: Boolean,
    default: false,
  },
  validatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  validatedAt: {
    type: Date,
  },
  validationComment: {
    type: String,
    trim: true,
  },
  archived: {
    type: Boolean,
    default: false,
  },
  // Google Calendar (mantener por compatibilidad con datos existentes)
  googleCalendarEventIds: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    eventId: String,
    eventLink: String,
  }],
  // Zoho Tasks - almacenar IDs de tareas sincronizadas en Zoho
  zohoTaskIds: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    taskId: String, // ID de la tarea en Zoho Tasks
    syncedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  // Archivos adjuntos
  attachments: [{
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    cloudinaryId: {
      type: String,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  }],
}, {
  timestamps: true,
});

// Índices para rendimiento
taskSchema.index({ project: 1, column: 1, position: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ dueDate: 1 });

// Actualizar fecha de completado automáticamente
taskSchema.pre('save', function(next) {
  if (this.isModified('completed') && this.completed) {
    this.completedAt = new Date();
  }
  next();
});

const Task = mongoose.model('Task', taskSchema);

export default Task;
