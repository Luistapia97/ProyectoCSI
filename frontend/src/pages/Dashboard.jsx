import { useEffect, useState } from 'react';
import { useNavigate } from 'reactrouterdom';
import { Plus, Folder, LogOut, Moon, Sun, TrendingUp, UserPlus, Shield, User as UserIcon } from 'lucidereact';
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
    document.documentElement.setAttribute('datatheme', newTheme);
  };

  const getProjectStats = (project) => {
    const total = project.stats?.totalTasks || 0;
    const completed = project.stats?.completedTasks || 0;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  };

  return (
    <div className="dashboard">
      <header className="dashboardheader">
        <div className="headerleft">
          <h1>
            <TrendingUp size={32} />
            Nexus
          </h1>
        </div>

        <div className="headerright">
          <button onClick={toggleTheme} className="btnicon" title="Cambiar tema">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          <NotificationBell />

          <div className="usermenu">
            <img src={user?.avatar} alt={user?.name} className="avatar" />
            <div className="userinfo">
              <span className="username">{user?.name}</span>
              <span className="userrole" style={{ 
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

          <button onClick={handleLogout} className="btnicon" title="Cerrar sesión">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="dashboardcontent">
        <div className="dashboardintro">
          <div>
            <h2>Bienvenido, {user?.name?.split(' ')[0]} 👋</h2>
            <p>
              {isAdmin 
                ? 'Panel de administración  Crea proyectos, tareas y gestiona usuarios' 
                : 'Visualiza y completa las tareas asignadas a ti'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {isAdmin && (
              <>
                <button 
                  onClick={() => setShowCreateUserModal(true)} 
                  className="btnsecondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <UserPlus size={20} />
                  Crear Usuario
                </button>
                <button onClick={() => setShowCreateModal(true)} className="btncreate">
                  <Plus size={20} />
                  Nuevo Proyecto
                </button>
              </>
            )}
            {!isAdmin && projects.length === 0 && (
              <div style={{ 
                padding: '12px 20px', 
                background: 'var(bgsecondary)', 
                borderRadius: '8px',
                color: 'var(textsecondary)',
                fontSize: '14px'
              }}>
                El administrador te asignará proyectos y tareas pronto
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="loadingstate">
            <div className="spinner"></div>
            <p>Cargando proyectos...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="emptystate">
            <Folder size={64} />
            <h3>No tienes proyectos aún</h3>
            <p>Crea tu primer proyecto para comenzar a organizar tu trabajo</p>
            <button onClick={() => setShowCreateModal(true)} className="btnprimary">
              <Plus size={20} />
              Crear primer proyecto
            </button>
          </div>
        ) : (
          <div className="projectsgrid">
            {projects.map((project) => {
              const stats = getProjectStats(project);
              return (
                <div
                  key={project._id}
                  className="projectcard"
                  onClick={() => navigate(`/project/${project._id}`)}
                  style={{ borderTopColor: project.color }}
                >
                  <div className="projectheader">
                    <div className="projectcolor" style={{ backgroundColor: project.color }}></div>
                    <h3>{project.name}</h3>
                  </div>

                  {project.description && (
                    <p className="projectdescription">{project.description}</p>
                  )}

                  <div className="projecttags">
                    {project.tags?.slice(0, 3).map((tag, index) => (
                      <span key={index} className="tag">{tag}</span>
                    ))}
                  </div>

                  <div className="projectstats">
                    <div className="stat">
                      <span className="statvalue">{stats.total}</span>
                      <span className="statlabel">Tareas</span>
                    </div>
                    <div className="stat">
                      <span className="statvalue">{stats.completed}</span>
                      <span className="statlabel">Completadas</span>
                    </div>
                    <div className="stat">
                      <span className="statvalue">{stats.percentage}%</span>
                      <span className="statlabel">Progreso</span>
                    </div>
                  </div>

                  <div className="progressbar">
                    <div 
                      className="progressfill" 
                      style={{ 
                        width: `${stats.percentage}%`,
                        backgroundColor: project.color 
                      }}
                    ></div>
                  </div>

                  <div className="projectmembers">
                    {project.members?.slice(0, 4).map((member) => (
                      <img
                        key={member.user._id}
                        src={member.user.avatar}
                        alt={member.user.name}
                        className="memberavatar"
                        title={member.user.name}
                      />
                    ))}
                    {project.members?.length > 4 && (
                      <span className="moremembers">+{project.members.length  4}</span>
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

