import { useState, useEffect } from 'react';
import { X, Calendar, Flag, Tag, Users, Plus, Trash2, CheckSquare } from 'lucide-react';
import useTaskStore from '../store/taskStore';
import { authAPI, getBackendURL } from '../services/api';
import './Modal.css';

const PRIORITIES = ['baja', 'media', 'alta', 'urgente'];

export default function CreateCardModal({ projectId, column, onClose }) {
  const { createTask } = useTaskStore();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'media',
    dueDate: '',
    tags: '',
    assignedTo: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');

  const getAvatarUrl = (avatarUrl) => {
    if (!avatarUrl) return null;
    if (avatarUrl.startsWith('http')) return avatarUrl;
    return `${getBackendURL()}${avatarUrl}`;
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await authAPI.getAllUsers();
      setAvailableUsers(response.data.users || []);
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
      setSubtasks([...subtasks, { text: newSubtaskText.trim(), completed: false }]);
      setNewSubtaskText('');
    }
  };

  const removeSubtask = (index) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
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
              Asignar usuarios ({formData.assignedTo.length})
            </label>
            <div className="user-selection-grid">
              {availableUsers.map((user) => (
                <div
                  key={user._id}
                  className={`user-selection-item ${formData.assignedTo.includes(user._id) ? 'selected' : ''}`}
                  onClick={() => toggleUserAssignment(user._id)}
                >
                  <img src={getAvatarUrl(user.avatar)} alt={user.name} className="user-selection-avatar" />
                  <div className="user-selection-info">
                    <span className="user-selection-name">{user.name}</span>
                    <span className="user-selection-email">{user.email}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>
              <CheckSquare size={18} />
              Subtareas ({subtasks.length})
            </label>
            <div className="subtasks-list">
              {subtasks.map((subtask, index) => (
                <div key={index} className="subtask-item">
                  <span>{subtask.text}</span>
                  <button
                    type="button"
                    onClick={() => removeSubtask(index)}
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
