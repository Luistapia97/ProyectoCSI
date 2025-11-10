import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'reactrouterdom';
import { DragDropContext, Droppable, Draggable } from '@hellopangea/dnd';
import { ArrowLeft, Plus, Settings, Shield, BarChart3, Layout } from 'lucidereact';
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
      socketService.on('taskcreated', () => fetchTasks(id));
      socketService.on('taskupdated', () => fetchTasks(id));
      socketService.on('taskmoved', () => fetchTasks(id));

      return () => {
        socketService.off('taskcreated');
        socketService.off('taskupdated');
        socketService.off('taskmoved');
      };
    }
  }, [id, fetchProject, fetchTasks]);

  const getTasksByColumn = (columnName) => {
    return tasks
      .filter(task => task.column === columnName)
      .sort((a, b) => a.position  b.position);
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
      <div className="loadingcontainer">
        <div className="spinner"></div>
        <p>Cargando proyecto...</p>
      </div>
    );
  }

  return (
    <div className="boardcontainer">
      <header className="boardheader">
        <div className="boardheaderleft">
          <button onClick={() => navigate('/dashboard')} className="btnback">
            <ArrowLeft size={20} />
          </button>
          
          <div className="boardtitle">
            <div 
              className="projectcolorindicator" 
              style={{ backgroundColor: currentProject.color }}
            />
            <div className="boardtitlecontent">
              <h1>{currentProject.name}</h1>
              <div className="projectprogresscontainer">
                <div className="projectprogressbar">
                  <div 
                    className="projectprogressfill" 
                    style={{ width: `${calculateOverallProgress()}%` }}
                  />
                </div>
                <span className="projectprogresstext">{calculateOverallProgress()}% completado</span>
              </div>
            </div>
          </div>
        </div>

        <div className="boardheaderright">
          <NotificationBell />
          
          <div className="viewmodetoggle">
            <button 
              className={`viewmodebtn ${viewMode === 'board' ? 'active' : ''}`}
              onClick={() => setViewMode('board')}
              title="Vista de tablero"
            >
              <Layout size={18} />
              <span>Tablero</span>
            </button>
            <button 
              className={`viewmodebtn ${viewMode === 'analytics' ? 'active' : ''}`}
              onClick={() => setViewMode('analytics')}
              title="Vista de análisis"
            >
              <BarChart3 size={18} />
              <span>Análisis</span>
            </button>
          </div>

          <div className="projectmembersheader">
            {currentProject.members?.slice(0, 5).map((member) => (
              <img
                key={member.user._id}
                src={member.user.avatar}
                alt={member.user.name}
                className="memberavatarheader"
                title={member.user.name}
              />
            ))}
          </div>

          <button className="btnsettings">
            <Settings size={20} />
          </button>
        </div>
      </header>

      {viewMode === 'analytics' ? (
        <ProjectAnalytics tasks={tasks} project={currentProject} />
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
        <div className="boardcolumns">
          {currentProject.columns?.map((column) => (
            <div key={column.name} className="boardcolumn">
              <div className="columnheader">
                <div>
                  <div className="columntitle">
                    <div 
                      className="columnindicator" 
                      style={{ backgroundColor: column.color }}
                    />
                    <h3>{column.name}</h3>
                    <span className="taskcount">
                      {getTasksByColumn(column.name).length}
                    </span>
                  </div>
                  
                  {isAdmin && (
                    <button
                      className="btnaddcard"
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
                
                <div className="columnprogress">
                  <span className="columnprogresspercentage">
                    {calculateColumnProgress(column.name)}%
                  </span>
                </div>
              </div>

              <Droppable droppableId={column.name}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`columncontent ${snapshot.isDraggingOver ? 'draggingover' : ''}`}
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
                      <div className="emptycolumn">
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

