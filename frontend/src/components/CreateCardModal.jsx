import { useState, useEffect } from 'react';
import { X, Calendar, Flag, Tag, Users, Plus, Trash2, CheckSquare } from 'lucide-react';
import useTaskStore from '../store/taskStore';
import useAuthStore from '../store/authStore';
import { authAPI, getBackendURL } from '../services/api';
import EstimationPicker from './EstimationPicker';
import './Modal.css';

const PRIORITIES = ['baja', 'media', 'alta', 'urgente'];

function UserAvatarSelector({ user }) {
  const [imageError, setImageError] = useState(false);
  
  const getAvatarUrl = (avatarUrl) => {
    if (!avatarUrl || avatarUrl.trim() === '' || avatarUrl === 'undefined' || avatarUrl.includes('undefined') || avatarUrl === 'null') return null;
    if (avatarUrl.startsWith('http')) return avatarUrl;
    return `${getBackendURL()}${avatarUrl}`;
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return words[0].substring(0, 2).toUpperCase();
  };

  const avatarUrl = getAvatarUrl(user.avatar);

  if (!avatarUrl || imageError) {
    return (
      <div className="user-selection-avatar avatar-initials">
        {getInitials(user.name)}
      </div>
    );
  }

  return (
    <img 
      src={avatarUrl} 
      alt={user.name} 
      className="user-selection-avatar"
      onError={() => setImageError(true)}
    />
  );
}

export default function CreateCardModal({ projectId, column, onClose }) {
  const { createTask } = useTaskStore();
  const { user: currentUser } = useAuthStore();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'media',
    dueDate: '',
    tags: '',
    assignedTo: [],
    estimatedSize: 'M',
    estimatedHours: 8,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');

  const isAdmin = currentUser?.role === 'administrador';

  const getAvatarUrl = (avatarUrl) => {
    if (!avatarUrl || avatarUrl.trim() === '' || avatarUrl === 'undefined' || avatarUrl.includes('undefined') || avatarUrl === 'null') return null;
    if (avatarUrl.startsWith('http')) return avatarUrl;
    return `${getBackendURL()}${avatarUrl}`;
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return words[0].substring(0, 2).toUpperCase();
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      if (isAdmin) {
        // Administradores ven todos los usuarios
        const response = await authAPI.getAllUsers();
        setAvailableUsers(response.data.users || []);
      } else {
        // Usuarios normales solo se ven a sí mismos
        if (currentUser) {
          setAvailableUsers([currentUser]);
        }
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  };

  const toggleUserAssignment = (userId) => {
    setFormData(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(userId)
        ? prev.assignedTo.filter(id => id !== userId)
        : [...prev.assignedTo, userId]
    }));
  };

  const addSubtask = () => {
    if (newSubtaskText.trim()) {
      setSubtasks([...subtasks, { 
        id: Date.now() + Math.random(), 
        text: newSubtaskText.trim(), 
        completed: false 
      }]);
      setNewSubtaskText('');
    }
  };

  const removeSubtask = (id) => {
    setSubtasks(subtasks.filter(st => st.id !== id));
  };

  const handleSubtaskKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSubtask();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('El título de la tarea es requerido');
      return;
    }

    if (!formData.estimatedSize) {
      setError('La estimación de esfuerzo es requerida');
      return;
    }

    setLoading(true);

    const tagsArray = formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const result = await createTask({
      title: formData.title,
      description: formData.description,
      project: projectId,
      column: column,
      priority: formData.priority,
      dueDate: formData.dueDate || undefined,
      tags: tagsArray,
      assignedTo: formData.assignedTo,
      subtasks: subtasks.length > 0 ? subtasks : undefined,
      effortMetrics: {
        estimatedSize: formData.estimatedSize,
        estimatedHours: formData.estimatedHours,
        timeTracking: [],
        blockedBy: 'none',
        actualHours: 0,
        effectiveHours: 0
      }
    });

    setLoading(false);

    if (result.success) {
      onClose();
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Crear Nueva Tarea</h2>
          <button onClick={onClose} className="modal-close">
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="title">Título de la tarea *</label>
            <input
              type="text"
              id="title"
              placeholder="Ej: Diseñar landing page"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Descripción</label>
            <textarea
              id="description"
              placeholder="Describe los detalles de la tarea..."
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>
              <CheckSquare size={18} />
              Subtareas ({subtasks.length})
            </label>
            <div className="subtasks-list">
              {subtasks.map((subtask) => (
                <div key={subtask.id} className="subtask-item">
                  <span>{subtask.text}</span>
                  <button
                    type="button"
                    onClick={() => removeSubtask(subtask.id)}
                    className="btn-icon-tiny btn-danger"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="add-subtask">
              <input
                type="text"
                placeholder="Agregar subtarea..."
                value={newSubtaskText}
                onChange={(e) => setNewSubtaskText(e.target.value)}
                onKeyPress={handleSubtaskKeyPress}
              />
              <button
                type="button"
                onClick={addSubtask}
                className="btn-icon-small"
                disabled={!newSubtaskText.trim()}
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="priority">
                <Flag size={18} />
                Prioridad
              </label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                {PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="dueDate">
                <Calendar size={18} />
                Fecha límite
              </label>
              <input
                type="date"
                id="dueDate"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>

          {/* Estimación de esfuerzo */}
          <EstimationPicker
            value={formData.estimatedSize}
            onChange={(size, hours) => setFormData({ ...formData, estimatedSize: size, estimatedHours: hours })}
            required={true}
          />

          <div className="form-group">
            <label htmlFor="tags">
              <Tag size={18} />
              Etiquetas (separadas por coma)
            </label>
            <input
              type="text"
              id="tags"
              placeholder="Ej: diseño, urgente, frontend"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>
              <Users size={18} />
              {isAdmin 
                ? `Asignar usuarios (${formData.assignedTo.length})`
                : 'Asignarme esta tarea'
              }
            </label>
            <div className="user-selection-grid">
              {availableUsers.map((user) => (
                <div
                  key={user._id}
                  className={`user-selection-item ${formData.assignedTo.includes(user._id) ? 'selected' : ''}`}
                  onClick={() => toggleUserAssignment(user._id)}
                >
                  <UserAvatarSelector user={user} />
                  <div className="user-selection-info">
                    <span className="user-selection-name">{user.name}</span>
                    <span className="user-selection-email">{user.email}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="info-box">
            📌 La tarea se creará en la columna: <strong>{column}</strong>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
