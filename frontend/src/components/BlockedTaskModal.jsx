import { useState } from 'react';
import api from '../services/api';
import './BlockedTaskModal.css';

const BLOCK_TYPES = {
  external: {
    label: '🌐 Dependencia externa',
    description: 'Esperando proveedor, cliente o tercero',
    color: '#e74c3c'
  },
  dependency: {
    label: '🔗 Dependencia interna',
    description: 'Esperando otra tarea o equipo',
    color: '#f39c12'
  },
  approval: {
    label: '✅ Esperando aprobación',
    description: 'Pendiente de revisión o autorización',
    color: '#3498db'
  },
  information: {
    label: '❓ Falta información',
    description: 'Necesita aclaración o especificaciones',
    color: '#9b59b6'
  }
};

function BlockedTaskModal({ taskId, isBlocked, blockedBy, effortMetrics, onClose, onUpdate }) {
  const [selectedType, setSelectedType] = useState(blockedBy !== 'none' ? blockedBy : 'external');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBlock = async () => {
    if (!reason.trim()) {
      alert('Por favor describe la razón del bloqueo');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/tasks/${taskId}/block`, {
        blockedBy: selectedType,
        reason: reason.trim()
      });
      
      if (onUpdate) onUpdate();
      onClose();
    } catch (error) {
      console.error('Error bloqueando tarea:', error);
      alert(error.response?.data?.message || 'Error al bloquear tarea');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async () => {
    setLoading(true);
    try {
      const response = await api.post(`/tasks/${taskId}/unblock`);
      
      // Mostrar mensaje con informaci\u00f3n de extensi\u00f3n de fecha si aplica
      if (response.data.dateExtended) {
        alert(`\u2705 ${response.data.message}\n\n\ud83d\udcc5 Nueva fecha l\u00edmite actualizada.`);
      } else {
        alert('\u2705 Tarea desbloqueada exitosamente');
      }
      
      if (onUpdate) onUpdate();
      onClose();
    } catch (error) {
      console.error('Error desbloqueando tarea:', error);
      alert(error.response?.data?.message || 'Error al desbloquear tarea');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="blocked-task-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isBlocked ? '🚫 Tarea Bloqueada' : '🚫 Bloquear Tarea'}</h2>
          <button onClick={onClose} className="btn-close">×</button>
        </div>

        <div className="modal-content">
          {isBlocked ? (
            <div className="unblock-section">
              <div className="blocked-info-card">
                <div className="blocked-type">
                  <span className="blocked-icon">{BLOCK_TYPES[blockedBy]?.label?.split(' ')[0] || '🚫'}</span>
                  <span className="blocked-label">{BLOCK_TYPES[blockedBy]?.label?.substring(2) || blockedBy}</span>
                </div>
                <div className="blocked-reason">
                  <strong>Razón:</strong>
                  <p>{effortMetrics?.blockedReason || 'Sin especificar'}</p>
                </div>
                {effortMetrics?.blockedSince && (
                  <div className="blocked-since">
                    <strong>Bloqueada desde:</strong>
                    <p>{new Date(effortMetrics.blockedSince).toLocaleString('es-ES')}</p>
                  </div>
                )}
              </div>
              <p className="info-text">
                ¿Deseas desbloquear esta tarea?
              </p>
              <div className="info-banner">
                📅 <strong>Nota:</strong> Si el bloqueo fue mayor a 1 día, la fecha límite se extenderá automáticamente.
              </div>
              <button 
                onClick={handleUnblock} 
                disabled={loading}
                className="btn-unblock"
              >
                {loading ? 'Desbloqueando...' : 'Desbloquear Tarea'}
              </button>
            </div>
          ) : (
            <div className="block-section">
              <div className="block-types">
                <label className="section-label">Tipo de bloqueo</label>
                {Object.entries(BLOCK_TYPES).map(([type, data]) => (
                  <div
                    key={type}
                    className={`block-type ${selectedType === type ? 'selected' : ''}`}
                    onClick={() => setSelectedType(type)}
                    style={{ 
                      borderColor: selectedType === type ? data.color : '#e0e0e0',
                      background: selectedType === type ? `${data.color}10` : 'white'
                    }}
                  >
                    <div className="type-header">
                      <span className="type-icon" style={{ color: data.color }}>
                        {data.label.split(' ')[0]}
                      </span>
                      <span className="type-label">{data.label.substring(2)}</span>
                    </div>
                    <div className="type-description">{data.description}</div>
                  </div>
                ))}
              </div>

              <div className="reason-section">
                <label className="section-label">Describe la razón del bloqueo *</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej: Esperando respuesta del cliente sobre especificaciones..."
                  className="reason-textarea"
                  rows="4"
                />
              </div>

              <button 
                onClick={handleBlock} 
                disabled={loading || !reason.trim()}
                className="btn-block"
              >
                {loading ? 'Bloqueando...' : 'Bloquear Tarea'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BlockedTaskModal;
