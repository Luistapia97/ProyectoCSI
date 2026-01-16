import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import useProjectStore from '../store/projectStore';
import './Modal.css';

export default function EditProjectModal({ project, isOpen, onClose }) {
  const { updateProject } = useProjectStore();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#667eea',
    tags: []
  });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        color: project.color || '#667eea',
        tags: project.tags || []
      });
    }
  }, [project]);

  const colorOptions = [
    { name: 'Púrpura', value: '#667eea' },
    { name: 'Azul', value: '#3b82f6' },
    { name: 'Verde', value: '#10b981' },
    { name: 'Rojo', value: '#ef4444' },
    { name: 'Naranja', value: '#f97316' },
    { name: 'Rosa', value: '#ec4899' },
    { name: 'Amarillo', value: '#eab308' },
    { name: 'Turquesa', value: '#06b6d4' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('El nombre del proyecto es requerido');
      return;
    }

    setLoading(true);
    setError('');

    const result = await updateProject(project._id, formData);

    if (result.success) {
      onClose();
    } else {
      setError(result.error || 'Error al actualizar el proyecto');
    }
    
    setLoading(false);
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Editar Proyecto</h2>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="error-message" style={{ margin: '0 2rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem 2rem 2rem' }}>
          <div className="form-group">
            <label htmlFor="name">Nombre del Proyecto *</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nombre del proyecto"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Descripción</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción del proyecto (opcional)"
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Color del Proyecto</label>
            <div className="color-picker">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`color-option ${formData.color === color.value ? 'selected' : ''}`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  title={color.name}
                  disabled={loading}
                />
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="tags">Etiquetas</label>
            <div className="tags-input-container">
              <input
                id="tags"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Agregar etiqueta"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddTag(e);
                  }
                }}
                disabled={loading}
              />
              <button 
                type="button" 
                className="btn-add-tag"
                onClick={handleAddTag}
                disabled={loading || !tagInput.trim()}
              >
                Agregar
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="tags-list">
                {formData.tags.map((tag, index) => (
                  <span key={index} className="tag">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="tag-remove"
                      disabled={loading}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Actualizando...' : 'Actualizar Proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
