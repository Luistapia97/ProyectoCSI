import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, User, Mail, Shield, ArrowLeft, Upload, Trash2, Save } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { authAPI, getBackendURL } from '../services/api';
import './Profile.css';

export default function Profile() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await authAPI.updateProfile(formData);
      
      if (response.data.success) {
        setUser(response.data.user);
        setMessage({ type: 'success', text: 'Perfil actualizado exitosamente' });
      }
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error al actualizar perfil' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'La imagen no debe superar los 5MB' });
      return;
    }

    // Validar tipo
    if (!file.type.match(/image\/(jpeg|jpg|png|gif|webp)/)) {
      setMessage({ type: 'error', text: 'Solo se permiten imágenes (JPEG, PNG, GIF, WEBP)' });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await authAPI.uploadAvatar(formData);
      
      if (response.data.success) {
        setUser(response.data.user);
        setMessage({ type: 'success', text: 'Foto de perfil actualizada' });
      }
    } catch (error) {
      console.error('Error subiendo avatar:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error al subir imagen' 
      });
    } finally {
      setUploading(false);
    }
  };

  const handleUseInitials = async () => {
    if (!confirm('¿Quieres usar las iniciales de tu correo como foto de perfil?')) return;

    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await authAPI.deleteAvatar();
      
      if (response.data.success) {
        setUser(response.data.user);
        setMessage({ type: 'success', text: 'Ahora usas las iniciales de tu correo' });
      }
    } catch (error) {
      console.error('Error usando iniciales:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error al cambiar avatar' 
      });
    } finally {
      setUploading(false);
    }
  };

  const getAvatarUrl = () => {
    if (!user?.avatar) {
      const emailInitials = user?.email?.substring(0, 2).toUpperCase() || 'US';
      return `https://ui-avatars.com/api/?background=6366f1&color=fff&name=${emailInitials}&bold=true`;
    }

    if (user.avatar.startsWith('http')) {
      return user.avatar;
    }

    return `${getBackendURL()}${user.avatar}`;
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <button onClick={() => navigate('/dashboard')} className="btn-back">
          <ArrowLeft size={20} />
          Volver al Dashboard
        </button>
        <h1>Mi Perfil</h1>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="profile-content">
        {/* Sección de Avatar */}
        <div className="profile-section avatar-section">
          <h2>
            <Camera size={20} />
            Foto de Perfil
          </h2>
          
          <div className="avatar-container">
            <div className="avatar-preview">
              <img 
                src={getAvatarUrl()} 
                alt={user?.name}
                onError={(e) => {
                  const emailInitials = user?.email?.substring(0, 2).toUpperCase() || 'US';
                  e.target.src = `https://ui-avatars.com/api/?background=6366f1&color=fff&name=${emailInitials}&bold=true`;
                }}
              />
            </div>

            <div className="avatar-actions">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                style={{ display: 'none' }}
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary"
                disabled={uploading}
              >
                <Upload size={18} />
                {uploading ? 'Subiendo...' : 'Subir Foto'}
              </button>

              <button
                onClick={handleUseInitials}
                className="btn-secondary"
                disabled={uploading}
              >
                <User size={18} />
                Usar Iniciales
              </button>
            </div>

            <p className="avatar-hint">
              Tamaño máximo: 5MB • Formatos: JPEG, PNG, GIF, WEBP
            </p>
          </div>
        </div>

        {/* Sección de Información Personal */}
        <div className="profile-section">
          <h2>
            <User size={20} />
            Información Personal
          </h2>

          <form onSubmit={handleUpdateProfile} className="profile-form">
            <div className="form-group">
              <label>
                <User size={18} />
                Nombre Completo
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Tu nombre completo"
                required
              />
            </div>

            <div className="form-group">
              <label>
                <Mail size={18} />
                Correo Electrónico
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="tu@email.com"
                required
              />
            </div>

            <div className="form-group">
              <label>
                <Shield size={18} />
                Rol
              </label>
              <input
                type="text"
                value={user?.role === 'administrador' ? 'Administrador' : 'Usuario'}
                disabled
                className="input-disabled"
              />
            </div>

            <button type="submit" className="btn-save" disabled={loading}>
              <Save size={18} />
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
