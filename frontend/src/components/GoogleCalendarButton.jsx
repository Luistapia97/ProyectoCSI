import { useState, useEffect } from 'react';
import api from '../services/api';
import './GoogleCalendarButton.css';

export default function GoogleCalendarButton({ taskId, task, onSync }) {
  const [status, setStatus] = useState({ connected: false, loading: true });
  const [syncing, setSyncing] = useState(false);
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    checkCalendarStatus();
  }, []);

  useEffect(() => {
    checkTaskSync();
  }, [taskId, task, task?.googleCalendarEventIds]);

  const checkCalendarStatus = async () => {
    try {
      const res = await api.get('/calendar/status');
      setStatus({ connected: res.data.connected, loading: false });
    } catch (error) {
      console.error('Error verificando estado de Calendar:', error);
      setStatus({ connected: false, loading: false });
    }
  };

  const checkTaskSync = () => {
    // Verificar si la tarea tiene eventos de Google Calendar
    if (task?.googleCalendarEventIds && task.googleCalendarEventIds.length > 0) {
      setIsSynced(true);
    } else {
      setIsSynced(false);
    }
  };

  const handleGoogleAuth = () => {
    // Redirigir a la ruta de autenticación de Google
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  const handleSyncTask = async () => {
    if (!taskId) return;

    setSyncing(true);
    try {
      const res = await api.post(`/calendar/sync-task/${taskId}`);
      
      if (res.data.success) {
        setIsSynced(true); // Actualizar estado local inmediatamente
        alert('✅ Tarea sincronizada con Google Calendar');
        if (onSync) {
          await onSync(); // Esperar a que se recargue la tarea
        }
      }
    } catch (error) {
      console.error('Error sincronizando tarea:', error);
      alert('❌ Error al sincronizar con Google Calendar: ' + (error.response?.data?.message || error.message));
    } finally {
      setSyncing(false);
    }
  };

  const handleUnsyncTask = async () => {
    if (!taskId) return;

    setSyncing(true);
    try {
      const res = await api.delete(`/calendar/unsync-task/${taskId}`);
      
      if (res.data.success) {
        setIsSynced(false); // Actualizar estado local inmediatamente
        alert('✅ Evento eliminado de Google Calendar');
        if (onSync) {
          await onSync(); // Esperar a que se recargue la tarea
        }
      }
    } catch (error) {
      console.error('Error eliminando evento:', error);
      alert('❌ Error al eliminar de Google Calendar: ' + (error.response?.data?.message || error.message));
    } finally {
      setSyncing(false);
    }
  };

  if (status.loading) {
    return <div className="calendar-loading">Verificando conexión...</div>;
  }

  if (!status.connected) {
    return (
      <div className="google-calendar-section">
        <button 
          className="google-auth-button"
          onClick={handleGoogleAuth}
        >
          <svg className="google-icon" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Conectar con Google Calendar
        </button>
        <p className="calendar-hint">Conecta tu cuenta para sincronizar tareas con recordatorios</p>
      </div>
    );
  }

  return (
    <div className="google-calendar-section connected">
      <div className="calendar-status">
        <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
        <span>Google Calendar conectado</span>
      </div>
      
      {isSynced && (
        <div className="sync-status-badge">
          <svg className="sync-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          <span>Sincronizado con Calendar</span>
        </div>
      )}
      
      {taskId && (
        <div className="sync-actions">
          {!isSynced ? (
            <button 
              className="sync-button"
              onClick={handleSyncTask}
              disabled={syncing}
            >
              {syncing ? 'Sincronizando...' : '📅 Sincronizar con Calendar'}
            </button>
          ) : (
            <button 
              className="unsync-button"
              onClick={handleUnsyncTask}
              disabled={syncing}
            >
              {syncing ? 'Eliminando...' : '🗑️ Eliminar de Calendar'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
