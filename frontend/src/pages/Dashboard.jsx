import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Folder, LogOut, Moon, Sun, TrendingUp, UserPlus, Shield, User as UserIcon, Trash2, AlertCircle, UserCheck, Users, Archive, Settings, CheckCircle2, Clock, AlertTriangle, FileText } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useProjectStore from '../store/projectStore';
import CreateProjectModal from '../components/CreateProjectModal';
import CreateUserModal from '../components/CreateUserModal';
import PendingUsersModal from '../components/PendingUsersModal';
import ManageUsersModal from '../components/ManageUsersModal';
import ArchivedProjectsModal from '../components/ArchivedProjectsModal';
import ProjectActiveTasks from '../components/ProjectActiveTasks';
import NotificationBell from '../components/NotificationBell';
import ReportsManager from '../components/ReportsManager';
import socketService from '../services/socket';
import { authAPI, projectsAPI, tasksAPI, getBackendURL } from '../services/api';
import { useToast } from '../hooks/useToast';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import '../components/ReportsManager.css';
import './Dashboard.css';

function MemberAvatar({ member, className }) {
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

  const avatarUrl = getAvatarUrl(member.user.avatar);

  if (!avatarUrl || imageError) {
    return (
      <div className={`${className} avatar-initials`} title={member.user.name}>
        {getInitials(member.user.name)}
      </div>
    );
  }

  return (
    <img 
      src={avatarUrl} 
      alt={member.user.name} 
      className={className}
      title={member.user.name}
      onError={() => setImageError(true)}
    />
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout, loadUser } = useAuthStore();
  const { projects, fetchProjects, deleteProject, loading } = useProjectStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showPendingUsersModal, setShowPendingUsersModal] = useState(false);
  const [showManageUsersModal, setShowManageUsersModal] = useState(false);
  const [showArchivedProjects, setShowArchivedProjects] = useState(false);
  const [showReportsManager, setShowReportsManager] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [pendingUsersCount, setPendingUsersCount] = useState(0);
  const [theme, setTheme] = useState('light');
  const [confirmDialog, setConfirmDialog] = useState(null);
  const { showToast, toasts, removeToast } = useToast();
  const [userStats, setUserStats] = useState({
    activeTasks: 0,
    pendingValidation: 0,
    tasksDueSoon: 0,
  });
  
  const isAdmin = user?.role === 'administrador';

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

  useEffect(() => {
    fetchProjects();
    fetchUserStats();
    
    // Conectar al socket y unirse al room del usuario
    if (user?._id) {
      const socket = socketService.connect();
      socketService.joinUser(user._id);
    }

    // Si es admin, obtener usuarios pendientes
    if (isAdmin) {
      fetchPendingUsers();
    }

    // Listener para recargar usuario cuando vuelve de otra página
    const handleFocus = () => {
      loadUser(); // Recargar usuario desde el backend
    };

    const handleProjectsUpdated = () => {
      fetchProjects();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('projectsUpdated', handleProjectsUpdated);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('projectsUpdated', handleProjectsUpdated);
    };
  }, [fetchProjects, user, isAdmin, loadUser]);

  const fetchPendingUsers = async () => {
    try {
      const response = await authAPI.getPendingUsers();
      setPendingUsersCount(response.data.count || 0);
    } catch (error) {
      console.error('Error obteniendo usuarios pendientes:', error);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await tasksAPI.getUserStats();
      setUserStats(response.data);
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const getProjectStats = (project) => {
    const total = project.stats?.totalTasks || 0;
    const completed = project.stats?.completedTasks || 0;
    // Usar el porcentaje calculado en el backend basado en columnas
    const percentage = project.stats?.progressPercentage ?? 0;
    return { total, completed, percentage };
  };

  const handleDeleteProject = async (e, projectId, projectName) => {
    e.stopPropagation(); // Evitar que se abra el proyecto
    
    setConfirmDialog({
      title: 'Eliminar Proyecto',
      message: `¿Estás seguro de eliminar el proyecto "${projectName}"?\n\nEsta acción archivará el proyecto y todas sus tareas.`,
      type: 'danger',
      confirmText: 'Eliminar',
      onConfirm: async () => {
        const result = await deleteProject(projectId);
        if (result.success) {
          showToast('Proyecto eliminado exitosamente', 'success');
        } else {
          showToast('Error: ' + result.error, 'error');
        }
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null)
    });
  };

  const handleArchiveProject = async (e, projectId, projectName) => {
    e.stopPropagation(); // Evitar que se abra el proyecto
    
    setConfirmDialog({
      title: 'Archivar Proyecto',
      message: `¿Estás seguro de archivar el proyecto "${projectName}"?\n\nPodrás desarchivarlo después desde el menú de archivados.`,
      type: 'warning',
      confirmText: 'Archivar',
      onConfirm: async () => {
        try {
          await projectsAPI.archive(projectId, true);
          showToast('Proyecto archivado exitosamente', 'success');
          fetchProjects();
        } catch (error) {
          console.error('Error archivando proyecto:', error);
          showToast('Error al archivar proyecto', 'error');
        } finally {
          setConfirmDialog(null);
        }
      },
      onCancel: () => setConfirmDialog(null)
    });
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>
            <img src="/csi-logo.png" alt="CSI Logo" className="dashboard-logo" />
            Proyectos CSI
          </h1>
        </div>

        <div className="header-right">
          <button onClick={toggleTheme} className="btn-icon" title="Cambiar tema">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          <NotificationBell />

          {isAdmin && pendingUsersCount > 0 && (
            <button 
              onClick={() => setShowPendingUsersModal(true)} 
              className="btn-icon btn-pending-users" 
              title={`${pendingUsersCount} usuario(s) pendiente(s) de aprobación`}
            >
              <UserCheck size={20} />
              {pendingUsersCount > 0 && (
                <span className="pending-badge">{pendingUsersCount}</span>
              )}
            </button>
          )}

          <div className="user-menu" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }} title="Ver mi perfil">
            {getAvatarUrl(user?.avatar) ? (
              <img 
                src={getAvatarUrl(user?.avatar)} 
                alt={user?.name} 
                className="avatar"
              />
            ) : (
              <div className="avatar avatar-initials">
                {getInitials(user?.name)}
              </div>
            )}
            <div className="user-info">
              <span className="user-name">{user?.name}</span>
              <span className="user-role" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                color: isAdmin ? '#f59e0b' : '#6366f1'
              }}>
                {isAdmin ? <Shield size={14} /> : <UserIcon size={14} />}
                {isAdmin ? 'Administrador' : 'Usuario'}
              </span>
            </div>
          </div>

          {isAdmin && (
            <div className="settings-menu-container">
              <button 
                onClick={() => setShowSettingsMenu(!showSettingsMenu)} 
                className="btn-icon" 
                title="Configuración"
              >
                <Settings size={20} />
              </button>
              
              {showSettingsMenu && (
                <>
                  <div className="settings-backdrop" onClick={() => setShowSettingsMenu(false)}></div>
                  <div className="settings-dropdown">
                    <button 
                      onClick={() => {
                        setShowReportsManager(true);
                        setShowSettingsMenu(false);
                      }}
                      className="settings-item"
                    >
                      <FileText size={18} />
                      <span>Reportes de Seguimiento</span>
                    </button>
                    <button 
                      onClick={() => {
                        setShowArchivedProjects(true);
                        setShowSettingsMenu(false);
                      }}
                      className="settings-item"
                    >
                      <Archive size={18} />
                      <span>Proyectos Archivados</span>
                    </button>
                    <button 
                      onClick={() => {
                        setShowManageUsersModal(true);
                        setShowSettingsMenu(false);
                      }}
                      className="settings-item"
                    >
                      <Users size={18} />
                      <span>Gestionar Usuarios</span>
                    </button>
                    <button 
                      onClick={() => {
                        setShowCreateUserModal(true);
                        setShowSettingsMenu(false);
                      }}
                      className="settings-item"
                    >
                      <UserPlus size={18} />
                      <span>Crear Usuario</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          <button onClick={handleLogout} className="btn-icon" title="Cerrar sesión">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        <div className="dashboard-intro">
          <div>
            <h2>Bienvenido, {user?.name?.split(' ')[0]} 👋</h2>
            <p>
              {isAdmin 
                ? 'Panel de administración - Crea proyectos, tareas y gestiona usuarios' 
                : 'Visualiza y completa las tareas asignadas a ti'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* Estadísticas del usuario */}
            <div className="user-stats-container">
              <div className="user-stat-card">
                <div className="stat-icon stat-icon-active">
                  <CheckCircle2 size={18} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{userStats.activeTasks}</span>
                  <span className="stat-label">Activas</span>
                </div>
              </div>
              <div className="user-stat-card">
                <div className="stat-icon stat-icon-validation">
                  <Clock size={18} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{userStats.pendingValidation}</span>
                  <span className="stat-label">Por validar</span>
                </div>
              </div>
              <div className="user-stat-card">
                <div className="stat-icon stat-icon-due">
                  <AlertTriangle size={18} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{userStats.tasksDueSoon}</span>
                  <span className="stat-label">Por vencer</span>
                </div>
              </div>
            </div>

            {isAdmin && (
              <button onClick={() => setShowCreateModal(true)} className="btn-create">
                <Plus size={20} />
                Nuevo Proyecto
              </button>
            )}
            {!isAdmin && projects.length === 0 && (
              <div style={{ 
                padding: '12px 20px', 
                background: 'var(--bg-secondary)', 
                borderRadius: '8px',
                color: 'var(--text-secondary)',
                fontSize: '14px'
              }}>
                El administrador te asignará proyectos y tareas pronto
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Cargando proyectos...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <Folder size={64} />
            <h3>No tienes proyectos aún</h3>
            <p>Crea tu primer proyecto para comenzar a organizar tu trabajo</p>
            <button onClick={() => setShowCreateModal(true)} className="btn-primary">
              <Plus size={20} />
              Crear primer proyecto
            </button>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((project) => {
              const stats = getProjectStats(project);
              return (
                <div
                  key={project._id}
                  className="project-card"
                  onClick={() => navigate(`/project/${project._id}`)}
                  style={{ borderTopColor: project.color }}
                >
                  <div className="project-header">
                    <div className="project-color" style={{ backgroundColor: project.color }}></div>
                    <h3>{project.name}</h3>
                    {isAdmin && (
                      <div className="project-actions">
                        <button
                          className="btn-archive-project"
                          onClick={(e) => handleArchiveProject(e, project._id, project.name)}
                          title="Archivar proyecto"
                        >
                          <Archive size={16} />
                        </button>
                        <button
                          className="btn-delete-project"
                          onClick={(e) => handleDeleteProject(e, project._id, project.name)}
                          title="Eliminar proyecto"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  {project.description && (
                    <p className="project-description">{project.description}</p>
                  )}

                  <div className="project-tags">
                    {project.tags?.slice(0, 3).map((tag, index) => (
                      <span key={index} className="tag">{tag}</span>
                    ))}
                  </div>

                  <div className="project-stats">
                    <div className="stat">
                      <span className="stat-value">{stats.total}</span>
                      <span className="stat-label">Tareas</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{stats.completed}</span>
                      <span className="stat-label">Completadas</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{stats.percentage}%</span>
                      <span className="stat-label">Progreso</span>
                    </div>
                  </div>

                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${stats.percentage}%`,
                        backgroundColor: project.color 
                      }}
                    ></div>
                  </div>

                  <ProjectActiveTasks projectId={project._id} />

                  <div className="project-members">
                    {project.members?.slice(0, 4).map((member) => (
                      <MemberAvatar key={member.user._id} member={member} className="member-avatar" />
                    ))}
                    {project.members?.length > 4 && (
                      <span className="more-members">+{project.members.length - 4}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showCreateModal && (
        <CreateProjectModal onClose={() => setShowCreateModal(false)} />
      )}

      {showCreateUserModal && (
        <CreateUserModal 
          onClose={() => setShowCreateUserModal(false)}
          onUserCreated={(user) => {
            console.log('Usuario creado:', user);
            // Opcional: Mostrar notificación de éxito
          }}
        />
      )}

      {showPendingUsersModal && (
        <PendingUsersModal 
          onClose={() => {
            setShowPendingUsersModal(false);
            fetchPendingUsers(); // Actualizar contador
          }}
        />
      )}
      {showManageUsersModal && (
        <ManageUsersModal 
          onClose={() => setShowManageUsersModal(false)}
        />
      )}
      {showArchivedProjects && (
        <ArchivedProjectsModal 
          onClose={() => setShowArchivedProjects(false)}
        />
      )}

      {showReportsManager && (
        <div className="modal-overlay" onClick={() => setShowReportsManager(false)}>
          <div className="reports-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="close-reports-btn"
              onClick={() => setShowReportsManager(false)}
            >
              ✕
            </button>
            <ReportsManager />
          </div>
        </div>
      )}
      
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
}
