import { useState, useEffect } from 'react';
import { X, Calendar, Flag, Tag, CheckSquare, Plus, Send, Trash2, Edit2, Check, CheckCircle, XCircle, UserPlus, Users, Bell } from 'lucidereact';
import { format, parseISO } from 'datefns';
import { es } from 'datefns/locale';
import useTaskStore from '../store/taskStore';
import useAuthStore from '../store/authStore';
import { authAPI, tasksAPI } from '../services/api';
import './CardDetailsModal.css';

export default function CardDetailsModal({ task: initialTask, onClose }) {
  const { user } = useAuthStore();
  const { updateTask, deleteTask, fetchComments, addComment, updateComment, deleteComment, comments, requestValidation, validateTask, currentTask, tasks, fetchTask } = useTaskStore();
  
  // Obtener la tarea actualizada del store o usar la inicial
  const task = tasks.find(t => t._id === initialTask._id) || currentTask || initialTask;
  
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
    completed: task.completed,
  });
  const [newSubtask, setNewSubtask] = useState('');
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [validationComment, setValidationComment] = useState('');
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [showUserSelector, setShowUserSelector] = useState(false);

  useEffect(() => {
    fetchComments(task._id);
    loadUsers();
  }, [task._id, fetchComments]);

  // Actualizar formData cuando la tarea cambie
  useEffect(() => {
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      completed: task.completed,
    });
  }, [task]);

  const handleUpdate = async () => {
    await updateTask(task._id, {
      ...formData,
      dueDate: formData.dueDate || undefined,
    });
    setEditing(false);
  };

  const handleDelete = async () => {
    if (confirm('¿Estás seguro de eliminar esta tarea?')) {
      await deleteTask(task._id);
      onClose();
    }
  };

  const handleToggleComplete = async () => {
    await updateTask(task._id, { completed: !task.completed });
    setFormData({ ...formData, completed: !task.completed });
  };

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return;

    const updatedSubtasks = [
      ...(task.subtasks || []),
      { title: newSubtask, completed: false },
    ];

    await updateTask(task._id, { subtasks: updatedSubtasks });
    setNewSubtask('');
  };

  const handleToggleSubtask = async (index) => {
    const updatedSubtasks = [...task.subtasks];
    updatedSubtasks[index].completed = !updatedSubtasks[index].completed;
    await updateTask(task._id, { subtasks: updatedSubtasks });
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    await addComment(task._id, newComment);
    setNewComment('');
  };

  const handleStartEditComment = (comment) => {
    setEditingCommentId(comment._id);
    setEditingCommentText(comment.content);
  };

  const handleSaveEditComment = async (commentId) => {
    if (!editingCommentText.trim()) return;
    
    const result = await updateComment(task._id, commentId, editingCommentText);
    if (result.success) {
      setEditingCommentId(null);
      setEditingCommentText('');
    }
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const handleDeleteComment = async (commentId) => {
    if (confirm('¿Estás seguro de eliminar este comentario?')) {
      await deleteComment(task._id, commentId);
    }
  };

  const handleSendReminder = async () => {
    try {
      setLoading(true);
      const response = await tasksAPI.sendReminder(task._id);
      if (response.data.success) {
        alert(`✅ Recordatorio enviado a ${response.data.notifications.length} usuario(s)`);
      }
    } catch (error) {
      console.error('Error enviando recordatorio:', error);
      alert('❌ Error al enviar recordatorio: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await authAPI.getAllUsers();
      setAvailableUsers(response.data.users || []);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  };

  const handleAssignUser = async (userId) => {
    const currentAssigned = task.assignedTo?.map(u => u._id) || [];
    
    if (currentAssigned.includes(userId)) {
      // Si ya está asignado, quitarlo
      await updateTask(task._id, {
        assignedTo: currentAssigned.filter(id => id !== userId),
      });
    } else {
      // Si no está asignado, agregarlo
      await updateTask(task._id, {
        assignedTo: [...currentAssigned, userId],
      });
    }
  };

  const handleRequestValidation = async () => {
    if (loading) return;
    setLoading(true);
    
    const result = await requestValidation(task._id);
    setLoading(false);
    
    if (result.success) {
      alert(result.message || 'Validación solicitada exitosamente');
    } else {
      alert(result.error || 'Error al solicitar validación');
    }
  };

  const handleValidateTask = async (approved) => {
    if (loading) return;
    setLoading(true);
    
    const result = await validateTask(task._id, approved, validationComment);
    setLoading(false);
    
    if (result.success) {
      alert(result.message);
      setShowValidationModal(false);
      setValidationComment('');
    } else {
      alert(result.error || 'Error al validar tarea');
    }
  };

  const isAdmin = user?.role === 'administrador';

  return (
    <div className="modaloverlay" onClick={onClose}>
      <div className="modalcontent modallarge" onClick={(e) => e.stopPropagation()}>
        <div className="modalheader">
          <div className="modaltitlesection">
            {editing ? (
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="titleinput"
              />
            ) : (
              <h2>{task.title}</h2>
            )}
          </div>
          <button onClick={onClose} className="modalclose">
            <X size={24} />
          </button>
        </div>

        <div className="modalbodysplit">
          <div className="modalmaincontent">
            {/* Descripción */}
            <div className="detailsection">
              <h3>Descripción</h3>
              {editing ? (
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="4"
                  placeholder="Agrega una descripción..."
                />
              ) : (
                <p>{task.description || 'Sin descripción'}</p>
              )}
            </div>

            {/* Subtareas */}
            <div className="detailsection">
              <h3>
                <CheckSquare size={18} />
                Subtareas ({task.subtasks?.filter(st => st.completed).length || 0}/{task.subtasks?.length || 0})
              </h3>
              <div className="subtaskslist">
                {task.subtasks?.map((subtask, index) => (
                  <div key={index} className="subtaskitem">
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={() => handleToggleSubtask(index)}
                    />
                    <span className={subtask.completed ? 'completedsubtask' : ''}>
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </div>
              <div className="addsubtask">
                <input
                  type="text"
                  placeholder="Agregar subtarea..."
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
                />
                <button onClick={handleAddSubtask} className="btniconsmall">
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {/* Comentarios */}
            <div className="detailsection">
              <h3>Comentarios ({comments.length})</h3>
              <div className="commentssection">
                <div className="commentslist">
                  {comments.map((comment) => {
                    const isAuthor = comment.user._id === user?._id;
                    const canDelete = isAuthor || isAdmin;
                    const isEditing = editingCommentId === comment._id;

                    return (
                      <div key={comment._id} className="commentitem">
                        <img src={comment.user.avatar} alt={comment.user.name} className="commentavatar" />
                        <div className="commentcontent">
                          <div className="commentheader">
                            <span className="commentauthor">{comment.user.name}</span>
                            <span className="commentdate">
                              {format(new Date(comment.createdAt), 'dd MMM HH:mm', { locale: es })}
                              {comment.edited && ' (editado)'}
                            </span>
                            {(isAuthor || canDelete) && (
                              <div className="commentactions">
                                {isAuthor && !isEditing && (
                                  <button 
                                    onClick={() => handleStartEditComment(comment)}
                                    className="btnicontiny"
                                    title="Editar comentario"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                )}
                                {canDelete && !isEditing && (
                                  <button 
                                    onClick={() => handleDeleteComment(comment._id)}
                                    className="btnicontiny btndanger"
                                    title="Eliminar comentario"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                          {isEditing ? (
                            <div className="commenteditform">
                              <input
                                type="text"
                                value={editingCommentText}
                                onChange={(e) => setEditingCommentText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSaveEditComment(comment._id);
                                  } else if (e.key === 'Escape') {
                                    handleCancelEditComment();
                                  }
                                }}
                                autoFocus
                              />
                              <div className="commenteditbuttons">
                                <button 
                                  onClick={() => handleSaveEditComment(comment._id)}
                                  className="btnicontiny btnsuccess"
                                  disabled={!editingCommentText.trim()}
                                >
                                  <Check size={14} />
                                </button>
                                <button 
                                  onClick={handleCancelEditComment}
                                  className="btnicontiny"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="commenttext">{comment.content}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <form onSubmit={handleAddComment} className="commentform">
                  <img src={user?.avatar} alt={user?.name} className="commentavatar" />
                  <input
                    type="text"
                    placeholder="Escribe un comentario..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <button type="submit" className="btniconsmall" disabled={!newComment.trim()}>
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="modalsidebar">
            {/* Acciones */}
            <div className="sidebarsection">
              {/* Estado de validación */}
              {task.pendingValidation && (
                <div className="validationstatus pending">
                  <CheckCircle size={18} />
                  <span>Pendiente de validación</span>
                </div>
              )}
              
              {task.completed && task.validatedBy && (
                <div className="validationstatus approved">
                  <CheckCircle size={18} />
                  <span>Validado por {task.validatedBy.name}</span>
                  {task.validationComment && (
                    <p className="validationcomment">"{task.validationComment}"</p>
                  )}
                </div>
              )}

              {/* Botones según el estado */}
              {!task.completed && !task.pendingValidation && (
                <button
                  onClick={handleRequestValidation}
                  className="btnprimary"
                  title="Solicitar validación al administrador"
                  disabled={loading}
                >
                  <CheckCircle size={18} />
                  {loading ? 'Solicitando...' : 'Solicitar validación'}
                </button>
              )}

              {isAdmin && task.pendingValidation && (
                <>
                  <button
                    onClick={() => setShowValidationModal(true)}
                    className="btnsuccess"
                    disabled={loading}
                  >
                    <CheckCircle size={18} />
                    Validar tarea
                  </button>
                  <button
                    onClick={() => handleValidateTask(false)}
                    className="btnwarning"
                    disabled={loading}
                  >
                    <XCircle size={18} />
                    {loading ? 'Procesando...' : 'Rechazar validación'}
                  </button>
                </>
              )}
            </div>

            {/* Detalles */}
            <div className="sidebarsection">
              <h4>Detalles</h4>
              
              <div className="detailitem">
                <label>
                  <Flag size={16} />
                  Prioridad
                </label>
                {editing ? (
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                ) : (
                  <span className={`prioritybadge priority${task.priority}`}>{task.priority}</span>
                )}
              </div>

              <div className="detailitem">
                <label>
                  <Calendar size={16} />
                  Fecha límite
                </label>
                {editing ? (
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                ) : (
                  <span>
                    {task.dueDate ? (() => {
                      // Extraer solo la parte de la fecha sin conversión de zona horaria
                      const dateStr = task.dueDate.includes('T') 
                        ? task.dueDate.split('T')[0] 
                        : task.dueDate;
                      const [year, month, day] = dateStr.split('');
                      // Crear fecha en formato local sin conversión UTC
                      return format(new Date(year, month  1, day), 'dd MMM yyyy', { locale: es });
                    })() : 'Sin fecha'}
                  </span>
                )}
              </div>

              {task.tags && task.tags.length > 0 && (
                <div className="detailitem">
                  <label>
                    <Tag size={16} />
                    Etiquetas
                  </label>
                  <div className="tagsdisplay">
                    {task.tags.map((tag, index) => (
                      <span key={index} className="detailtag">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Usuarios asignados */}
              <div className="detailitem">
                <label>
                  <Users size={16} />
                  Asignados ({task.assignedTo?.length || 0})
                </label>
                <div className="assigneduserslist">
                  {task.assignedTo && task.assignedTo.length > 0 ? (
                    task.assignedTo.map((assignedUser) => (
                      <div key={assignedUser._id} className="assigneduseritem">
                        <img 
                          src={assignedUser.avatar} 
                          alt={assignedUser.name} 
                          className="assigneduseravatar"
                        />
                        <span className="assignedusername">{assignedUser.name}</span>
                        {isAdmin && (
                          <button
                            onClick={() => handleAssignUser(assignedUser._id)}
                            className="btnremoveuser"
                            title="Quitar usuario"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="noassignedusers">Sin usuarios asignados</p>
                  )}
                </div>
                {isAdmin && (
                  <button
                    onClick={() => setShowUserSelector(!showUserSelector)}
                    className="btnadduser"
                  >
                    <UserPlus size={16} />
                    Asignar usuario
                  </button>
                )}
                
                {/* Selector de usuarios */}
                {showUserSelector && isAdmin && (
                  <div className="userselector">
                    {availableUsers.map((availableUser) => {
                      const isAssigned = task.assignedTo?.some(u => u._id === availableUser._id);
                      return (
                        <div
                          key={availableUser._id}
                          className={`useroption ${isAssigned ? 'assigned' : ''}`}
                          onClick={() => handleAssignUser(availableUser._id)}
                        >
                          <img 
                            src={availableUser.avatar} 
                            alt={availableUser.name} 
                            className="useroptionavatar"
                          />
                          <div className="useroptioninfo">
                            <span className="useroptionname">{availableUser.name}</span>
                            <span className="useroptionemail">{availableUser.email}</span>
                          </div>
                          {isAssigned && (
                            <Check size={16} className="useroptioncheck" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Botones de acción */}
            <div className="sidebaractions">
              {editing ? (
                <>
                  <button onClick={handleUpdate} className="btnprimary">
                    Guardar cambios
                  </button>
                  <button onClick={() => setEditing(false)} className="btnsecondary">
                    Cancelar
                  </button>
                </>
              ) : (
                <button onClick={() => setEditing(true)} className="btnsecondary">
                  Editar tarea
                </button>
              )}
              
              {/* Botón de recordatorio  disponible para todos los usuarios */}
              {task.assignedTo && task.assignedTo.length > 0 && (
                <button 
                  onClick={handleSendReminder} 
                  className="btnsecondary"
                  disabled={loading}
                  title="Enviar recordatorio a los usuarios asignados"
                >
                  <Bell size={18} />
                  {loading ? 'Enviando...' : 'Enviar Recordatorio'}
                </button>
              )}

              <button onClick={handleDelete} className="btndanger">
                <Trash2 size={18} />
                Eliminar tarea
              </button>
            </div>
          </div>
        </div>

        {/* Modal de validación */}
        {showValidationModal && (
          <div className="validationmodaloverlay" onClick={() => setShowValidationModal(false)}>
            <div className="validationmodal" onClick={(e) => e.stopPropagation()}>
              <h3>Validar tarea</h3>
              <p>¿Deseas aprobar esta tarea como completada?</p>
              <textarea
                placeholder="Comentario opcional..."
                value={validationComment}
                onChange={(e) => setValidationComment(e.target.value)}
                rows="3"
              />
              <div className="validationmodalbuttons">
                <button
                  onClick={() => handleValidateTask(true)}
                  className="btnsuccess"
                  disabled={loading}
                >
                  <CheckCircle size={18} />
                  {loading ? 'Aprobando...' : 'Aprobar'}
                </button>
                <button
                  onClick={() => setShowValidationModal(false)}
                  className="btnsecondary"
                  disabled={loading}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

