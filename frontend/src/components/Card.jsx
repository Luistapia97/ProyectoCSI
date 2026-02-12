import { Calendar, User, CheckSquare, AlertCircle, CheckCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { getBackendURL } from '../services/api';
import './Card.css';

const PRIORITY_COLORS = {
  baja: '#10b981',
  media: '#f59e0b',
  alta: '#ef4444',
  urgente: '#dc2626',
};

function UserAvatar({ user, className }) {
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
      <div className={`${className} avatar-initials`} title={user.name}>
        {getInitials(user.name)}
      </div>
    );
  }

  return (
    <img
      src={avatarUrl}
      alt={user.name}
      className={className}
      title={user.name}
      onError={() => setImageError(true)}
    />
  );
}

export default function Card({ task, onClick }) {
  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const hasSubtasks = totalSubtasks > 0;

  const priorityColor = PRIORITY_COLORS[task.priority] || '#94a3b8';

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

  // Función para crear fecha local sin conversión UTC
  const getLocalDate = (dateStr) => {
    if (!dateStr) return null;
    const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const [year, month, day] = datePart.split('-');
    return new Date(year, month - 1, day);
  };

  const isOverdue = task.dueDate 
    ? getLocalDate(task.dueDate) < new Date() && !task.completed
    : false;

  const isUrgent = task.priority === 'urgente';
  const isHighPriority = task.priority === 'alta' || task.priority === 'urgente';

  return (
    <div
      className={`task-card ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''} ${task.pendingValidation ? 'pending-validation' : ''} ${isUrgent ? 'urgent-task' : ''} ${isHighPriority ? 'high-priority-task' : ''}`}
      onClick={onClick}
      style={task.color ? { borderLeftColor: task.color } : {}}
    >
      {/* Badge de URGENTE */}
      {isUrgent && !task.completed && (
        <div className="urgent-badge">
          <span className="urgent-text">URGENTE</span>
        </div>
      )}

      {task.pendingValidation && (
        <div className="validation-badge">
          <CheckCircle size={14} />
          <span>Pendiente de validación</span>
        </div>
      )}
      
      <div className="card-header">
        <div className="card-title-container">
          {isHighPriority && !task.completed && (
            <span className="priority-flag" title={`Prioridad: ${task.priority}`}>🚩</span>
          )}
          <h4 className="card-title">{task.title}</h4>
        </div>
        <div
          className="priority-indicator"
          style={{ backgroundColor: priorityColor }}
          title={`Prioridad: ${task.priority}`}
        />
      </div>

      {task.description && (
        <p className="card-description">{task.description}</p>
      )}

      {task.tags && task.tags.length > 0 && (
        <div className="card-tags">
          {task.tags.slice(0, 3).map((tag, index) => (
            <span key={index} className="card-tag">{tag}</span>
          ))}
        </div>
      )}

      <div className="card-footer">
        <div className="card-meta">
          {task.dueDate && (
            <div className={`card-date ${isOverdue ? 'overdue-text' : ''}`}>
              <Calendar size={14} />
              <span>{format(getLocalDate(task.dueDate), 'dd MMM', { locale: es })}</span>
            </div>
          )}

          {hasSubtasks && (
            <div className="card-subtasks">
              <CheckSquare size={14} />
              <span>{completedSubtasks}/{totalSubtasks}</span>
            </div>
          )}

          {task.assignedTo && task.assignedTo.length > 0 && (
            <div className="card-assignees">
              {task.assignedTo.slice(0, 2).map((user) => (
                <UserAvatar key={user._id} user={user} className="assignee-avatar" />
              ))}
              {task.assignedTo.length > 2 && (
                <span className="more-assignees">+{task.assignedTo.length - 2}</span>
              )}
            </div>
          )}
        </div>

        {isOverdue && (
          <AlertCircle size={16} className="overdue-icon" />
        )}
      </div>
    </div>
  );
}
