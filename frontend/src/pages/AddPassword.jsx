import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import './Auth.css';

export default function AddPassword() {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!formData.password) {
      setError('La contraseña es requerida');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        'http://localhost:5000/api/auth/add-password',
        { password: formData.password },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al agregar contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <Lock className="auth-icon" size={48} />
          <h1>Agregar Contraseña</h1>
          <p>Agrega una contraseña para iniciar sesión con email</p>
        </div>

        <div style={{
          padding: '12px',
          background: '#f0f9ff',
          border: '1px solid #3b82f6',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#1e40af',
          marginBottom: '20px',
          lineHeight: '1.5',
          display: 'flex',
          alignItems: 'start',
          gap: '8px'
        }}>
          <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Cuenta de Zoho:</strong> Tu cuenta fue creada con Zoho OAuth. 
            Al agregar una contraseña, podrás iniciar sesión de dos formas:
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
              <li>Con el botón "Continuar con Zoho"</li>
              <li>Con tu email ({user.email}) y contraseña</li>
            </ul>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {success && (
          <div style={{
            padding: '12px',
            background: '#dcfce7',
            border: '1px solid #22c55e',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#15803d',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle size={20} />
            <span>¡Contraseña agregada exitosamente! Redirigiendo...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="password">
              <Lock size={18} />
              Nueva Contraseña
            </label>
            <input
              type="password"
              id="password"
              placeholder="Mínimo 6 caracteres"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              disabled={success}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              <Lock size={18} />
              Confirmar Contraseña
            </label>
            <input
              type="password"
              id="confirmPassword"
              placeholder="Repite la contraseña"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              disabled={success}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading || success}>
            {loading ? 'Agregando contraseña...' : success ? '✓ Contraseña agregada' : 'Agregar contraseña'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            <a href="/dashboard" style={{ cursor: 'pointer' }}>Volver al Dashboard</a>
          </p>
        </div>
      </div>
    </div>
  );
}
