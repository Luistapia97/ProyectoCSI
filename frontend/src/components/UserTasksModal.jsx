import { useState, useEffect } from 'react';
import { X, CheckCircle2, Clock, AlertTriangle, Calendar, Flag } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { tasksAPI } from '../services/api';
import CardDetailsModal from './CardDetailsModal';
import './Modal.css';

const PRIORITY_COLORS = {
  baja: '#10b981',
  media: '#f59e0b',
  alta: '#ef4444',
  urgente: '#dc2626',
};

const PRIORITY_LABELS = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  urgente: 'Urgente',
};

export default function UserTasksModal({ type, onClose, title, icon: Icon }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [groupedTasks, setGroupedTasks] = useState({});

  useEffect(() => {
    fetchTasks();
  }, [type]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError('');
      
      let response;
      if (type === 'active') {
        response = await tasksAPI.getUserActiveTasks();
      } else if (type === 'pending-validation') {
        response = await tasksAPI.getUserPendingValidation();
      } else if (type === 'due-soon') {
        response = await tasksAPI.getUserDueSoon();
      } else if (type === 'urgent') {
        response = await tasksAPI.getUserUrgentTasks();
      }

      const fetchedTasks = response.data.tasks || [];
      setTasks(fetchedTasks);

      // Agrupar tareas por proyecto
      const grouped = fetchedTasks.reduce((acc, task) => {
        const projectId = task.project?._id || 'sin-proyecto';
        const projectName = task.project?.name || 'Sin proyecto';
        const projectColor = task.project?.color || '#3b82f6';

        if (!acc[projectId]) {
          acc[projectId] = {
            projectName,
            projectColor,
            tasks: [],
          };
        }

        acc[projectId].tasks.push(task);
        return acc;
      }, {});

      setGroupedTasks(grouped);
    } catch (error) {
      console.error('Error obteniendo tareas:', error);
      setError(error.response?.data?.message || 'Error al cargar tareas');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = (task) => {
    // Si ya hay una tarea seleccionada, cerrar primero para forzar re-render
    if (selectedTask) {
      setSelectedTask(null);
      setTimeout(() => {
        setSelectedTask(task);
      }, 10);
    } else {
      setSelectedTask(task);
    }
  };

  const handleCloseTaskDetails = () => {
    setSelectedTask(null);
    // Refrescar la lista de tareas después de cerrar el modal de detalles
    fetchTasks();
  };

  const formatDueDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      return format(parseISO(dateStr), 'dd MMM yyyy', { locale: es });
    } catch (error) {
      return dateStr;
    }
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    const datePart = dueDate.includes('T') ? dueDate.split('T')[0] : dueDate;
    const [year, month, day] = datePart.split('-');
    const taskDate = new Date(year, month - 1, day);
    return taskDate < new Date() && taskDate.toDateString() !== new Date().toDateString();
  };

  return (
    <>
      {!selectedTask && (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal-content user-tasks-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {Icon && <Icon size={24} />}
                <h2>{title}</h2>
                <span className="task-count-badge">{tasks.length}</span>
              </div>
              <button onClick={onClose} className="btn-close">
                <X size={24} />
              </button>
            </div>

          <div className="modal-body">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Cargando tareas...</p>
              </div>
            ) : error ? (
              <div className="empty-state">
                <AlertTriangle size={48} color="#ef4444" />
                <h3>Error</h3>
                <p>{error}</p>
                <button onClick={fetchTasks} className="btn-primary">
                  Reintentar
                </button>
              </div>
            ) : tasks.length === 0 ? (
              <div className="empty-state">
                <CheckCircle2 size={48} color="#22c55e" />
                <h3>¡Excelente trabajo!</h3>
                <p>No tienes tareas en esta categoría</p>
              </div>
            ) : (
              <div className="task-groups">
                {Object.entries(groupedTasks).map(([projectId, group]) => (
                  <div key={projectId} className="task-group">
                    <div 
                      className="task-group-header" 
                      style={{ borderLeftColor: group.projectColor }}
                    >
                      <span className="project-name">{group.projectName}</span>
                      <span className="task-count">{group.tasks.length} tarea{group.tasks.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="tasks-list">
                      {group.tasks.map((task) => (
                        <div 
                          key={task._id} 
                          className="task-item"
                          onClick={() => handleTaskClick(task)}
                        >
                          <div className="task-item-header">
                            <h4>{task.title}</h4>
                            {task.priority && (
                              <span 
                                className="priority-badge"
                                style={{ 
                                  backgroundColor: PRIORITY_COLORS[task.priority],
                                  color: 'white'
                                }}
                              >
                                <Flag size={12} />
                                {PRIORITY_LABELS[task.priority]}
                              </span>
                            )}
                          </div>
                          
                          {task.description && (
                            <p className="task-description">{task.description}</p>
                          )}

                          <div className="task-item-meta">
                            {task.dueDate && (
                              <span className={`task-meta-item ${isOverdue(task.dueDate) ? 'overdue' : ''}`}>
                                <Calendar size={14} />
                                {formatDueDate(task.dueDate)}
                              </span>
                            )}
                            {task.assignedTo && task.assignedTo.length > 0 && (
                              <span className="task-meta-item">
                                <CheckCircle2 size={14} />
                                {task.assignedTo.length} asignado{task.assignedTo.length !== 1 ? 's' : ''}
                              </span>
                            )}
                            {task.pendingValidation && (
                              <span className="task-meta-item validation">
                                <Clock size={14} />
                                Pendiente de validación
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button onClick={onClose} className="btn-secondary">
              Cerrar
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Modal de detalles de tarea */}
      {selectedTask && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100 }}>
          <CardDetailsModal 
            key={selectedTask._id}
            task={selectedTask} 
            onClose={handleCloseTaskDetails}
          />
        </div>
      )}
    </>
  );
}
