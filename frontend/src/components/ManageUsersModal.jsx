import { useState, useEffect } from 'react';
import { X, Trash2, Shield, User as UserIcon, AlertCircle } from 'lucide-react';
import { authAPI, getBackendURL } from '../services/api';
import { useToast } from '../hooks/useToast';
import ConfirmDialog from './ConfirmDialog';
import Toast from './Toast';
import './Modal.css';

function UserAvatarManage({ user }) {
  const [imageError, setImageError] = useState(false);
  
  const getAvatarUrl = (avatarUrl) => {
    if (!avatarUrl || avatarUrl.trim() === '' || avatarUrl === 'undefined' || avatarUrl.includes('undefined') || avatarUrl === 'null') return null;
    if (avatarUrl.startsWith('http')) return avatarUrl;
    return `${getBackendURL()}${avatarUrl}`;
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return words[0].substring(0, 2).toUpperCase();
  };

  const avatarUrl = getAvatarUrl(user.avatar);

  if (!avatarUrl || imageError) {
    return (
      <div className="user-manage-avatar avatar-initials">
        {getInitials(user.name)}
      </div>
    );
  }

  return (
    <img 
      src={avatarUrl} 
      alt={user.name} 
      className="user-manage-avatar"
      onError={() => setImageError(true)}
    />
  );
}

export default function ManageUsersModal({ onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingUser, setDeletingUser] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const { showToast, toasts, removeToast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getAllUsers();
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    setConfirmDialog({
      title: 'Eliminar Usuario',
      message: `¿Estás seguro de que quieres eliminar a ${userName}? Esta acción no se puede deshacer.`,
      type: 'danger',
      confirmText: 'Eliminar',
      onConfirm: async () => {
        try {
          setDeletingUser(userId);
          await authAPI.deleteUser(userId);
          setUsers(users.filter(u => u._id !== userId));
          showToast(`Usuario ${userName} eliminado exitosamente`, 'success');
        } catch (error) {
          console.error('Error eliminando usuario:', error);
          showToast(error.response?.data?.message || 'Error al eliminar usuario', 'error');
        } finally {
          setDeletingUser(null);
          setConfirmDialog(null);
        }
      },
      onCancel: () => setConfirmDialog(null)
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content manage-users-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Gestionar Usuarios</h2>
          <button onClick={onClose} className="btn-close">
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-message">Cargando usuarios...</div>
          ) : error ? (
            <div className="error-message">
              <AlertCircle size={20} />
              {error}
            </div>
          ) : (
            <div className="users-list">
              <div className="users-list-header">
                <span>Total de usuarios: <strong>{users.length}</strong></span>
              </div>

              {users.map((user) => (
                <div key={user._id} className="user-item">
                  <UserAvatarManage user={user} />
                  
                  <div className="user-item-info">
                    <div className="user-item-name">{user.name}</div>
                    <div className="user-item-email">{user.email}</div>
                  </div>

                  <div className="user-item-role" style={{
                    color: user.role === 'administrador' ? '#f59e0b' : '#6366f1'
                  }}>
                    {user.role === 'administrador' ? <Shield size={16} /> : <UserIcon size={16} />}
                    <span>{user.role === 'administrador' ? 'Admin' : 'Usuario'}</span>
                  </div>

                  <div className="user-item-status">
                    <span className={`status-badge status-${user.status}`}>
                      {user.status === 'approved' ? 'Aprobado' : 
                       user.status === 'pending' ? 'Pendiente' : 'Rechazado'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteUser(user._id, user.name)}
                    className="btn-delete-user"
                    disabled={deletingUser === user._id}
                    title="Eliminar usuario"
                  >
                    {deletingUser === user._id ? (
                      <span className="spinner-small"></span>
                    ) : (
                      <Trash2 size={18} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
      
      {confirmDialog && <ConfirmDialog {...confirmDialog} isOpen={true} />}
    </div>
  );
}
