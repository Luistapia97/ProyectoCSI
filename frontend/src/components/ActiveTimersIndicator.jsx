import { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { tasksAPI } from '../services/api';
import socketService from '../services/socket';
import CardDetailsModal from './CardDetailsModal';
import './ActiveTimersIndicator.css';

export default function ActiveTimersIndicator() {
  const [activeTimers, setActiveTimers] = useState([]);
  const [showWarning, setShowWarning] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    // Verificar timers activos cada 30 segundos
    const checkActiveTimers = async () => {
      try {
        const response = await tasksAPI.getUserActiveTasks();
        const tasks = response.data.tasks || [];
        
        // Filtrar tareas con timer activo
        const tasksWithActiveTimer = tasks.filter(
          task => task.effortMetrics?.activeTimer?.isActive
        );
        
        setActiveTimers(tasksWithActiveTimer);

        // Verificar si es final del día laboral (después de las 6 PM)
        const currentHour = new Date().getHours();
        if (currentHour >= 18 && tasksWithActiveTimer.length > 0) {
          setShowWarning(true);
        }
      } catch (error) {
        console.error('Error verificando timers activos:', error);
      }
    };

    // Verificar inmediatamente
    checkActiveTimers();

    // Verificar cada 30 segundos
    const interval = setInterval(checkActiveTimers, 30000);

    // Escuchar actualizaciones en tiempo real
    const handleTaskUpdate = (updatedTask) => {
      if (updatedTask.effortMetrics?.activeTimer?.isActive) {
        // Si el timer está activo, agregar o actualizar en la lista
        setActiveTimers(prev => {
          const exists = prev.find(t => t._id === updatedTask._id);
          if (exists) {
            return prev.map(t => t._id === updatedTask._id ? updatedTask : t);
          } else {
            return [...prev, updatedTask];
          }
        });
      } else {
        // Si el timer no está activo, remover de la lista
        setActiveTimers(prev => prev.filter(t => t._id !== updatedTask._id));
      }
    };

    socketService.on('task-updated', handleTaskUpdate);

    return () => {
      clearInterval(interval);
      socketService.off('task-updated', handleTaskUpdate);
    };
  }, []);

  // Actualizar lista cuando se cierra el modal
  const handleCloseModal = async () => {
    setSelectedTask(null);
    // Recargar timers activos
    try {
      const response = await tasksAPI.getUserActiveTasks();
      const tasks = response.data.tasks || [];
      const tasksWithActiveTimer = tasks.filter(
        task => task.effortMetrics?.activeTimer?.isActive
      );
      setActiveTimers(tasksWithActiveTimer);
    } catch (error) {
      console.error('Error recargando timers activos:', error);
    }
  };

  // Manejar click en un timer para abrir su modal
  const handleTimerClick = (task) => {
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

  const calculateElapsedTime = (startTime) => {
    const start = new Date(startTime);
    const now = new Date();
    const seconds = Math.floor((now - start) / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (activeTimers.length === 0) {
    return null;
  }

  return (
    <div className={`active-timers-indicator ${showWarning ? 'warning' : ''}`}>
      <div className="indicator-header">
        <Clock size={16} />
        <span className="indicator-count">
          {activeTimers.length} timer{activeTimers.length !== 1 ? 's' : ''} activo{activeTimers.length !== 1 ? 's' : ''}
        </span>
        {showWarning && (
          <AlertTriangle size={16} className="warning-icon" />
        )}
      </div>
      
      {showWarning && (
        <div className="warning-message">
          ⚠️ Recuerda detener los timers antes de que agote el tiempo.
        </div>
      )}

      <div className="active-timers-list">
        {activeTimers.map((task) => (
          <div 
            key={task._id} 
            className="active-timer-item clickable"
            onClick={() => handleTimerClick(task)}
            title="Click para abrir tarea"
          >
            <span className="task-title">{task.title}</span>
            <span className="elapsed-time">
              {calculateElapsedTime(task.effortMetrics.activeTimer.startTime)}
            </span>
          </div>
        ))}
      </div>

      {/* Modal de tarea seleccionada */}
      {selectedTask && (
        <CardDetailsModal 
          key={selectedTask._id}
          task={selectedTask}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
