import { create } from 'zustand';
import { authAPI } from '../services/api';

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,

  login: async (credentials) => {
    try {
      console.log('🔐 Intentando login con:', credentials.email);
      const response = await authAPI.login(credentials);
      console.log('✅ Login exitoso:', response.data);
      const { user, token } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      set({ user, token, isAuthenticated: true });
      
      // Notificar a otras pestañas
      window.dispatchEvent(new Event('authchange'));
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error en login:', error);
      console.error('❌ Respuesta del servidor:', error.response?.data);
      console.error('❌ Status:', error.response?.status);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al iniciar sesión' 
      };
    }
  },

  register: async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { user, token } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      set({ user, token, isAuthenticated: true });
      
      // Notificar a otras pestañas
      window.dispatchEvent(new Event('authchange'));
      
      return { success: true };
    } catch (error) {
      console.error('Error en registro:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al registrarse' 
      };
    }
  },

  registerAdmin: async (userData) => {
    try {
      const response = await authAPI.registerAdmin(userData);
      const { user, token } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      set({ user, token, isAuthenticated: true });
      
      // Notificar a otras pestañas
      window.dispatchEvent(new Event('authchange'));
      
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('Error en registro de admin:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al registrar administrador' 
      };
    }
  },

  loadUser: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ loading: false, isAuthenticated: false });
      return;
    }

    try {
      console.log('🔄 Cargando usuario con token...');
      const response = await authAPI.getMe();
      console.log('✅ Usuario cargado:', response.data.user.email);
      set({ 
        user: response.data.user,
        token: token, // Asegurar que el token esté en el estado
        isAuthenticated: true, 
        loading: false 
      });
    } catch (error) {
      console.error('❌ Error al cargar usuario:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ user: null, token: null, isAuthenticated: false, loading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
    
    // Notificar a otras pestañas
    window.dispatchEvent(new Event('authchange'));
  },

  setTheme: (theme) => {
    set((state) => ({
      user: {
        ...state.user,
        settings: {
          ...state.user.settings,
          theme,
        },
      },
    }));
  },

  // Método para sincronizar con otras pestañas
  syncAuth: () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ user, token, isAuthenticated: true, loading: false });
        console.log('🔄 Sincronizado con otra pestaña  Usuario autenticado');
      } catch (error) {
        console.error('Error al sincronizar:', error);
      }
    } else {
      set({ user: null, token: null, isAuthenticated: false, loading: false });
      console.log('🔄 Sincronizado con otra pestaña  Sesión cerrada');
    }
  },
}));

// Escuchar cambios en localStorage desde otras pestañas
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'token' || e.key === 'user' || e.key === null) {
      console.log('📢 Cambio de autenticación detectado en otra pestaña');
      useAuthStore.getState().syncAuth();
    }
  });

  // También escuchar eventos personalizados (misma pestaña)
  window.addEventListener('authchange', () => {
    console.log('📢 Cambio de autenticación en esta pestaña');
  });
}

export default useAuthStore;

