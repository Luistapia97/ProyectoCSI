import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import './TimeTracker.css';

function TimeTracker({ taskId, effortMetrics, onUpdate, onStopTimerRequest }) {
  const [isTracking, setIsTracking] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualHours, setManualHours] = useState('');
  const [manualMinutes, setManualMinutes] = useState('');
  const [note, setNote] = useState('');
  const intervalRef = useRef(null);

  useEffect(() => {
    // Verificar si hay un timer activo
    if (effortMetrics?.activeTimer?.isActive) {
      setIsTracking(true);
      const startTime = new Date(effortMetrics.activeTimer.startTime);
      const now = new Date();
      setElapsedTime(Math.floor((now - startTime) / 1000));
    } else {
      setIsTracking(false);
      setElapsedTime(0);
    }
  }, [effortMetrics]);

  useEffect(() => {
    if (isTracking && effortMetrics?.activeTimer?.startTime) {
      intervalRef.current = setInterval(() => {
        // Recalcular desde el startTime del servidor para evitar desfase
        const startTime = new Date(effortMetrics.activeTimer.startTime);
        const now = new Date();
        setElapsedTime(Math.floor((now - startTime) / 1000));
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isTracking, effortMetrics?.activeTimer?.startTime]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTimer = async () => {
    try {
      await api.post(`/tasks/${taskId}/time-tracking/start`);
      setIsTracking(true);
      setElapsedTime(0);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error iniciando timer:', error);
      alert(error.response?.data?.message || 'Error al iniciar timer');
    }
  };

  const handleStopTimer = async () => {
    // Si hay un callback para solicitar detener el timer, usarlo (para mostrar modal con nota)
    if (onStopTimerRequest) {
      onStopTimerRequest();
      return;
    }

    // Fallback: detener directamente si no hay callback
    try {
      await api.post(`/tasks/${taskId}/time-tracking/stop`, { note });
      setIsTracking(false);
      setElapsedTime(0);
      setNote('');
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error deteniendo timer:', error);
      alert(error.response?.data?.message || 'Error al detener timer');
    }
  };

  const handleManualEntry = async () => {
    try {
      const hours = parseInt(manualHours) || 0;
      const minutes = parseInt(manualMinutes) || 0;
      const totalMinutes = (hours * 60) + minutes;

      if (totalMinutes <= 0) {
        alert('Por favor ingresa un tiempo válido');
        return;
      }

      await api.post(`/tasks/${taskId}/time-tracking/add-session`, {
        duration: totalMinutes,
        note
      });

      setShowManualEntry(false);
      setManualHours('');
      setManualMinutes('');
      setNote('');
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error agregando sesión:', error);
      alert(error.response?.data?.message || 'Error al agregar sesión');
    }
  };

  const totalHours = effortMetrics?.actualHours || 0;
  const estimatedHours = effortMetrics?.estimatedHours || 0;
  const progress = estimatedHours > 0 ? (totalHours / estimatedHours) * 100 : 0;
  const isOverEstimate = totalHours > estimatedHours;

  // Debug: ver qué datos está recibiendo
  useEffect(() => {
    console.log('🔍 TimeTracker - effortMetrics:', {
      blockedHours: effortMetrics?.blockedHours,
      effectiveHours: effortMetrics?.effectiveHours,
      blockedBy: effortMetrics?.blockedBy,
      blockedSince: effortMetrics?.blockedSince,
      blockedUntil: effortMetrics?.blockedUntil,
      blockedReason: effortMetrics?.blockedReason,
      actualHours: effortMetrics?.actualHours,
      timeTracking: effortMetrics?.timeTracking?.length
    });
    
    if (effortMetrics?.blockedHours > 0) {
      console.log('✅ Debería mostrar tiempo bloqueado en historial');
    } else {
      console.log('❌ NO se mostrará tiempo bloqueado porque blockedHours =', effortMetrics?.blockedHours);
      if (effortMetrics?.blockedBy !== 'none') {
        console.log('⚠️ La tarea está ACTUALMENTE BLOQUEADA, desbloquéala para ver el tiempo');
      }
    }
  }, [effortMetrics]);

  return (
    <div className="time-tracker">
      <div className="tracker-header">
        <h3>⏱️ Seguimiento de Tiempo</h3>
      </div>

      {/* Timer automático */}
      <div className="timer-section">
        {isTracking ? (
          <div className="active-timer">
            <div className="timer-display">{formatTime(elapsedTime)}</div>
            <button onClick={handleStopTimer} className="btn-stop">
              ⏹️ Detener Timer
            </button>
          </div>
        ) : (
          <button onClick={handleStartTimer} className="btn-start">
            Iniciar Timer
          </button>
        )}
      </div>

      {/* Entrada manual */}
      <div className="manual-entry-section">
        <button 
          onClick={() => setShowManualEntry(!showManualEntry)}
          className="btn-manual"
        >
          Registrar tiempo manualmente
        </button>

        {showManualEntry && (
          <div className="manual-form">
            <div className="time-inputs">
              <div className="time-input-group">
                <label>Horas</label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={manualHours}
                  onChange={(e) => setManualHours(e.target.value)}
                  placeholder="0"
                />
              </div>
              <span className="time-separator">:</span>
              <div className="time-input-group">
                <label>Minutos</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={manualMinutes}
                  onChange={(e) => setManualMinutes(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            <button onClick={handleManualEntry} className="btn-save-manual">
              Guardar Sesión
            </button>
          </div>
        )}
      </div>

      {/* Nota opcional */}
      {(isTracking || showManualEntry) && (
        <div className="note-section">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nota opcional (ej: 'Implementando feature X')"
            className="note-input"
          />
        </div>
      )}

      {/* Resumen de tiempo */}
      <div className="time-summary">
        <div className="summary-row">
          <span>Tiempo estimado:</span>
          <strong>{estimatedHours}h</strong>
        </div>
        <div className="summary-row">
          <span>Tiempo registrado:</span>
          <strong className={isOverEstimate ? 'over-estimate' : ''}>
            {totalHours.toFixed(2)}h
          </strong>
        </div>
        {effortMetrics?.blockedHours > 0 && (
          <>
            <div className="summary-row">
              <span>Tiempo bloqueado:</span>
              <strong className="blocked-time">
                {effortMetrics.blockedHours.toFixed(2)}h
              </strong>
            </div>
            <div className="summary-row">
              <span>Tiempo efectivo:</span>
              <strong className="effective-time">
                {(effortMetrics.effectiveHours || 0).toFixed(2)}h
              </strong>
            </div>
          </>
        )}
        <div className="summary-row">
          <span>Progreso:</span>
          <div className="progress-bar-container">
            <div 
              className={`progress-bar ${isOverEstimate ? 'over' : ''}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="progress-text">{progress.toFixed(0)}%</span>
        </div>
      </div>

      {/* Historial de sesiones */}
      {((effortMetrics?.timeTracking && effortMetrics.timeTracking.length > 0) || 
        (effortMetrics?.blockHistory && effortMetrics.blockHistory.length > 0) || 
        effortMetrics?.blockedBy !== 'none') && (
        <div className="tracking-history">
          <h4>Historial de sesiones</h4>
          <div className="sessions-list">
            {/* Mostrar bloqueo activo actual si existe */}
            {effortMetrics?.blockedBy !== 'none' && effortMetrics?.blockedSince && (
              <div className="session-item blocked-session active-block">
                <div className="session-info">
                  <span className="session-duration blocked-duration">
                    🚫 ACTUALMENTE BLOQUEADA
                  </span>
                  <span className="session-method">
                    {effortMetrics.blockedBy.toUpperCase()}
                  </span>
                </div>
                <div className="session-date">
                  Desde: {new Date(effortMetrics.blockedSince).toLocaleDateString('es-ES', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                {effortMetrics?.blockedReason && (
                  <div className="session-note blocked-reason-note">
                    <strong>Razón:</strong> {effortMetrics.blockedReason}
                  </div>
                )}
              </div>
            )}
            
            {/* Mostrar historial de bloqueos previos */}
            {effortMetrics?.blockHistory && effortMetrics.blockHistory.slice().reverse().map((block, index) => (
              <div key={`block-${index}`} className="session-item blocked-session">
                <div className="session-info">
                  <span className="session-duration blocked-duration">
                    🚫 {block.duration.toFixed(2)}h
                  </span>
                  <span className="session-method">
                    {block.blockedBy.toUpperCase()}
                  </span>
                </div>
                <div className="session-date">
                  {new Date(block.blockedSince).toLocaleDateString('es-ES', { 
                    day: '2-digit', 
                    month: '2-digit'
                  })} - {new Date(block.blockedUntil).toLocaleDateString('es-ES', { 
                    day: '2-digit', 
                    month: '2-digit'
                  })}
                </div>
                {block.reason && (
                  <div className="session-note blocked-reason-note">
                    <strong>Razón:</strong> {block.reason}
                  </div>
                )}
              </div>
            ))}
            
            {/* Sesiones normales de trabajo */}
            {effortMetrics?.timeTracking && effortMetrics.timeTracking.slice(-5).reverse().map((session, index) => (
              <div key={index} className="session-item">
                <div className="session-info">
                  <span className="session-duration">
                    {(session.duration / 60).toFixed(2)}h
                  </span>
                  <span className="session-method">
                    {session.method === 'timer' ? '⏱️' : '✏️'}
                  </span>
                </div>
                <div className="session-date">
                  {new Date(session.startTime).toLocaleDateString()}
                </div>
                {session.note && (
                  <div className="session-note">{session.note}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default TimeTracker;
