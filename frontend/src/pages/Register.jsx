import { useState } from 'react';
import { Link, useNavigate } from 'reactrouterdom';
import { UserPlus, Mail, Lock, User } from 'lucidereact';
import useAuthStore from '../store/authStore';
import { getBackendURL } from '../services/api';
import './Auth.css';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

    setLoading(true);

    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
    });

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleZohoRegister = () => {
    window.location.href = `${getBackendURL()}/api/auth/zoho`;
  };

  return (
    <div className="authcontainer">
      <div className="authcard">
        <div className="authheader">
          <UserPlus className="authicon" size={48} />
          <h1>Crear cuenta</h1>
          <p>Únete a Nexus y gestiona tus tareas</p>
        </div>

        <div style={{
          padding: '12px',
          background: '#f0f9ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#1e40af',
          marginBottom: '20px',
          lineHeight: '1.5'
        }}>
          <strong>👤 Registro de Usuario:</strong> Los usuarios pueden ver y completar las tareas asignadas por los administradores.
          {' '}
          <Link to="/registeradmin" style={{ color: '#1e40af', fontWeight: 'bold', textDecoration: 'underline' }}>
            ¿Eres administrador? Click aquí
          </Link>
        </div>

        {error && (
          <div className="errormessage">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="authform">
          <div className="formgroup">
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
            />
          </div>

          <div className="formgroup">
            <label htmlFor="email">
              <Mail size={18} />
              Email
            </label>
            <input
              type="email"
              id="email"
              placeholder="tu@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="formgroup">
            <label htmlFor="password">
              <Lock size={18} />
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <div className="formgroup">
            <label htmlFor="confirmPassword">
              <Lock size={18} />
              Confirmar contraseña
            </label>
            <input
              type="password"
              id="confirmPassword"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
            />
          </div>

          <button type="submit" className="btnprimary" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <div className="divider">
          <span>o continuar con</span>
        </div>

        <button onClick={handleZohoRegister} className="btnzoho">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect width="20" height="20" rx="3" fill="#FF6B00"/>
            <path d="M14.5 6H5.5L3 10l2.5 4h9l2.542.54z" fill="white"/>
            <path d="M10 7v6M7 10h6" stroke="#FF6B00" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Continuar con Zoho
        </button>

        <div className="authfooter">
          <p>
            ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

