import { io } from 'socket.ioclient';

// Detectar la URL del socket automáticamente
const getSocketUrl = () => {
  // Si hay variable de entorno, usarla (sin el /api)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace('/api', '');
  }
  
  // Si estamos en el navegador, detectar el host actual
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // Usar el mismo host para el socket en puerto 5000
    return `${protocol}//${hostname}:5000`;
  }
  
  // Fallback a localhost
  return 'http://localhost:5000';
};

const SOCKET_URL = getSocketUrl();

console.log('🔌 Socket URL detectada:', SOCKET_URL);

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket'],
        withCredentials: true,
      });

      this.socket.on('connect', () => {
        console.log('✅ Conectado al servidor Socket.IO');
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Desconectado del servidor Socket.IO');
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinUser(userId) {
    if (this.socket) {
      this.socket.emit('joinuser', userId);
    }
  }

  joinProject(projectId) {
    if (this.socket) {
      this.socket.emit('joinproject', projectId);
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export default new SocketService();

