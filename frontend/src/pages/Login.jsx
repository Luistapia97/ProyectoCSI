import { useState } from 'react';
import { Link, useNavigate } from 'reactrouterdom';
import { LogIn, Mail, Lock } from 'lucidereact';
import useAuthStore from '../store/authStore';
import { getBackendURL } from '../services/api';
import './Auth.css';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleZohoLogin = () => {
    window.location.href = `${getBackendURL()}/api/auth/zoho`;
  };

  return (
    <div className="authcontainer">
      <div className="authcard">
        <div className="authheader">
          <LogIn className="authicon" size={48} />
          <h1>Bienvenido de nuevo</h1>
          <p>Inicia sesión en tu cuenta de Nexus</p>
        </div>

        {error && (
          <div className="errormessage">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="authform">
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

          <button type="submit" className="btnprimary" disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="divider">
          <span>o continuar con</span>
        </div>

        <button onClick={handleZohoLogin} className="btnzoho">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect width="20" height="20" rx="3" fill="#FF6B00"/>
            <path d="M14.5 6H5.5L3 10l2.5 4h9l2.542.54z" fill="white"/>
            <path d="M10 7v6M7 10h6" stroke="#FF6B00" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Continuar con Zoho
        </button>

        <div className="authfooter">
          <p>
            ¿No tienes una cuenta? <Link to="/register">Regístrate como Usuario</Link>
          </p>
          <p>
            ¿Eres administrador? <Link to="/registeradmin">Registro de Admin</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

