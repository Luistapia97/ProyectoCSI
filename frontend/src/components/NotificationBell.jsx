import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, CheckCheck } from 'lucidereact';
import { formatDistanceToNow } from 'datefns';
import { es } from 'datefns/locale';
import { useNavigate } from 'reactrouterdom';
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
        new Notification('Nexus  ' + notification.title, {
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
      // Necesitamos el projectId para navegar al board
      // Por ahora cerramos el dropdown
      setIsOpen(false);
    }

    setIsOpen(false);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handleDelete = async (e, notificationId) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  return (
    <div className="notificationbellcontainer" ref={dropdownRef}>
      <button 
        className="notificationbellbutton"
        onClick={() => {
          setIsOpen(!isOpen);
          requestNotificationPermission();
        }}
        title="Notificaciones"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notificationbadge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notificationdropdown">
          <div className="notificationheader">
            <h3>Notificaciones</h3>
            {unreadCount > 0 && (
              <button 
                className="markallreadbtn"
                onClick={handleMarkAllRead}
                title="Marcar todas como leídas"
              >
                <CheckCheck size={16} />
                Marcar todas
              </button>
            )}
          </div>

          <div className="notificationlist">
            {loading ? (
              <div className="notificationloading">
                <div className="spinnersmall"></div>
                <p>Cargando notificaciones...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notificationempty">
                <Bell size={48} />
                <p>No tienes notificaciones</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`notificationitem ${!notification.read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notificationcontent">
                    <div className="notificationtitlerow">
                      {!notification.read && <div className="notificationdot"></div>}
                      <h4>{notification.title}</h4>
                      <button
                        className="notificationdeletebtn"
                        onClick={(e) => handleDelete(e, notification._id)}
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p className="notificationmessage">{notification.message}</p>
                    <span className="notificationtime">
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
            <div className="notificationfooter">
              <button 
                className="viewallbtn"
                onClick={() => {
                  setIsOpen(false);
                  // TODO: Navegar a página de notificaciones
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

