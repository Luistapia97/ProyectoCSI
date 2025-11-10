import { Calendar, User, CheckSquare, AlertCircle, CheckCircle } from 'lucidereact';
import { format, parseISO } from 'datefns';
import { es } from 'datefns/locale';
import './Card.css';

const PRIORITY_COLORS = {
  baja: '#10b981',
  media: '#f59e0b',
  alta: '#ef4444',
  urgente: '#dc2626',
};

export default function Card({ task, onClick }) {
  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const hasSubtasks = totalSubtasks > 0;

  const priorityColor = PRIORITY_COLORS[task.priority] || '#94a3b8';

  // Función para crear fecha local sin conversión UTC
  const getLocalDate = (dateStr) => {
    if (!dateStr) return null;
    const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const [year, month, day] = datePart.split('');
    return new Date(year, month  1, day);
  };

  const isOverdue = task.dueDate 
    ? getLocalDate(task.dueDate) < new Date() && !task.completed
    : false;

  return (
    <div
      className={`taskcard ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''} ${task.pendingValidation ? 'pendingvalidation' : ''}`}
      onClick={onClick}
      style={task.color ? { borderLeftColor: task.color } : {}}
    >
      {task.pendingValidation && (
        <div className="validationbadge">
          <CheckCircle size={14} />
          <span>Pendiente de validación</span>
        </div>
      )}
      
      <div className="cardheader">
        <h4 className="cardtitle">{task.title}</h4>
        <div
          className="priorityindicator"
          style={{ backgroundColor: priorityColor }}
          title={`Prioridad: ${task.priority}`}
        />
      </div>

      {task.description && (
        <p className="carddescription">{task.description}</p>
      )}

      {task.tags && task.tags.length > 0 && (
        <div className="cardtags">
          {task.tags.slice(0, 3).map((tag, index) => (
            <span key={index} className="cardtag">{tag}</span>
          ))}
        </div>
      )}

      <div className="cardfooter">
        <div className="cardmeta">
          {task.dueDate && (
            <div className={`carddate ${isOverdue ? 'overduetext' : ''}`}>
              <Calendar size={14} />
              <span>{format(getLocalDate(task.dueDate), 'dd MMM', { locale: es })}</span>
            </div>
          )}

          {hasSubtasks && (
            <div className="cardsubtasks">
              <CheckSquare size={14} />
              <span>{completedSubtasks}/{totalSubtasks}</span>
            </div>
          )}

          {task.assignedTo && task.assignedTo.length > 0 && (
            <div className="cardassignees">
              {task.assignedTo.slice(0, 2).map((user) => (
                <img
                  key={user._id}
                  src={user.avatar}
                  alt={user.name}
                  className="assigneeavatar"
                  title={user.name}
                />
              ))}
              {task.assignedTo.length > 2 && (
                <span className="moreassignees">+{task.assignedTo.length  2}</span>
              )}
            </div>
          )}
        </div>

        {isOverdue && (
          <AlertCircle size={16} className="overdueicon" />
        )}
      </div>
    </div>
  );
}

