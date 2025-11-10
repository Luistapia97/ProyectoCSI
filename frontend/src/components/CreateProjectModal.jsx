import { useState } from 'react';
import { X, Palette } from 'lucidereact';
import useProjectStore from '../store/projectStore';
import './Modal.css';

const PROJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f59e0b', '#10b981', '#06b6d4', '#3b82f6',
];

export default function CreateProjectModal({ onClose }) {
  const { createProject } = useProjectStore();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#6366f1',
    tags: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('El nombre del proyecto es requerido');
      return;
    }

    setLoading(true);

    const tagsArray = formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const result = await createProject({
      name: formData.name,
      description: formData.description,
      color: formData.color,
      tags: tagsArray,
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
          <h2>Crear Nuevo Proyecto</h2>
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
            <label htmlFor="name">Nombre del proyecto *</label>
            <input
              type="text"
              id="name"
              placeholder="Ej: Lanzamiento Web"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              autoFocus
            />
          </div>

          <div className="formgroup">
            <label htmlFor="description">Descripción</label>
            <textarea
              id="description"
              placeholder="Describe de qué trata el proyecto..."
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="formgroup">
            <label>
              <Palette size={18} />
              Color del proyecto
            </label>
            <div className="colorpicker">
              {PROJECT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`coloroption ${formData.color === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color })}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div className="formgroup">
            <label htmlFor="tags">Etiquetas (separadas por coma)</label>
            <input
              type="text"
              id="tags"
              placeholder="Ej: urgente, marketing, diseño"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            />
          </div>

          <div className="modalactions">
            <button type="button" onClick={onClose} className="btnsecondary">
              Cancelar
            </button>
            <button type="submit" className="btnprimary" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

