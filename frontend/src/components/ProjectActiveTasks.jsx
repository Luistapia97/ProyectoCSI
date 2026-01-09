import { useState, useEffect } from 'react';
import { CheckSquare, Clock } from 'lucide-react';
import { tasksAPI, getBackendURL } from '../services/api';

function UserAvatarSmall({ user }) {
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
      <div className="active-tasks-avatar avatar-initials" title={user.name}>
        {getInitials(user.name)}
      </div>
    );
  }

  return (
    <img 
      src={avatarUrl} 
      alt={user.name} 
      className="active-tasks-avatar"
      title={user.name}
      onError={() => setImageError(true)}
    />
  );
}

export default function ProjectActiveTasks({ projectId }) {
  const [tasksByUser, setTasksByUser] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveTasks();
  }, [projectId]);

  const fetchActiveTasks = async () => {
    try {
      setLoading(true);
      const response = await tasksAPI.getActiveByUser(projectId);
      setTasksByUser(response.data.tasksByUser || []);
    } catch (error) {
      console.error('Error obteniendo tareas activas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="project-active-tasks">
        <div className="active-tasks-header">
          <CheckSquare size={16} />
          <span>Tareas activas</span>
        </div>
        <div className="active-tasks-loading">Cargando...</div>
      </div>
    );
  }

  if (tasksByUser.length === 0) {
    return (
      <div className="project-active-tasks">
        <div className="active-tasks-header">
          <CheckSquare size={16} />
          <span>Tareas activas</span>
        </div>
        <div className="active-tasks-empty">Sin tareas activas</div>
      </div>
    );
  }

  return (
    <div className="project-active-tasks">
      <div className="active-tasks-header">
        <CheckSquare size={16} />
        <span>Tareas por usuario</span>
      </div>
      <div className="active-tasks-list">
        {tasksByUser.map((item) => (
          <div key={item.user._id} className="active-task-item">
            <UserAvatarSmall user={item.user} />
            <span className="active-task-name">{item.user.name.split(' ')[0]}</span>
            <div className="active-task-counts">
              {item.activeTasks > 0 && (
                <span className="active-task-count active" title="Tareas activas">
                  <CheckSquare size={12} />
                  {item.activeTasks}
                </span>
              )}
              {item.pendingValidation > 0 && (
                <span className="active-task-count pending" title="Pendientes de validación">
                  <Clock size={12} />
                  {item.pendingValidation}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
