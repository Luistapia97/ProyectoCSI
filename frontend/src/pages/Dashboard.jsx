import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Folder, LogOut, Moon, Sun, TrendingUp, UserPlus, Shield, User as UserIcon } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useProjectStore from '../store/projectStore';
import CreateProjectModal from '../components/CreateProjectModal';
import CreateUserModal from '../components/CreateUserModal';
import NotificationBell from '../components/NotificationBell';
import socketService from '../services/socket';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { projects, fetchProjects, loading } = useProjectStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [theme, setTheme] = useState('light');
  
  const isAdmin = user?.role === 'administrador';

  useEffect(() => {
    fetchProjects();
    
    // Conectar al socket y unirse al room del usuario
    if (user?._id) {
      const socket = socketService.connect();
      socketService.joinUser(user._id);
    }
  }, [fetchProjects, user]);

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
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>
            <TrendingUp size={32} />
            Nexus
          </h1>
        </div>

        <div className="header-right">
          <button onClick={toggleTheme} className="btn-icon" title="Cambiar tema">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          <NotificationBell />

          <div className="user-menu">
            <img src={user?.avatar} alt={user?.name} className="avatar" />
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

          <div style={{ display: 'flex', gap: '12px' }}>
            {isAdmin && (
              <>
                <button 
                  onClick={() => setShowCreateUserModal(true)} 
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <UserPlus size={20} />
                  Crear Usuario
                </button>
                <button onClick={() => setShowCreateModal(true)} className="btn-create">
                  <Plus size={20} />
                  Nuevo Proyecto
                </button>
              </>
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

                  <div className="project-members">
                    {project.members?.slice(0, 4).map((member) => (
                      <img
                        key={member.user._id}
                        src={member.user.avatar}
                        alt={member.user.name}
                        className="member-avatar"
                        title={member.user.name}
                      />
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
    </div>
  );
}
