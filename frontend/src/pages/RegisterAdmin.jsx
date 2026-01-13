import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, Mail, Lock, User, Key, AlertCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { authAPI, getBackendURL } from '../services/api';
import './Auth.css';

export default function RegisterAdmin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { registerAdmin } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    adminCode: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminInfo, setAdminInfo] = useState({ count: 0, available: 4 });

  useEffect(() => {
    // Verificar errores en la URL
    const urlError = searchParams.get('error');
    if (urlError === 'invalid_admin_code') {
      setError('Código de administrador inválido. Por favor verifica el código e intenta nuevamente.');
    }
    
    // Obtener cantidad de admins disponibles
    const fetchAdminCount = async () => {
      try {
        const response = await authAPI.getAdminCount();
        setAdminInfo(response.data);
      } catch (error) {
        console.error('Error obteniendo info de admins:', error);
      }
    };
    fetchAdminCount();
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (!formData.adminCode) {
      setError('Debes ingresar el código de administrador');
      return;
    }

    setLoading(true);

    const result = await registerAdmin({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      adminCode: formData.adminCode,
    });

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleZohoRegister = () => {
    // Primero pedir el código de administrador
    const adminCode = prompt('Ingresa el código de administrador para continuar con Zoho:');
    
    if (!adminCode) {
      setError('Debes ingresar el código de administrador');
      return;
    }
    
    // Redirigir a Zoho OAuth con parámetro para indicar que es registro de admin
    const frontendURL = window.location.origin; // Obtener la URL actual del frontend
    window.location.href = `${getBackendURL()}/api/auth/zoho?register=admin&adminCode=${encodeURIComponent(adminCode)}&frontend=${encodeURIComponent(frontendURL)}`;
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <Shield className="auth-icon" size={48} style={{ color: '#f59e0b' }} />
          <h1>Registro de Administrador</h1>
          <p>Acceso exclusivo para administradores del sistema</p>
        </div>

        {/* Info de disponibilidad */}
        <div style={{
          padding: '16px',
          background: adminInfo.available > 0 ? '#ecfdf5' : '#fee',
          border: `1px solid ${adminInfo.available > 0 ? '#a7f3d0' : '#fcc'}`,
          borderRadius: '12px',
          marginBottom: '24px'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            color: adminInfo.available > 0 ? '#047857' : '#c33',
            marginBottom: '8px'
          }}>
            <AlertCircle size={20} />
            <strong>
              {adminInfo.available > 0 
                ? `${adminInfo.available} de 4 espacios disponibles`
                : 'No hay espacios disponibles'}
            </strong>
          </div>
          <p style={{ 
            margin: 0, 
            fontSize: '14px',
            color: adminInfo.available > 0 ? '#065f46' : '#991b1b',
            lineHeight: '1.5'
          }}>
            {adminInfo.available > 0 
              ? `Ya hay ${adminInfo.count} administrador${adminInfo.count !== 1 ? 'es' : ''} registrado${adminInfo.count !== 1 ? 's' : ''}. Puedes registrar ${adminInfo.available} más.`
              : 'Se ha alcanzado el límite máximo de 4 administradores. No se pueden registrar más.'}
          </p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {adminInfo.available > 0 ? (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="name">
                <User size={18} />
                Nombre completo
              </label>
              <input
                type="text"
                id="name"
                placeholder="Tu nombre"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">
                <Mail size={18} />
                Email
              </label>
              <input
                type="email"
                id="email"
                placeholder="admin@empresa.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                <Lock size={18} />
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                <Lock size={18} />
                Confirmar contraseña
              </label>
              <input
                type="password"
                id="confirmPassword"
                placeholder="Repite tu contraseña"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label htmlFor="adminCode">
                <Key size={18} />
                Código de Administrador
              </label>
              <input
                type="password"
                id="adminCode"
                placeholder="Código secreto de administrador"
                value={formData.adminCode}
                onChange={(e) => setFormData({ ...formData, adminCode: e.target.value })}
                required
              />
              <small style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px', display: 'block' }}>
                Solicita este código al administrador principal
              </small>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar Administrador'}
            </button>

            <div className="auth-divider">
              <span>O</span>
            </div>

            <button 
              type="button" 
              onClick={handleZohoRegister}
              className="btn-zoho"
              style={{
                width: '100%',
                padding: '12px',
                background: '#fff',
                border: '2px solid #d63031',
                borderRadius: '8px',
                color: '#d63031',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                transition: 'all 0.2s ease',
                marginTop: '12px'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#d63031';
                e.target.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#fff';
                e.target.style.color = '#d63031';
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect width="20" height="20" rx="3" fill="#FF6B00"/>
                <path d="M14.5 6H5.5L3 10l2.5 4h9l2.5-4-2.5-4z" fill="white"/>
                <path d="M10 7v6M7 10h6" stroke="#FF6B00" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Continuar con Zoho (Admin)
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p style={{ color: 'var(--text-secondary)' }}>
              No es posible registrar más administradores en este momento.
            </p>
          </div>
        )}

        <div className="auth-footer">
          <p>
            ¿Eres un usuario regular? <Link to="/register">Regístrate aquí</Link>
          </p>
          <p>
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
