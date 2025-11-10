import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import './AuthCallback.css';

export default function AuthCallback() {
  const [status, setStatus] = useState('processing');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loadUser } = useAuthStore();

  useEffect(() => {
    const handleAuth = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        console.error('Error en OAuth:', error);
        setStatus('error');
        
        // Mostrar mensaje específico según el error
        let errorMessage = 'Error de autenticación';
        if (error === 'oauth_failed') errorMessage = 'Falló la autenticación con Google';
        if (error === 'no_user') errorMessage = 'No se pudo crear el usuario';
        if (error === 'callback_error') errorMessage = 'Error en el proceso de autenticación';
        
        console.log('Mensaje de error:', errorMessage);
        
        setTimeout(() => {
          navigate('/login');
        }, 3000);
        return;
      }

      if (token) {
        try {
          console.log('✅ Token recibido, guardando...');
          // Guardar token en localStorage
          localStorage.setItem('token', token);
          
          console.log('📥 Cargando información del usuario...');
          // Cargar información del usuario
          await loadUser();
          
          console.log('✅ Usuario cargado correctamente');
          setStatus('success');
          
          // Redirigir al dashboard después de 1 segundo
          setTimeout(() => {
            navigate('/dashboard');
          }, 1000);
        } catch (error) {
          console.error('❌ Error cargando usuario:', error);
          setStatus('error');
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        }
      } else {
        console.error('❌ No se recibió token ni error');
        setStatus('error');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    };

    handleAuth();
  }, [searchParams, navigate, loadUser]);

  return (
    <div className="auth-callback">
      <div className="callback-card">
        {status === 'processing' && (
          <>
            <div className="spinner"></div>
            <h2>Procesando autenticación...</h2>
            <p>Por favor espera mientras verificamos tu cuenta de Google</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="success-icon">✓</div>
            <h2>¡Autenticación exitosa!</h2>
            <p>Bienvenido a Proyecto Nexus</p>
            <p className="redirect-text">Redirigiendo al dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="error-icon">✕</div>
            <h2>Error de autenticación</h2>
            <p>No se pudo completar el inicio de sesión con Google</p>
            <p className="redirect-text">Redirigiendo al login...</p>
          </>
        )}
      </div>
    </div>
  );
}
