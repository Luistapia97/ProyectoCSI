import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { ArrowLeft, Plus, Settings, Shield, BarChart3, Layout } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useProjectStore from '../store/projectStore';
import useTaskStore from '../store/taskStore';
import socketService from '../services/socket';
import Card from '../components/Card';
import CreateCardModal from '../components/CreateCardModal';
import CardDetailsModal from '../components/CardDetailsModal';
import ProjectAnalytics from '../components/ProjectAnalytics';
import NotificationBell from '../components/NotificationBell';
import './Board.css';

export default function Board() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentProject, fetchProject } = useProjectStore();
  const { tasks, fetchTasks, reorderTask } = useTaskStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [viewMode, setViewMode] = useState('board'); // 'board' o 'analytics'
  
  const isAdmin = user?.role === 'administrador';

  // Función para calcular el progreso de una columna
  const calculateColumnProgress = (columnName) => {
    const columnTasks = getTasksByColumn(columnName);
    if (columnTasks.length === 0) return 0;

    const columnNameLower = columnName.toLowerCase();
    
    // Definir porcentajes por columna
    if (columnNameLower.includes('pendiente') || columnNameLower.includes('por hacer') || columnNameLower === 'to do') {
      return 0;
    } else if (columnNameLower.includes('progreso') || columnNameLower.includes('proceso') || columnNameLower === 'in progress') {
      return 50;
    } else if (columnNameLower.includes('completad') || columnNameLower.includes('hecho') || columnNameLower === 'done') {
      return 100;
    }
    
    // Por defecto, usar lógica basada en tareas completadas
    const completedTasks = columnTasks.filter(task => task.completed).length;
    return Math.round((completedTasks / columnTasks.length) * 100);
  };

  // Calcular progreso general del proyecto
  const calculateOverallProgress = () => {
    if (tasks.length === 0) return 0;

    let totalProgress = 0;
    tasks.forEach(task => {
      const columnProgress = calculateColumnProgress(task.column);
      totalProgress += columnProgress;
    });

    return Math.round(totalProgress / tasks.length);
  };

  useEffect(() => {
    if (id) {
      fetchProject(id);
      fetchTasks(id);
      
      // Conectar al socket y unirse al proyecto
      socketService.connect();
      socketService.joinProject(id);

      // Escuchar actualizaciones en tiempo real
      socketService.on('task-created', () => fetchTasks(id));
      socketService.on('task-updated', () => fetchTasks(id));
      socketService.on('task-moved', () => fetchTasks(id));

      return () => {
        socketService.off('task-created');
        socketService.off('task-updated');
        socketService.off('task-moved');
      };
    }
  }, [id, fetchProject, fetchTasks]);

  const getTasksByColumn = (columnName) => {
    return tasks
      .filter(task => task.column === columnName)
      .sort((a, b) => a.position - b.position);
  };

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceColumn = source.droppableId;
    const destColumn = destination.droppableId;

    // Actualización optimista
    await reorderTask({
      taskId: draggableId,
      sourceColumn,
      destColumn,
      sourceIndex: source.index,
      destIndex: destination.index,
    });

    // Recargar tareas
    fetchTasks(id);
  };

  if (!currentProject) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando proyecto...</p>
      </div>
    );
  }

  return (
    <div className="board-container">
      <header className="board-header">
        <div className="board-header-left">
          <button onClick={() => navigate('/dashboard')} className="btn-back">
            <ArrowLeft size={20} />
          </button>
          
          <div className="board-title">
            <div 
              className="project-color-indicator" 
              style={{ backgroundColor: currentProject.color }}
            />
            <div className="board-title-content">
              <h1>{currentProject.name}</h1>
              <div className="project-progress-container">
                <div className="project-progress-bar">
                  <div 
                    className="project-progress-fill" 
                    style={{ width: `${calculateOverallProgress()}%` }}
                  />
                </div>
                <span className="project-progress-text">{calculateOverallProgress()}% completado</span>
              </div>
            </div>
          </div>
        </div>

        <div className="board-header-right">
          <NotificationBell />
          
          <div className="view-mode-toggle">
            <button 
              className={`view-mode-btn ${viewMode === 'board' ? 'active' : ''}`}
              onClick={() => setViewMode('board')}
              title="Vista de tablero"
            >
              <Layout size={18} />
              <span>Tablero</span>
            </button>
            <button 
              className={`view-mode-btn ${viewMode === 'analytics' ? 'active' : ''}`}
              onClick={() => setViewMode('analytics')}
              title="Vista de análisis"
            >
              <BarChart3 size={18} />
              <span>Análisis</span>
            </button>
          </div>

          <div className="project-members-header">
            {currentProject.members?.slice(0, 5).map((member) => (
              <img
                key={member.user._id}
                src={member.user.avatar}
                alt={member.user.name}
                className="member-avatar-header"
                title={member.user.name}
              />
            ))}
          </div>

          <button className="btn-settings">
            <Settings size={20} />
          </button>
        </div>
      </header>

      {viewMode === 'analytics' ? (
        <ProjectAnalytics tasks={tasks} project={currentProject} />
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
        <div className="board-columns">
          {currentProject.columns?.map((column) => (
            <div key={column.name} className="board-column">
              <div className="column-header">
                <div>
                  <div className="column-title">
                    <div 
                      className="column-indicator" 
                      style={{ backgroundColor: column.color }}
                    />
                    <h3>{column.name}</h3>
                    <span className="task-count">
                      {getTasksByColumn(column.name).length}
                    </span>
                  </div>
                  
                  {isAdmin && (
                    <button
                      className="btn-add-card"
                      onClick={() => {
                        setSelectedColumn(column.name);
                        setShowCreateModal(true);
                      }}
                      title="Crear tarea"
                    >
                      <Plus size={18} />
                    </button>
                  )}
                </div>
              </div>

              <Droppable droppableId={column.name}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`column-content ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                  >
                    {getTasksByColumn(column.name).map((task, index) => (
                      <Draggable
                        key={task._id}
                        draggableId={task._id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={snapshot.isDragging ? 'dragging' : ''}
                          >
                            <Card
                              task={task}
                              onClick={() => setSelectedTask(task)}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {getTasksByColumn(column.name).length === 0 && (
                      <div className="empty-column">
                        <p>Arrastra tareas aquí o crea una nueva</p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
      )}

      {showCreateModal && (
        <CreateCardModal
          projectId={id}
          column={selectedColumn}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedColumn('');
          }}
        />
      )}

      {selectedTask && (
        <CardDetailsModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
