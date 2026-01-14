import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import useNotificationStore from '../store/notificationStore';
import socketService from '../services/socket';
import './NotificationBell.css';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  
  const { 
    notifications, 
    unreadCount, 
    loading,
    fetchNotifications, 
    markAsRead, 
    markAllAsRead,
    deleteNotification,
    addNotification
  } = useNotificationStore();

  // Obtener notificaciones al montar (solo una vez)
  useEffect(() => {
    fetchNotifications();
  }, []); // Sin dependencias para ejecutar solo una vez

  // Escuchar notificaciones en tiempo real
  useEffect(() => {
    const handleNewNotification = (notification) => {
      addNotification(notification);
      
      // Mostrar notificación del navegador si está permitido
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Nexus - ' + notification.title, {
          body: notification.message,
          icon: '/logo.png'
        });
      }
    };

    socketService.on('notification', handleNewNotification);

    return () => {
      socketService.off('notification', handleNewNotification);
    };
  }, [addNotification]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Solicitar permiso para notificaciones del navegador
  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const handleNotificationClick = async (notification) => {
    // Marcar como leída
    if (!notification.read) {
      await markAsRead(notification._id);
    }

    // Navegar según el tipo
    if (notification.relatedTask) {
      // Navegar a la tarea en el board correspondiente
      const taskId = notification.relatedTask;
      const projectId = notification.relatedProject;
      
      setIsOpen(false);
      
      if (projectId) {
        // Navegar al proyecto y abrir la tarea
        navigate(`/project/${projectId}?task=${taskId}`);
      }
    } else {
      setIsOpen(false);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handleDelete = async (e, notificationId) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button 
        className="notification-bell-button"
        onClick={() => {
          setIsOpen(!isOpen);
          requestNotificationPermission();
        }}
        title="Notificaciones"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notificaciones</h3>
            {unreadCount > 0 && (
              <button 
                className="mark-all-read-btn"
                onClick={handleMarkAllRead}
                title="Marcar todas como leídas"
              >
                <CheckCheck size={16} />
                Marcar todas
              </button>
            )}
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-loading">
                <div className="spinner-small"></div>
                <p>Cargando notificaciones...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <Bell size={48} />
                <p>No tienes notificaciones</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-content">
                    <div className="notification-title-row">
                      {!notification.read && <div className="notification-dot"></div>}
                      <h4>{notification.title}</h4>
                      <button
                        className="notification-delete-btn"
                        onClick={(e) => handleDelete(e, notification._id)}
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p className="notification-message">{notification.message}</p>
                    <span className="notification-time">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                        locale: es
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-footer">
              <button 
                className="view-all-btn"
                onClick={async () => {
                  await markAllAsRead();
                  setIsOpen(false);
                }}
              >
                Ver todas las notificaciones
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
