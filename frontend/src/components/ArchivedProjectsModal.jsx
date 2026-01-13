import { useState, useEffect } from 'react';
import { X, Archive, RotateCcw, Trash2, Calendar, Users } from 'lucide-react';
import { projectsAPI } from '../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '../hooks/useToast';
import ConfirmDialog from './ConfirmDialog';
import Toast from './Toast';
import '../components/Modal.css';

const ArchivedProjectsModal = ({ onClose }) => {
  const [archivedProjects, setArchivedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const { showToast, toasts, removeToast } = useToast();

  useEffect(() => {
    fetchArchivedProjects();
  }, []);

  const fetchArchivedProjects = async () => {
    try {
      setLoading(true);
      const response = await projectsAPI.getArchived();
      setArchivedProjects(response.data);
    } catch (error) {
      console.error('Error al obtener proyectos archivados:', error);
      showToast('Error al cargar proyectos archivados', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUnarchive = async (projectId, projectName) => {
    setConfirmDialog({
      title: 'Restaurar Proyecto',
      message: `¿Deseas restaurar el proyecto "${projectName}"?`,
      type: 'info',
      confirmText: 'Restaurar',
      onConfirm: async () => {
        try {
          await projectsAPI.archive(projectId, false);
          showToast('Proyecto restaurado exitosamente', 'success');
          
          // Actualizar la lista inmediatamente removiendo el proyecto
          setArchivedProjects(prev => prev.filter(p => p._id !== projectId));
          
          // Disparar evento personalizado para actualizar Dashboard
          window.dispatchEvent(new CustomEvent('projectsUpdated'));
          
          // Refrescar la lista completa después de un breve delay
          setTimeout(() => {
            fetchArchivedProjects();
          }, 500);
        } catch (error) {
          console.error('Error al restaurar proyecto:', error);
          showToast('Error al restaurar el proyecto', 'error');
        } finally {
          setConfirmDialog(null);
        }
      },
      onCancel: () => setConfirmDialog(null)
    });
  };

  const handleDelete = async (projectId, projectName) => {
    console.log('🗑️ Frontend: Intentando eliminar proyecto', { projectId, projectName });
    setConfirmDialog({
      title: 'Eliminar Permanentemente',
      message: `¿Estás seguro de ELIMINAR PERMANENTEMENTE el proyecto "${projectName}"? Esta acción no se puede deshacer y eliminará todas las tareas asociadas.`,
      type: 'danger',
      confirmText: 'Eliminar',
      onConfirm: async () => {
        try {
          console.log('🗑️ Frontend: Confirmado, llamando a API.delete...');
          const response = await projectsAPI.delete(projectId);
          console.log('✅ Frontend: Respuesta de eliminación:', response);
          showToast('Proyecto eliminado permanentemente', 'success');
          
          // Actualizar la lista inmediatamente removiendo el proyecto
          console.log('🔄 Frontend: Actualizando lista local...');
          setArchivedProjects(prev => {
            const updated = prev.filter(p => p._id !== projectId);
            console.log('📋 Frontend: Proyectos archivados antes:', prev.length, 'después:', updated.length);
            return updated;
          });
          
          // Disparar evento personalizado para actualizar Dashboard
          console.log('📢 Frontend: Disparando evento projectsUpdated');
          window.dispatchEvent(new CustomEvent('projectsUpdated'));
          
          // Refrescar la lista completa después de un breve delay
          setTimeout(() => {
            console.log('🔄 Frontend: Refrescando lista completa...');
            fetchArchivedProjects();
          }, 500);
        } catch (error) {
          console.error('❌ Frontend: Error al eliminar proyecto:', error);
          console.error('❌ Frontend: Detalles del error:', error.response?.data);
          showToast('Error al eliminar el proyecto', 'error');
        } finally {
          setConfirmDialog(null);
        }
      },
      onCancel: () => setConfirmDialog(null)
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-content">
            <Archive size={24} />
            <h2>Proyectos Archivados</h2>
          </div>
          <button onClick={onClose} className="modal-close">
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-message">Cargando proyectos archivados...</div>
          ) : archivedProjects.length === 0 ? (
            <div className="empty-state">
              <Archive size={48} style={{ opacity: 0.3 }} />
              <p>No hay proyectos archivados</p>
            </div>
          ) : (
            <div className="archived-projects-list">
              {archivedProjects.map((project) => (
                <div key={project._id} className="archived-project-card">
                  <div className="archived-project-header">
                    <div className="project-info">
                      <div className="project-color-indicator" style={{ backgroundColor: project.color }}></div>
                      <h3>{project.name}</h3>
                    </div>
                    <div className="archived-project-actions">
                      <button
                        onClick={() => handleUnarchive(project._id, project.name)}
                        className="btn-restore"
                        title="Restaurar proyecto"
                      >
                        <RotateCcw size={16} />
                        Restaurar
                      </button>
                      <button
                        onClick={() => handleDelete(project._id, project.name)}
                        className="btn-delete-archived"
                        title="Eliminar permanentemente"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {project.description && (
                    <p className="archived-project-description">{project.description}</p>
                  )}
                  
                  <div className="archived-project-meta">
                    <div className="meta-item">
                      <Calendar size={14} />
                      <span>Archivado: {format(new Date(project.updatedAt), "d 'de' MMMM, yyyy", { locale: es })}</span>
                    </div>
                    {project.members && project.members.length > 0 && (
                      <div className="meta-item">
                        <Users size={14} />
                        <span>{project.members.length} {project.members.length === 1 ? 'miembro' : 'miembros'}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
      
      {confirmDialog && <ConfirmDialog {...confirmDialog} isOpen={true} />}
    </div>
  );
};

export default ArchivedProjectsModal;
