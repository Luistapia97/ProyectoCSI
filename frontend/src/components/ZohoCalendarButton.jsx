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
      const res = await api.post(`/calendar/synctask/${taskId}`);
      
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
      const res = await api.delete(`/calendar/unsynctask/${taskId}`);
      
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
    return <div className="calendarloading">Verificando conexión...</div>;
  }

  if (!status.connected) {
    return (
      <div className="zohocalendarsection">
        <button 
          className="zohoauthbutton"
          onClick={handleZohoAuth}
        >
          <svg className="zohoicon" viewBox="0 0 24 24" width="20" height="20">
            <path fill="#FF6B00" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 104.48 1010S17.52 2 12 2zm0 18c4.41 083.5988s3.598 88 8 3.59 8 83.59 88 8z"/>
            <path fill="#FF6B00" d="M12 6c3.31 06 2.696 6s2.69 6 6 6 62.69 662.69666zm0 10c2.21 041.7944s1.794 44 4 1.79 4 41.79 44 4z"/>
          </svg>
          Conectar con Zoho Calendar
        </button>
        <p className="calendarnote">
          Conecta tu cuenta de Zoho para sincronizar tareas con tu calendario
        </p>
      </div>
    );
  }

  return (
    <div className="zohocalendarsection">
      <div className="calendarheader">
        <div className="calendarstatus">
          <svg className="zohoiconsmall" viewBox="0 0 24 24" width="16" height="16">
            <path fill="#FF6B00" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 104.48 1010S17.52 2 12 2zm0 18c4.41 083.5988s3.598 88 8 3.59 8 83.59 88 8z"/>
          </svg>
          <span>Zoho Calendar conectado</span>
        </div>
      </div>

      {!task.dueDate ? (
        <p className="calendarwarning">
          ⚠️ Asigna una fecha límite para sincronizar con Zoho Calendar
        </p>
      ) : (
        <div className="calendaractions">
          {!isSynced ? (
            <button 
              className="syncbutton"
              onClick={handleSyncTask}
              disabled={syncing}
            >
              {syncing ? (
                <>
                  <span className="spinnersmall"></span>
                  Sincronizando...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01.25 1.97.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c04.423.58888zm0 14c3.31 062.6966 01.01.251.97.72.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4444v3z"/>
                  </svg>
                  Sincronizar con Zoho
                </>
              )}
            </button>
          ) : (
            <div className="syncedstatus">
              <div className="syncbadge">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="#10b981">
                  <path d="M9 16.17L4.83 12l1.42 1.41L9 19 21 7l1.411.41z"/>
                </svg>
                <span>Sincronizado</span>
              </div>
              <button 
                className="unsyncbutton"
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

