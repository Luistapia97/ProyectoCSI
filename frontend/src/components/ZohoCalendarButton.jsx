import { useState, useEffect } from 'react';
import api from '../services/api';
import './ZohoCalendarButton.css';

export default function ZohoCalendarButton({ taskId, task, onSync }) {
  const [status, setStatus] = useState({ connected: false, loading: true });
  const [syncing, setSyncing] = useState(false);
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    checkCalendarStatus();
  }, []);

  useEffect(() => {
    checkTaskSync();
  }, [taskId, task, task?.zohoCalendarEventIds]);

  const checkCalendarStatus = async () => {
    try {
      const res = await api.get('/calendar/status');
      setStatus({ connected: res.data.connected, loading: false });
    } catch (error) {
      console.error('Error verificando estado de Zoho Calendar:', error);
      setStatus({ connected: false, loading: false });
    }
  };

  const checkTaskSync = () => {
    // Verificar si la tarea tiene eventos de Zoho Calendar
    if (task?.zohoCalendarEventIds && task.zohoCalendarEventIds.length > 0) {
      setIsSynced(true);
    } else {
      setIsSynced(false);
    }
  };

  const handleZohoAuth = () => {
    // Mostrar mensaje informativo
    alert(
      '📅 Para usar Zoho Calendar necesitas:\n\n' +
      '1. Cerrar sesión en Nexus\n' +
      '2. Iniciar sesión nuevamente usando el botón "Continuar con Zoho"\n' +
      '3. Una vez conectado con Zoho, tus tareas se sincronizarán automáticamente con tu calendario\n\n' +
      '💡 Las tareas asignadas a ti con fecha de vencimiento aparecerán automáticamente en tu Zoho Calendar'
    );
  };

  const handleSyncTask = async () => {
    if (!taskId) return;

    setSyncing(true);
    try {
      const res = await api.post(`/calendar/sync-task/${taskId}`);
      
      if (res.data.success) {
        setIsSynced(true);
        alert('✅ Tarea sincronizada con Zoho Calendar');
        if (onSync) {
          await onSync();
        }
      }
    } catch (error) {
      console.error('Error sincronizando tarea:', error);
      alert('❌ Error al sincronizar con Zoho Calendar: ' + (error.response?.data?.message || error.message));
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
        setIsSynced(false);
        alert('✅ Evento eliminado de Zoho Calendar');
        if (onSync) {
          await onSync();
        }
      }
    } catch (error) {
      console.error('Error eliminando evento:', error);
      alert('❌ Error al eliminar de Zoho Calendar: ' + (error.response?.data?.message || error.message));
    } finally {
      setSyncing(false);
    }
  };

  if (status.loading) {
    return <div className="calendar-loading">Verificando conexión...</div>;
  }

  if (!status.connected) {
    return (
      <div className="zoho-calendar-section">
        <button 
          className="zoho-auth-button"
          onClick={handleZohoAuth}
        >
          <svg className="zoho-icon" viewBox="0 0 24 24" width="20" height="20">
            <path fill="#FF6B00" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
            <path fill="#FF6B00" d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
          </svg>
          Conectar con Zoho Calendar
        </button>
        <p className="calendar-note">
          Conecta tu cuenta de Zoho para sincronizar tareas con tu calendario
        </p>
      </div>
    );
  }

  return (
    <div className="zoho-calendar-section">
      <div className="calendar-header">
        <div className="calendar-status">
          <svg className="zoho-icon-small" viewBox="0 0 24 24" width="16" height="16">
            <path fill="#FF6B00" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
          </svg>
          <span>Zoho Calendar conectado</span>
        </div>
      </div>

      {!task.dueDate ? (
        <p className="calendar-warning">
          ⚠️ Asigna una fecha límite para sincronizar con Zoho Calendar
        </p>
      ) : (
        <div className="calendar-actions">
          {!isSynced ? (
            <button 
              className="sync-button"
              onClick={handleSyncTask}
              disabled={syncing}
            >
              {syncing ? (
                <>
                  <span className="spinner-small"></span>
                  Sincronizando...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                  </svg>
                  Sincronizar con Zoho
                </>
              )}
            </button>
          ) : (
            <div className="synced-status">
              <div className="sync-badge">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="#10b981">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <span>Sincronizado</span>
              </div>
              <button 
                className="unsync-button"
                onClick={handleUnsyncTask}
                disabled={syncing}
              >
                {syncing ? 'Eliminando...' : 'Eliminar de Zoho'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
