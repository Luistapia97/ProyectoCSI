import { useState, useEffect } from 'react';
import { X, Check, XCircle, Mail, Calendar } from 'lucide-react';
import { authAPI } from '../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import './Modal.css';

export default function PendingUsersModal({ onClose }) {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getPendingUsers();
      setPendingUsers(response.data.users || []);
    } catch (error) {
      console.error('Error obteniendo usuarios pendientes:', error);
      alert('Error al cargar usuarios pendientes');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId, userName) => {
    if (!confirm(`¿Aprobar acceso a ${userName}?`)) return;

    try {
      await authAPI.approveUser(userId);
      alert(`✅ Usuario ${userName} aprobado exitosamente`);
      fetchPendingUsers();
    } catch (error) {
      console.error('Error aprobando usuario:', error);
      alert('Error al aprobar usuario: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleReject = async (userId, userName) => {
    if (!confirm(`¿Rechazar solicitud de ${userName}? Esta acción no se puede deshacer.`)) return;

    try {
      await authAPI.rejectUser(userId);
      alert(`Usuario ${userName} rechazado`);
      fetchPendingUsers();
    } catch (error) {
      console.error('Error rechazando usuario:', error);
      alert('Error al rechazar usuario: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
        <div className="modal-header">
          <h2>👥 Usuarios Pendientes de Aprobación</h2>
          <button onClick={onClose} className="btn-close">
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Cargando usuarios...</p>
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem', textAlign: 'center' }}>
              <Check size={48} color="#22c55e" />
              <h3>No hay solicitudes pendientes</h3>
              <p>Todos los usuarios han sido aprobados o rechazados</p>
            </div>
          ) : (
            <div className="pending-users-list">
              {pendingUsers.map((user) => (
                <div key={user._id} className="pending-user-card">
                  <div className="pending-user-info">
                    <img 
                      src={user.avatar || `https://ui-avatars.com/api/?background=6366f1&color=fff&name=${encodeURIComponent(user.name)}`}
                      alt={user.name}
                      className="user-avatar-large"
                    />
                    <div className="user-details">
                      <h3>{user.name}</h3>
                      <div className="user-meta">
                        <span><Mail size={14} /> {user.email}</span>
                        <span><Calendar size={14} /> Solicitó: {format(new Date(user.createdAt), 'dd MMM yyyy', { locale: es })}</span>
                        <span className="user-provider">
                          {user.authProvider === 'zoho' ? '🔐 Zoho OAuth' : '📧 Email'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="pending-user-actions">
                    <button 
                      onClick={() => handleApprove(user._id, user.name)}
                      className="btn-approve"
                      title="Aprobar usuario"
                    >
                      <Check size={18} />
                      Aprobar
                    </button>
                    <button 
                      onClick={() => handleReject(user._id, user.name)}
                      className="btn-reject"
                      title="Rechazar usuario"
                    >
                      <XCircle size={18} />
                      Rechazar
                    </button>
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

      <style jsx>{`
        .pending-users-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .pending-user-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem;
          border: 2px solid #e5e7eb;
          border-radius: 0.75rem;
          transition: all 0.2s;
        }

        .pending-user-card:hover {
          border-color: #6366f1;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
        }

        .pending-user-info {
          display: flex;
          gap: 1rem;
          flex: 1;
        }

        .user-avatar-large {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          object-fit: cover;
        }

        .user-details h3 {
          margin: 0 0 0.5rem 0;
          color: #1f2937;
          font-size: 1.1rem;
        }

        .user-meta {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .user-meta span {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .user-provider {
          font-weight: 600;
          color: #6366f1;
        }

        .pending-user-actions {
          display: flex;
          gap: 0.75rem;
        }

        .btn-approve,
        .btn-reject {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          border: none;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-approve {
          background: #22c55e;
          color: white;
        }

        .btn-approve:hover {
          background: #16a34a;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
        }

        .btn-reject {
          background: #ef4444;
          color: white;
        }

        .btn-reject:hover {
          background: #dc2626;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        @media (max-width: 640px) {
          .pending-user-card {
            flex-direction: column;
            gap: 1rem;
          }

          .pending-user-actions {
            width: 100%;
          }

          .btn-approve,
          .btn-reject {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
}
