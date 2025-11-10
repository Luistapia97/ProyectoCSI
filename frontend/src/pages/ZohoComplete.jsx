import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'reactrouterdom';
import { Mail, User } from 'lucidereact';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { getBackendURL } from '../services/api';
import './Auth.css';

export default function ZohoComplete() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser, setToken } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    name: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoSubmitting, setAutoSubmitting] = useState(false);
  const tempToken = searchParams.get('tempToken');
  const hasEmail = searchParams.get('hasEmail') === 'true';
  const existingEmail = searchParams.get('email');
  
  // Usar ref para evitar múltiples envíos
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    if (!tempToken) {
      navigate('/login');
      return;
    }

    // IMPORTANTE: Evitar ejecutar múltiples veces
    if (hasSubmittedRef.current) {
      console.log('⚠️ Ya se procesó esta solicitud, ignorando...');
      return;
    }

    // Si el usuario ya tiene un email guardado en localStorage, usarlo automáticamente
    const savedEmail = localStorage.getItem('zohoUserEmail');
    
    if (savedEmail) {
      console.log('📧 Email guardado encontrado:', savedEmail);
      setFormData(prev => ({ ...prev, email: savedEmail }));
      setAutoSubmitting(true);
      hasSubmittedRef.current = true;
      
      // Autosubmit UNA SOLA VEZ
      submitEmail(savedEmail, '');
    } else if (hasEmail && existingEmail && !existingEmail.includes('@temp.nexus.local')) {
      // Si ya tiene un email real de Zoho, prellenar el formulario
      setFormData(prev => ({ ...prev, email: decodeURIComponent(existingEmail) }));
    }
  }, []); // Dependencias vacías para ejecutar solo una vez

  const submitEmail = async (email, name) => {
    // Verificar si ya se envió
    if (hasSubmittedRef.current && loading) {
      console.log('⚠️ Ya hay una solicitud en proceso, ignorando...');
      return;
    }

    hasSubmittedRef.current = true;
    setError('');
    setLoading(true);

    console.log('🚀 Enviando solicitud de completar registro...');
    console.log('📧 Email:', email);
    console.log('🎫 Token:', tempToken ? 'Presente' : 'Ausente');

    try {
      const response = await axios.post(`${getBackendURL()}/api/auth/zoho/complete`, {
        tempToken,
        email: email,
        name: name
      });

      console.log('✅ Respuesta del servidor:', response.data);

      if (response.data.success) {
        // Guardar el email para futuros logins
        localStorage.setItem('zohoUserEmail', email);
        
        // Guardar el token y usuario
        setToken(response.data.token);
        setUser(response.data.user);
        
        console.log('✅ Login exitoso:', response.data.message || 'Cuenta actualizada');
        
        // Pequeño delay antes de redirigir
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
      }
    } catch (err) {
      console.error('❌ Error completo:', err);
      console.error('❌ Respuesta de error:', err.response?.data);
      console.error('❌ Status:', err.response?.status);
      
      const errorMessage = err.response?.data?.message || 'Error al completar el registro';
      setError(errorMessage);
      setAutoSubmitting(false);
      hasSubmittedRef.current = false; // Permitir reintento en caso de error
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email) {
      setError('El email es requerido');
      return;
    }

    await submitEmail(formData.email, formData.name);
  };

  return (
    <div className="authcontainer">
      <div className="authcard">
        <div className="authheader">
          <div style={{ 
            width: '64px', 
            height: '64px', 
            background: '#FF6B00', 
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <svg width="32" height="32" viewBox="0 0 20 20" fill="none">
              <path d="M14.5 6H5.5L3 10l2.5 4h9l2.542.54z" fill="white"/>
              <path d="M10 7v6M7 10h6" stroke="#FF6B00" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1>{autoSubmitting ? 'Iniciando sesión...' : 'Completa tu registro con Zoho'}</h1>
          <p>{autoSubmitting ? 'Reconociendo tu cuenta...' : 'Ingresa tu email de Zoho para continuar'}</p>
        </div>

        {autoSubmitting ? (
          <div style={{
            padding: '20px',
            background: '#f0fdf4',
            border: '1px solid #22c55e',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#166534',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '10px' }}>✅ Cuenta detectada</div>
            <div>Iniciando sesión con: <strong>{formData.email}</strong></div>
          </div>
        ) : (
          <div style={{
            padding: '12px',
            background: '#fff5f0',
            border: '1px solid #FF6B00',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#dc2626',
            marginBottom: '20px',
            lineHeight: '1.5'
          }}>
            <strong>📧 Información:</strong> Ingresa el email asociado a tu cuenta de Zoho Calendar para completar tu registro.
          </div>
        )}

        {error && (
          <div className="errormessage">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="authform">
          <div className="formgroup">
            <label htmlFor="email">
              <Mail size={18} />
              Email de Zoho
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
            <label htmlFor="name">
              <User size={18} />
              Nombre completo (opcional)
            </label>
            <input
              type="text"
              id="name"
              placeholder="Tu nombre"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <button type="submit" className="btnprimary" disabled={loading}>
            {loading ? 'Completando registro...' : 'Completar registro'}
          </button>
        </form>

        <div className="authfooter">
          <p>
            ¿Quieres usar otra cuenta? <a href="/login">Volver al inicio</a>
          </p>
        </div>
      </div>
    </div>
  );
}

