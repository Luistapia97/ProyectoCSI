import axios from 'axios';

// Detectar la URL del backend automáticamente
const getApiUrl = () => {
  // Si hay variable de entorno, usarla
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Si estamos en el navegador, detectar el host actual
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // Si el hostname es una IP o no es localhost, usar el mismo host para el backend
    // Asumiendo que el backend está en el puerto 5000
    return `${protocol}//${hostname}:5000/api`;
  }
  
  // Fallback a localhost
  return 'http://localhost:5000/api';
};

const API_URL = getApiUrl();

console.log('🌐 API URL detectada:', API_URL);

// Función para obtener la URL base del backend (sin /api)
export const getBackendURL = () => {
  return API_URL.replace('/api', '');
};

// Crear instancia de axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Importante para CORS con cookies
});

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  (config) => {
    console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ Error en request interceptor:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    console.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  registerAdmin: (data) => api.post('/auth/register-admin', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  googleAuth: () => window.location.href = `${API_URL}/auth/google`,
  getAllUsers: () => api.get('/auth/users'),
  createUser: (data) => api.post('/auth/create-user', data),
  deleteUser: (id) => api.delete(`/auth/users/${id}`),
  getAdminCount: () => api.get('/auth/admin-count'),
  getPendingUsers: () => api.get('/auth/pending-users'),
  approveUser: (id) => api.post(`/auth/approve-user/${id}`),
  rejectUser: (id) => api.post(`/auth/reject-user/${id}`),
  updateProfile: (data) => api.put('/auth/profile', data),
  uploadAvatar: (formData) => api.post('/auth/upload-avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteAvatar: () => api.delete('/auth/avatar'),
};

// Projects
export const projectsAPI = {
  getAll: () => api.get('/projects'),
  getArchived: () => api.get('/projects/archived'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  archive: (id, archived) => api.patch(`/projects/${id}/archive`, { archived }),
  addMember: (id, data) => api.post(`/projects/${id}/members`, data),
};

// Tasks
export const tasksAPI = {
  getUserStats: () => api.get('/tasks/user-stats'),
  getByProject: (projectId) => api.get(`/tasks/project/${projectId}`),
  getArchived: (projectId) => api.get(`/tasks/archived/${projectId}`),
  getActiveByUser: (projectId) => api.get(`/tasks/project/${projectId}/active-by-user`),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  archive: (id, archived) => api.patch(`/tasks/${id}/archive`, { archived }),
  reorder: (data) => api.post('/tasks/reorder', data),
  addComment: (id, data) => api.post(`/tasks/${id}/comments`, data),
  getComments: (id) => api.get(`/tasks/${id}/comments`),
  updateComment: (taskId, commentId, data) => api.put(`/tasks/${taskId}/comments/${commentId}`, data),
  deleteComment: (taskId, commentId) => api.delete(`/tasks/${taskId}/comments/${commentId}`),
  requestValidation: (id) => api.post(`/tasks/${id}/request-validation`),
  validateTask: (id, data) => api.post(`/tasks/${id}/validate`, data),
  sendReminder: (id) => api.post(`/tasks/${id}/remind`),
  uploadAttachment: (id, formData) => api.post(`/tasks/${id}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteAttachment: (taskId, attachmentId) => api.delete(`/tasks/${taskId}/attachments/${attachmentId}`),
};

// Reports
export const reportsAPI = {
  generate: () => {
    // Timeout aumentado para generación de reportes (2 minutos)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);
    
    return api.get('/reports/generate', { signal: controller.signal })
      .finally(() => clearTimeout(timeoutId));
  },
  getHistory: () => api.get('/reports/history'),
  download: async (filename) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/reports/download/${filename}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf'
        }
      });
      
      if (!response.ok) {
        // Intentar leer el mensaje de error del servidor
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error descargando el archivo');
        } catch (jsonError) {
          throw new Error(`Error descargando el archivo (${response.status})`);
        }
      }
      
      // Asegurarse de que es un PDF
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/pdf')) {
        console.warn('Advertencia: El tipo de contenido no es PDF:', contentType);
      }
      
      const blob = await response.blob();
      
      // Crear un blob con tipo explícito de PDF
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      // Limpiar después de un pequeño delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
    } catch (error) {
      console.error('Error descargando reporte:', error);
      throw error;
    }
  },
  sendEmail: (recipients) => api.post('/reports/email', { recipients }),
  trigger: () => api.post('/reports/trigger'),
  getCronStatus: () => api.get('/reports/cron-status'),
  verifyEmail: () => api.post('/reports/verify-email'),
  deleteReport: (filename) => api.delete(`/reports/${filename}`),
};

export default api;
