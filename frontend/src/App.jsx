import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterAdmin from './pages/RegisterAdmin';
import Dashboard from './pages/Dashboard';
import Board from './pages/Board';
import ZohoComplete from './pages/ZohoComplete';
import AddPassword from './pages/AddPassword';
import Settings from './pages/Settings';

// Componente para rutas protegidas
function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuthStore();

  console.log('🔒 PrivateRoute - isAuthenticated:', isAuthenticated, 'loading:', loading);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div className="spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
}

// Componente para manejar el callback de OAuth
function AuthSuccess() {
  const navigate = useNavigate();
  const { loadUser } = useAuthStore();

  useEffect(() => {
    const handleAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      const incomplete = params.get('incomplete') === 'true';

      if (token) {
        console.log('✅ Token recibido en AuthSuccess:', token.substring(0, 20) + '...');
        localStorage.setItem('token', token);
        
        try {
          console.log('📥 Cargando usuario después de OAuth...');
          await loadUser();
          console.log('✅ Usuario cargado');
          
          // Si el perfil está incompleto, mostrar notificación
          if (incomplete) {
            console.log('⚠️ Perfil incompleto detectado');
            localStorage.setItem('showCompleteProfile', 'true');
          }
          
          console.log('✅ Redirigiendo a dashboard');
          navigate('/dashboard');
        } catch (error) {
          console.error('❌ Error cargando usuario después de OAuth:', error);
          navigate('/login');
        }
      } else {
        console.error('❌ No se recibió token en callback');
        navigate('/login');
      }
    };

    handleAuth();
  }, [navigate, loadUser]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      gap: '20px'
    }}>
      <div className="spinner"></div>
      <p>Autenticando con Zoho...</p>
    </div>
  );
}

export default function App() {
  const { loadUser } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register-admin" element={<RegisterAdmin />} />
        <Route path="/auth-success" element={<AuthSuccess />} />
        <Route path="/zoho-complete" element={<ZohoComplete />} />

        {/* Rutas protegidas */}
        <Route
          path="/add-password"
          element={
            <PrivateRoute>
              <AddPassword />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/project/:id"
          element={
            <PrivateRoute>
              <Board />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          }
        />

        {/* Redirección por defecto */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}
