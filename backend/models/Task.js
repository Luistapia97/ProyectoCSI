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
  
  // Sistema de Métricas de Esfuerzo
  effortMetrics: {
    // ESTIMACIÓN INICIAL
    estimatedSize: {
      type: String,
      enum: ['XS', 'S', 'M', 'L', 'XL'],
      default: 'M',
    },
    estimatedHours: {
      type: Number,
      default: function() {
        // Valores por defecto según talla
        const sizeToHours = {
          'XS': 1,
          'S': 2,
          'M': 6,
          'L': 12,
          'XL': 40
        };
        return sizeToHours[this.effortMetrics?.estimatedSize] || 6;
      }
    },
    
    // SEGUIMIENTO DE TIEMPO REAL
    timeTracking: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      startTime: Date,
      endTime: Date,
      duration: Number, // En minutos
      method: {
        type: String,
        enum: ['timer', 'manual', 'estimate'],
        default: 'manual'
      },
      note: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    
    // BLOQUEOS (tareas dependientes de terceros)
    blockedBy: {
      type: String,
      enum: ['none', 'external', 'dependency', 'approval', 'information'],
      default: 'none'
    },
    blockedSince: Date,
    blockedUntil: Date,
    blockedReason: String,
    blockedHours: {
      type: Number,
      default: 0
    },
    
    // HISTORIAL DE BLOQUEOS
    blockHistory: [{
      blockedBy: {
        type: String,
        enum: ['external', 'dependency', 'approval', 'information']
      },
      reason: String,
      blockedSince: Date,
      blockedUntil: Date,
      duration: Number // en horas
    }],
    
    // CÁLCULOS AUTOMÁTICOS (se actualizan al guardar)
    actualHours: {
      type: Number,
      default: 0
    },
    effectiveHours: {
      type: Number,
      default: 0
    },
    efficiency: Number, // estimatedHours / effectiveHours
    
    // TIMER ACTIVO (para seguimiento en tiempo real)
    activeTimer: {
      userId: mongoose.Schema.Types.ObjectId,
      startTime: Date,
      isActive: {
        type: Boolean,
        default: false
      }
    }
  },
}, {
  timestamps: true,
});

// Índices para rendimiento
taskSchema.index({ project: 1, column: 1, position: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ 'effortMetrics.activeTimer.isActive': 1 });
taskSchema.index({ completedAt: 1 });

// Middleware para calcular métricas automáticamente
taskSchema.pre('save', function(next) {
  // Actualizar fecha de completado
  if (this.isModified('completed') && this.completed) {
    this.completedAt = new Date();
    
    // Detener timer activo si existe
    if (this.effortMetrics?.activeTimer?.isActive) {
      const now = new Date();
      const duration = Math.floor((now - this.effortMetrics.activeTimer.startTime) / 60000);
      
      this.effortMetrics.timeTracking.push({
        userId: this.effortMetrics.activeTimer.userId,
        startTime: this.effortMetrics.activeTimer.startTime,
        endTime: now,
        duration: duration,
        method: 'timer'
      });
      
      this.effortMetrics.activeTimer.isActive = false;
    }
  }
  
  // Calcular horas reales totales
  if (this.effortMetrics && this.effortMetrics.timeTracking) {
    this.effortMetrics.actualHours = this.effortMetrics.timeTracking.reduce((sum, entry) => {
      return sum + (entry.duration || 0) / 60; // Convertir minutos a horas
    }, 0);
  }
  
  // Calcular horas bloqueadas
  // Sumar TODAS las duraciones del historial de bloqueos
  if (this.effortMetrics?.blockHistory && this.effortMetrics.blockHistory.length > 0) {
    // Sumar todos los bloqueos completados del historial
    const totalFromHistory = this.effortMetrics.blockHistory.reduce((sum, block) => {
      return sum + (block.duration || 0);
    }, 0);
    
    // Si hay un bloqueo activo, agregar tiempo actual
    let currentBlockHours = 0;
    if (this.effortMetrics.blockedBy !== 'none' && this.effortMetrics.blockedSince) {
      const blockedMs = new Date() - new Date(this.effortMetrics.blockedSince);
      currentBlockHours = Math.max(0, blockedMs / (1000 * 60 * 60));
    }
    
    this.effortMetrics.blockedHours = totalFromHistory + currentBlockHours;
  } else if (this.effortMetrics?.blockedSince) {
    // Fallback al método anterior si no hay historial (compatibilidad)
    if (this.effortMetrics.blockedBy !== 'none') {
      // Tarea actualmente bloqueada - calcular hasta ahora
      const blockedMs = new Date() - this.effortMetrics.blockedSince;
      this.effortMetrics.blockedHours = Math.max(0, blockedMs / (1000 * 60 * 60));
    } else if (this.effortMetrics.blockedUntil) {
      // Tarea que fue desbloqueada - calcular el período completo
      const blockedMs = new Date(this.effortMetrics.blockedUntil) - new Date(this.effortMetrics.blockedSince);
      this.effortMetrics.blockedHours = Math.max(0, blockedMs / (1000 * 60 * 60));
    }
  }
  
  // Calcular horas efectivas (reales - bloqueadas)
  if (this.effortMetrics) {
    this.effortMetrics.effectiveHours = Math.max(0, 
      (this.effortMetrics.actualHours || 0) - (this.effortMetrics.blockedHours || 0)
    );
    
    // Calcular eficiencia (solo si hay horas efectivas)
    if (this.effortMetrics.effectiveHours > 0) {
      this.effortMetrics.efficiency = 
        (this.effortMetrics.estimatedHours || 0) / this.effortMetrics.effectiveHours;
    }
  }
  
  next();
});

const Task = mongoose.model('Task', taskSchema);

export default Task;
