import { useState, useEffect } from 'react';
import { X, Archive, RotateCcw, Trash2, Calendar, User, Clock, AlertCircle } from 'lucide-react';
import { tasksAPI } from '../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '../hooks/useToast';
import ConfirmDialog from './ConfirmDialog';
import Toast from './Toast';
import '../components/Modal.css';

const getStatusColor = (status) => {
  switch (status) {
    case 'pendiente':
      return '#6b7280';
    case 'en-progreso':
      return '#3b82f6';
    case 'completada':
      return '#10b981';
    default:
      return '#6b7280';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'pendiente':
      return 'Pendiente';
    case 'en-progreso':
      return 'En Progreso';
    case 'completada':
      return 'Completada';
    default:
      return status;
  }
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'baja':
      return '#10b981';
    case 'media':
      return '#f59e0b';
    case 'alta':
      return '#ef4444';
    default:
      return '#6b7280';
  }
};

const ArchivedTasksModal = ({ projectId, onClose }) => {
  const [archivedTasks, setArchivedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const { showToast, toasts, removeToast } = useToast();

  useEffect(() => {
    fetchArchivedTasks();
  }, [projectId]);

  const fetchArchivedTasks = async () => {
    try {
      setLoading(true);
      const response = await tasksAPI.getArchived(projectId);
      setArchivedTasks(response.data);
    } catch (error) {
      console.error('Error al obtener tareas archivadas:', error);
      showToast('Error al cargar tareas archivadas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUnarchive = async (taskId, taskTitle) => {
    setConfirmDialog({
      title: 'Restaurar Tarea',
      message: `¿Deseas restaurar la tarea "${taskTitle}"?`,
      type: 'info',
      confirmText: 'Restaurar',
      onConfirm: async () => {
        try {
          await tasksAPI.archive(taskId, false);
          showToast('Tarea restaurada exitosamente', 'success');
          
          // Actualizar la lista inmediatamente removiendo la tarea
          setArchivedTasks(prev => prev.filter(t => t._id !== taskId));
          
          // Disparar evento personalizado para actualizar Board
          window.dispatchEvent(new CustomEvent('tasksUpdated'));
          
          // Refrescar la lista completa después de un breve delay
          setTimeout(() => {
            fetchArchivedTasks();
          }, 500);
        } catch (error) {
          console.error('Error al restaurar tarea:', error);
          showToast('Error al restaurar la tarea', 'error');
        } finally {
          setConfirmDialog(null);
        }
      },
      onCancel: () => setConfirmDialog(null)
    });
  };

  const handleDelete = async (taskId, taskTitle) => {
    setConfirmDialog({
      title: 'Eliminar Permanentemente',
      message: `¿Estás seguro de ELIMINAR PERMANENTEMENTE la tarea "${taskTitle}"? Esta acción no se puede deshacer.`,
      type: 'danger',
      confirmText: 'Eliminar',
      onConfirm: async () => {
        try {
          await tasksAPI.delete(taskId);
          showToast('Tarea eliminada permanentemente', 'success');
          
          // Actualizar la lista inmediatamente removiendo la tarea
          setArchivedTasks(prev => prev.filter(t => t._id !== taskId));
          
          // Disparar evento personalizado para actualizar Board
          window.dispatchEvent(new CustomEvent('tasksUpdated'));
          
          // Refrescar la lista completa después de un breve delay
          setTimeout(() => {
            fetchArchivedTasks();
          }, 500);
        } catch (error) {
          console.error('Error al eliminar tarea:', error);
          showToast('Error al eliminar la tarea', 'error');
        } finally {
          setConfirmDialog(null);
        }
      },
      onCancel: () => setConfirmDialog(null)
    });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getAvatarUrl = (avatarUrl) => {
    if (!avatarUrl || 
        avatarUrl === 'undefined' || 
        avatarUrl === 'null' || 
        avatarUrl.includes('undefined') || 
        avatarUrl.trim() === '') {
      return null;
    }
    return avatarUrl.startsWith('http') ? avatarUrl : `http://localhost:5000${avatarUrl}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-content">
            <Archive size={24} />
            <h2>Tareas Archivadas</h2>
          </div>
          <button onClick={onClose} className="modal-close">
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-message">Cargando tareas archivadas...</div>
          ) : archivedTasks.length === 0 ? (
            <div className="empty-state">
              <Archive size={48} style={{ opacity: 0.3 }} />
              <p>No hay tareas archivadas</p>
            </div>
          ) : (
            <div className="archived-tasks-list">
              {archivedTasks.map((task) => (
                <div key={task._id} className="archived-task-card">
                  <div className="archived-task-header">
                    <div className="task-title-section">
                      <h3>{task.title}</h3>
                      <div className="task-badges">
                        <span 
                          className="status-badge" 
                          style={{ 
                            backgroundColor: `${getStatusColor(task.status)}20`,
                            color: getStatusColor(task.status)
                          }}
                        >
                          {getStatusText(task.status)}
                        </span>
                        <span 
                          className="priority-badge" 
                          style={{ 
                            backgroundColor: `${getPriorityColor(task.priority)}20`,
                            color: getPriorityColor(task.priority)
                          }}
                        >
                          {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div className="archived-task-actions">
                      <button
                        onClick={() => handleUnarchive(task._id, task.title)}
                        className="btn-restore"
                        title="Restaurar tarea"
                      >
                        <RotateCcw size={16} />
                        Restaurar
                      </button>
                      <button
                        onClick={() => handleDelete(task._id, task.title)}
                        className="btn-delete-archived"
                        title="Eliminar permanentemente"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {task.description && (
                    <p className="archived-task-description">{task.description}</p>
                  )}
                  
                  <div className="archived-task-meta">
                    <div className="meta-row">
                      {task.assignedTo && task.assignedTo.length > 0 && (
                        <div className="meta-item">
                          <User size={14} />
                          <div className="assigned-users">
                            {task.assignedTo.map((user) => (
                              <div key={user._id} className="mini-avatar" title={user.name}>
                                {getAvatarUrl(user.avatar) ? (
                                  <img 
                                    src={getAvatarUrl(user.avatar)} 
                                    alt={user.name}
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextElementSibling.style.display = 'flex';
                                    }}
                                  />
                                ) : null}
                                <div className="avatar-initials" style={{ display: getAvatarUrl(user.avatar) ? 'none' : 'flex' }}>
                                  {getInitials(user.name)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {task.dueDate && (
                        <div className="meta-item">
                          <Clock size={14} />
                          <span>Vencía: {format(new Date(task.dueDate), "d 'de' MMMM, yyyy", { locale: es })}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="meta-item">
                      <Calendar size={14} />
                      <span>Archivada: {format(new Date(task.updatedAt), "d 'de' MMMM, yyyy", { locale: es })}</span>
                    </div>
                    
                    {task.pendingValidation && (
                      <div className="meta-item validation-pending">
                        <AlertCircle size={14} />
                        <span>Pendiente de validación</span>
                      </div>
                    )}
                  </div>
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
      
      {confirmDialog && <ConfirmDialog {...confirmDialog} />}
    </div>
  );
};

export default ArchivedTasksModal;
