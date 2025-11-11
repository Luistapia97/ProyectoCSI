import { useState, useEffect } from 'react';
import { X, Calendar, Flag, Tag, CheckSquare, Plus, Send, Trash2, Edit2, Check, CheckCircle, XCircle, UserPlus, Users, Bell, Paperclip, Download, FileText } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
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
  const [uploading, setUploading] = useState(false);
  const [fileInputRef, setFileInputRef] = useState(null);

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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tamaño (10MB máximo)
    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo es demasiado grande. Máximo 10MB');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await tasksAPI.uploadAttachment(task._id, formData);
      if (response.data.attachment) {
        // Actualizar la tarea localmente
        await fetchTask(task._id);
        alert('Archivo subido exitosamente');
      }
    } catch (error) {
      console.error('Error subiendo archivo:', error);
      alert('Error al subir archivo: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!confirm('¿Estás seguro de eliminar este archivo?')) return;

    try {
      await tasksAPI.deleteAttachment(task._id, attachmentId);
      await fetchTask(task._id);
      alert('Archivo eliminado exitosamente');
    } catch (error) {
      console.error('Error eliminando archivo:', error);
      alert('Error al eliminar archivo: ' + (error.response?.data?.message || error.message));
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📽️';
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return '🗜️';
    return '📎';
  };

  const isAdmin = user?.role === 'administrador';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-section">
            {editing ? (
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="title-input"
              />
            ) : (
              <h2>{task.title}</h2>
            )}
          </div>
          <button onClick={onClose} className="modal-close">
            <X size={24} />
          </button>
        </div>

        <div className="modal-body-split">
          <div className="modal-main-content">
            {/* Descripción */}
            <div className="detail-section">
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
            <div className="detail-section">
              <h3>
                <CheckSquare size={18} />
                Subtareas ({task.subtasks?.filter(st => st.completed).length || 0}/{task.subtasks?.length || 0})
              </h3>
              <div className="subtasks-list">
                {task.subtasks?.map((subtask, index) => (
                  <div key={index} className="subtask-item">
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={() => handleToggleSubtask(index)}
                    />
                    <span className={subtask.completed ? 'completed-subtask' : ''}>
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </div>
              <div className="add-subtask">
                <input
                  type="text"
                  placeholder="Agregar subtarea..."
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
                />
                <button onClick={handleAddSubtask} className="btn-icon-small">
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {/* Archivos Adjuntos */}
            <div className="detail-section">
              <h3>
                <Paperclip size={18} />
                Archivos Adjuntos ({task.attachments?.length || 0})
              </h3>
              <div className="attachments-list">
                {task.attachments && task.attachments.length > 0 ? (
                  task.attachments.map((attachment) => (
                    <div key={attachment._id} className="attachment-item">
                      <div className="attachment-info">
                        <span className="attachment-icon">{getFileIcon(attachment.mimeType)}</span>
                        <div className="attachment-details">
                          <a
                            href={`http://localhost:5000${attachment.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="attachment-name"
                            download
                          >
                            {attachment.originalName}
                          </a>
                          <span className="attachment-meta">
                            {formatFileSize(attachment.size)} • {format(new Date(attachment.uploadedAt), 'dd MMM yyyy', { locale: es })}
                            {attachment.uploadedBy && ` • ${attachment.uploadedBy.name}`}
                          </span>
                        </div>
                      </div>
                      <div className="attachment-actions">
                        <a
                          href={`http://localhost:5000${attachment.url}`}
                          download
                          className="btn-icon-tiny"
                          title="Descargar"
                        >
                          <Download size={16} />
                        </a>
                        {(attachment.uploadedBy?._id === user?._id || isAdmin) && (
                          <button
                            onClick={() => handleDeleteAttachment(attachment._id)}
                            className="btn-icon-tiny btn-danger"
                            title="Eliminar archivo"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-attachments">No hay archivos adjuntos</p>
                )}
              </div>
              <div className="add-attachment">
                <input
                  type="file"
                  ref={(ref) => setFileInputRef(ref)}
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
                />
                <button
                  onClick={() => fileInputRef?.click()}
                  className="btn-secondary"
                  disabled={uploading}
                >
                  <Paperclip size={18} />
                  {uploading ? 'Subiendo...' : 'Adjuntar archivo'}
                </button>
                <span className="attachment-hint">Máximo 10MB • Imágenes, PDFs, Office, ZIP</span>
              </div>
            </div>

            {/* Comentarios */}
            <div className="detail-section">
              <h3>Comentarios ({comments.length})</h3>
              <div className="comments-section">
                <div className="comments-list">
                  {comments.map((comment) => {
                    const isAuthor = comment.user._id === user?._id;
                    const canDelete = isAuthor || isAdmin;
                    const isEditing = editingCommentId === comment._id;

                    return (
                      <div key={comment._id} className="comment-item">
                        <img src={comment.user.avatar} alt={comment.user.name} className="comment-avatar" />
                        <div className="comment-content">
                          <div className="comment-header">
                            <span className="comment-author">{comment.user.name}</span>
                            <span className="comment-date">
                              {format(new Date(comment.createdAt), 'dd MMM HH:mm', { locale: es })}
                              {comment.edited && ' (editado)'}
                            </span>
                            {(isAuthor || canDelete) && (
                              <div className="comment-actions">
                                {isAuthor && !isEditing && (
                                  <button 
                                    onClick={() => handleStartEditComment(comment)}
                                    className="btn-icon-tiny"
                                    title="Editar comentario"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                )}
                                {canDelete && !isEditing && (
                                  <button 
                                    onClick={() => handleDeleteComment(comment._id)}
                                    className="btn-icon-tiny btn-danger"
                                    title="Eliminar comentario"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                          {isEditing ? (
                            <div className="comment-edit-form">
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
                              <div className="comment-edit-buttons">
                                <button 
                                  onClick={() => handleSaveEditComment(comment._id)}
                                  className="btn-icon-tiny btn-success"
                                  disabled={!editingCommentText.trim()}
                                >
                                  <Check size={14} />
                                </button>
                                <button 
                                  onClick={handleCancelEditComment}
                                  className="btn-icon-tiny"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="comment-text">{comment.content}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <form onSubmit={handleAddComment} className="comment-form">
                  <img src={user?.avatar} alt={user?.name} className="comment-avatar" />
                  <input
                    type="text"
                    placeholder="Escribe un comentario..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <button type="submit" className="btn-icon-small" disabled={!newComment.trim()}>
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="modal-sidebar">
            {/* Acciones */}
            <div className="sidebar-section">
              {/* Estado de validación */}
              {task.pendingValidation && (
                <div className="validation-status pending">
                  <CheckCircle size={18} />
                  <span>Pendiente de validación</span>
                </div>
              )}
              
              {task.completed && task.validatedBy && (
                <div className="validation-status approved">
                  <CheckCircle size={18} />
                  <span>Validado por {task.validatedBy.name}</span>
                  {task.validationComment && (
                    <p className="validation-comment">"{task.validationComment}"</p>
                  )}
                </div>
              )}

              {/* Botones según el estado */}
              {!task.completed && !task.pendingValidation && (
                <button
                  onClick={handleRequestValidation}
                  className="btn-primary"
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
                    className="btn-success"
                    disabled={loading}
                  >
                    <CheckCircle size={18} />
                    Validar tarea
                  </button>
                  <button
                    onClick={() => handleValidateTask(false)}
                    className="btn-warning"
                    disabled={loading}
                  >
                    <XCircle size={18} />
                    {loading ? 'Procesando...' : 'Rechazar validación'}
                  </button>
                </>
              )}
            </div>

            {/* Detalles */}
            <div className="sidebar-section">
              <h4>Detalles</h4>
              
              <div className="detail-item">
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
                  <span className={`priority-badge priority-${task.priority}`}>{task.priority}</span>
                )}
              </div>

              <div className="detail-item">
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
                      const [year, month, day] = dateStr.split('-');
                      // Crear fecha en formato local sin conversión UTC
                      return format(new Date(year, month - 1, day), 'dd MMM yyyy', { locale: es });
                    })() : 'Sin fecha'}
                  </span>
                )}
              </div>

              {task.tags && task.tags.length > 0 && (
                <div className="detail-item">
                  <label>
                    <Tag size={16} />
                    Etiquetas
                  </label>
                  <div className="tags-display">
                    {task.tags.map((tag, index) => (
                      <span key={index} className="detail-tag">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Usuarios asignados */}
              <div className="detail-item">
                <label>
                  <Users size={16} />
                  Asignados ({task.assignedTo?.length || 0})
                </label>
                <div className="assigned-users-list">
                  {task.assignedTo && task.assignedTo.length > 0 ? (
                    task.assignedTo.map((assignedUser) => (
                      <div key={assignedUser._id} className="assigned-user-item">
                        <img 
                          src={assignedUser.avatar} 
                          alt={assignedUser.name} 
                          className="assigned-user-avatar"
                        />
                        <span className="assigned-user-name">{assignedUser.name}</span>
                        {isAdmin && (
                          <button
                            onClick={() => handleAssignUser(assignedUser._id)}
                            className="btn-remove-user"
                            title="Quitar usuario"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="no-assigned-users">Sin usuarios asignados</p>
                  )}
                </div>
                {isAdmin && (
                  <button
                    onClick={() => setShowUserSelector(!showUserSelector)}
                    className="btn-add-user"
                  >
                    <UserPlus size={16} />
                    Asignar usuario
                  </button>
                )}
                
                {/* Selector de usuarios */}
                {showUserSelector && isAdmin && (
                  <div className="user-selector">
                    {availableUsers.map((availableUser) => {
                      const isAssigned = task.assignedTo?.some(u => u._id === availableUser._id);
                      return (
                        <div
                          key={availableUser._id}
                          className={`user-option ${isAssigned ? 'assigned' : ''}`}
                          onClick={() => handleAssignUser(availableUser._id)}
                        >
                          <img 
                            src={availableUser.avatar} 
                            alt={availableUser.name} 
                            className="user-option-avatar"
                          />
                          <div className="user-option-info">
                            <span className="user-option-name">{availableUser.name}</span>
                            <span className="user-option-email">{availableUser.email}</span>
                          </div>
                          {isAssigned && (
                            <Check size={16} className="user-option-check" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Botones de acción */}
            <div className="sidebar-actions">
              {editing ? (
                <>
                  <button onClick={handleUpdate} className="btn-primary">
                    Guardar cambios
                  </button>
                  <button onClick={() => setEditing(false)} className="btn-secondary">
                    Cancelar
                  </button>
                </>
              ) : (
                <button onClick={() => setEditing(true)} className="btn-secondary">
                  Editar tarea
                </button>
              )}
              
              {/* Botón de recordatorio - disponible para todos los usuarios */}
              {task.assignedTo && task.assignedTo.length > 0 && (
                <button 
                  onClick={handleSendReminder} 
                  className="btn-secondary"
                  disabled={loading}
                  title="Enviar recordatorio a los usuarios asignados"
                >
                  <Bell size={18} />
                  {loading ? 'Enviando...' : 'Enviar Recordatorio'}
                </button>
              )}

              <button onClick={handleDelete} className="btn-danger">
                <Trash2 size={18} />
                Eliminar tarea
              </button>
            </div>
          </div>
        </div>

        {/* Modal de validación */}
        {showValidationModal && (
          <div className="validation-modal-overlay" onClick={() => setShowValidationModal(false)}>
            <div className="validation-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Validar tarea</h3>
              <p>¿Deseas aprobar esta tarea como completada?</p>
              <textarea
                placeholder="Comentario opcional..."
                value={validationComment}
                onChange={(e) => setValidationComment(e.target.value)}
                rows="3"
              />
              <div className="validation-modal-buttons">
                <button
                  onClick={() => handleValidateTask(true)}
                  className="btn-success"
                  disabled={loading}
                >
                  <CheckCircle size={18} />
                  {loading ? 'Aprobando...' : 'Aprobar'}
                </button>
                <button
                  onClick={() => setShowValidationModal(false)}
                  className="btn-secondary"
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
