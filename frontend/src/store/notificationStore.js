import { create } from 'zustand';
import api from '../services/api';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  // Obtener notificaciones
  fetchNotifications: async () => {
    try {
      console.log('🔔 Obteniendo notificaciones...');
      set({ loading: true });
      const response = await api.get('/notifications');
      const notifications = response.data;
      const unreadCount = notifications.filter(n => !n.read).length;
      
      console.log('✅ Notificaciones obtenidas:', notifications.length, 'No leídas:', unreadCount);
      set({ notifications, unreadCount, loading: false });
    } catch (error) {
      console.error('❌ Error al obtener notificaciones:', error);
      console.error('   Response:', error.response?.data);
      console.error('   Status:', error.response?.status);
      set({ loading: false });
    }
  },

  // Marcar como leída
  markAsRead: async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      
      set(state => ({
        notifications: state.notifications.map(n =>
          n._id === notificationId ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
    } catch (error) {
      console.error('Error al marcar notificación:', error);
    }
  },

  // Marcar todas como leídas
  markAllAsRead: async () => {
    try {
      await api.put('/notifications/mark-all-read');
      
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0
      }));
    } catch (error) {
      console.error('Error al marcar todas:', error);
    }
  },

  // Eliminar notificación
  deleteNotification: async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      
      set(state => {
        const notification = state.notifications.find(n => n._id === notificationId);
        const wasUnread = notification && !notification.read;
        
        return {
          notifications: state.notifications.filter(n => n._id !== notificationId),
          unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
        };
      });
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
    }
  },

  // Agregar notificación en tiempo real (desde Socket.IO)
  addNotification: (notification) => {
    set(state => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1
    }));
  },
}));

export default useNotificationStore;
