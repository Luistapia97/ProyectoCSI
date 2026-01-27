import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
  },
  avatar: {
    type: String,
    default: 'https://ui-avatars.com/api/?background=random&name=User',
  },
  role: {
    type: String,
    enum: ['usuario', 'administrador'],
    default: 'usuario',
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved', // Por defecto aprobado para registro local
  },
  // Para Google OAuth
  googleId: {
    type: String,
    sparse: true,
    unique: true,
  },
  googleAccessToken: {
    type: String,
  },
  googleRefreshToken: {
    type: String,
  },
  // Para Zoho Calendar
  zohoId: {
    type: String,
    sparse: true,
  },
  zohoAccessToken: {
    type: String,
  },
  zohoRefreshToken: {
    type: String,
  },
  authProvider: {
    type: String,
    enum: ['local', 'google', 'zoho'],
    default: 'local',
  },
  // Proyectos en los que participa
  projects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  }],
  // Configuración de usuario
  settings: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light',
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
    },
  },
  
  // Perfil de Esfuerzo (para métricas de productividad)
  effortProfile: {
    // Disponibilidad
    weeklyHours: {
      type: Number,
      default: 40 // Horas de trabajo semanales
    },
    availabilityPercentage: {
      type: Number,
      default: 100, // % de tiempo dedicado a tareas (vs reuniones, admin, etc)
      min: 0,
      max: 100
    },
    
    // Experiencia (afecta velocidad esperada)
    experienceLevel: {
      type: String,
      enum: ['junior', 'mid', 'senior', 'lead'],
      default: 'mid'
    },
    
    // Costo (para cálculo de ROI)
    costPerHour: {
      type: Number,
      default: 0 // Opcional, para análisis de costo
    },
    
    // Especialización (para asignación inteligente)
    specializations: [{
      type: String,
      enum: ['frontend', 'backend', 'devops', 'design', 'qa', 'pm', 'other']
    }],
    
    // Histórico de eficiencia (últimas 4 semanas)
    efficiencyHistory: [{
      weekStart: Date,
      weekEnd: Date,
      avgEfficiency: Number,
      tasksCompleted: Number,
      totalHours: Number
    }]
  }
}, {
  timestamps: true,
});

// Encriptar contraseña antes de guardar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Método para obtener información pública del usuario
userSchema.methods.toPublicJSON = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    role: this.role,
    settings: this.settings,
  };
};

const User = mongoose.model('User', userSchema);

export default User;
