import { useState } from 'react';
import { X, UserPlus, Shield, User as UserIcon } from 'lucidereact';
import { authAPI } from '../services/api';
import './Modal.css';

const CreateUserModal = ({ onClose, onUserCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'usuario',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.createUser(formData);
      if (response.data.success) {
        onUserCreated(response.data.user);
        onClose();
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error al crear usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modaloverlay" onClick={onClose}>
      <div className="modalcontent" onClick={(e) => e.stopPropagation()}>
        <div className="modalheader">
          <div className="modaltitleicon">
            <UserPlus size={24} />
            <h2>Crear Nuevo Usuario</h2>
          </div>
          <button className="modalclose" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modalform">
          {error && (
            <div className="errormessage" style={{ 
              padding: '12px', 
              background: '#fee', 
              border: '1px solid #fcc',
              borderRadius: '8px',
              color: '#c33',
              marginBottom: '20px'
            }}>
              {error}
            </div>
          )}

          <div className="formgroup">
            <label htmlFor="name">Nombre Completo</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej: Juan Pérez"
              required
              autoFocus
            />
          </div>

          <div className="formgroup">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="juan@ejemplo.com"
              required
            />
          </div>

          <div className="formgroup">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              required
            />
          </div>

          <div className="formgroup">
            <label htmlFor="role">Rol</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="usuario">
                👤 Usuario (Solo puede realizar tareas)
              </option>
              <option value="administrador">
                👑 Administrador (Puede crear proyectos y tareas)
              </option>
            </select>
          </div>

          <div className="roleinfo" style={{
            padding: '12px',
            background: 'var(bgsecondary)',
            borderRadius: '8px',
            fontSize: '14px',
            color: 'var(textsecondary)',
            marginBottom: '20px'
          }}>
            {formData.role === 'usuario' ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <UserIcon size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Usuario:</strong> Puede ver tareas asignadas, actualizar su estado, 
                  marcar subtareas como completadas y agregar comentarios.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <Shield size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Administrador:</strong> Tiene acceso completo. Puede crear 
                  proyectos, crear tareas, asignar tareas a usuarios y gestionar todo el sistema.
                </div>
              </div>
            )}
          </div>

          <div className="modalactions">
            <button
              type="button"
              className="btnsecondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btnprimary"
              disabled={loading}
            >
              {loading ? 'Creando...' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;

