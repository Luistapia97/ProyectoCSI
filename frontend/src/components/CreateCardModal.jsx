import { useState, useEffect } from 'react';
import { X, Calendar, Flag, Tag, Users } from 'lucidereact';
import useTaskStore from '../store/taskStore';
import { authAPI } from '../services/api';
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
    });

    setLoading(false);

    if (result.success) {
      onClose();
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="modaloverlay" onClick={onClose}>
      <div className="modalcontent" onClick={(e) => e.stopPropagation()}>
        <div className="modalheader">
          <h2>Crear Nueva Tarea</h2>
          <button onClick={onClose} className="modalclose">
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="errormessage">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="modalform">
          <div className="formgroup">
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

          <div className="formgroup">
            <label htmlFor="description">Descripción</label>
            <textarea
              id="description"
              placeholder="Describe los detalles de la tarea..."
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="formrow">
            <div className="formgroup">
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

            <div className="formgroup">
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

          <div className="formgroup">
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

          <div className="formgroup">
            <label>
              <Users size={18} />
              Asignar usuarios ({formData.assignedTo.length})
            </label>
            <div className="userselectiongrid">
              {availableUsers.map((user) => (
                <div
                  key={user._id}
                  className={`userselectionitem ${formData.assignedTo.includes(user._id) ? 'selected' : ''}`}
                  onClick={() => toggleUserAssignment(user._id)}
                >
                  <img src={user.avatar} alt={user.name} className="userselectionavatar" />
                  <div className="userselectioninfo">
                    <span className="userselectionname">{user.name}</span>
                    <span className="userselectionemail">{user.email}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="infobox">
            📌 La tarea se creará en la columna: <strong>{column}</strong>
          </div>

          <div className="modalactions">
            <button type="button" onClick={onClose} className="btnsecondary">
              Cancelar
            </button>
            <button type="submit" className="btnprimary" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

