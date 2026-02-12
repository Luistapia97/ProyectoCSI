import { useState, useEffect } from 'react';
import { X, Calendar, Flag, Tag, CheckSquare, Plus, Send, Trash2, Edit2, Check, CheckCircle, XCircle, UserPlus, Users, Bell, Paperclip, Download, FileText, Archive } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import useTaskStore from '../store/taskStore';
import useAuthStore from '../store/authStore';
import { authAPI, tasksAPI, getBackendURL } from '../services/api';
import socketService from '../services/socket';
import { useToast } from '../hooks/useToast';
import ConfirmDialog from './ConfirmDialog';
import Toast from './Toast';
import TimeTracker from './TimeTracker';
import BlockedTaskModal from './BlockedTaskModal';
import EstimationPicker from './EstimationPicker';
import './CardDetailsModal.css';

// Helper para obtener URL de archivos (soporta Cloudinary y archivos locales antiguos)
const getAttachmentUrl = (url, fileName = '') => {
  if (!url) return '';
  
  // Si la URL ya es completa (Cloudinary o externa)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url; // Devolver URL tal cual, ya sea firmada o pública
  }
  
  // Si es una ruta local antigua, agregar el backend URL
  return `${getBackendURL()}${url}`;
};

// Función para extraer cloudinaryId de una URL
const extractCloudinaryId = (url) => {
  if (!url || !url.includes('cloudinary.com')) return null;
  
  // Extraer el public_id de la URL
  // Formato: https://res.cloudinary.com/{cloud_name}/raw/upload/v1/{folder}/{filename}
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\?|$)/);
  return match ? match[1] : null;
};

function UserAvatarDetail({ user, className }) {
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

  const avatarUrl = getAvatarUrl(user.avatar);

  if (!avatarUrl || imageError) {
    return (
      <div className={`${className} avatar-initials`}>
        {getInitials(user.name)}
      </div>
    );
  }

  return (
    <img 
      src={avatarUrl} 
      alt={user.name} 
      className={className}
      onError={() => setImageError(true)}
    />
  );
}

export default function CardDetailsModal({ task: initialTask, onClose }) {
  const { user } = useAuthStore();
  const { updateTask, deleteTask, fetchComments, addComment, updateComment, deleteComment, comments, requestValidation, validateTask, tasks, fetchTask, currentTask } = useTaskStore();
  
  // Obtener la tarea del store si existe, priorizar currentTask para actualizaciones en tiempo real
  // IMPORTANTE: Priorizar currentTask si el ID coincide (para updates vía socket)
  const task = (currentTask?._id === initialTask._id ? currentTask : tasks.find(t => t._id === initialTask._id)) || initialTask;

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
  
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
    completed: task.completed,
    estimatedSize: task.effortMetrics?.estimatedSize || 'M',
    estimatedHours: task.effortMetrics?.estimatedHours || 8,
  });
  const [newSubtask, setNewSubtask] = useState('');
  const [editingSubtaskIndex, setEditingSubtaskIndex] = useState(null);
  const [editingSubtaskText, setEditingSubtaskText] = useState('');
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [validationComment, setValidationComment] = useState('');
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const { showToast, toasts, removeToast } = useToast();
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileInputRef, setFileInputRef] = useState(null);
  const [newTag, setNewTag] = useState('');
  const [editingTagIndex, setEditingTagIndex] = useState(null);
  const [editingTagText, setEditingTagText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [signedUrls, setSignedUrls] = useState({}); // Almacenar URLs firmadas
  const [showBlockModal, setShowBlockModal] = useState(false); // Modal de bloqueo
  const [showStartTimerDialog, setShowStartTimerDialog] = useState(false); // Modal para iniciar timer
  const [showCloseWithTimerDialog, setShowCloseWithTimerDialog] = useState(false); // Modal para cerrar con timer activo
  const [showStopTimerDialog, setShowStopTimerDialog] = useState(false); // Modal para detener timer
  const [stopTimerNote, setStopTimerNote] = useState(''); // Nota al detener timer

  // Verificar si la tarea está bloqueada
  const isBlocked = task.effortMetrics?.blockedBy && task.effortMetrics.blockedBy !== 'none';

  // Función para obtener URL firmada de Cloudinary
  const getSignedUrl = async (cloudinaryId) => {
    try {
      // Obtener token del localStorage
      const token = localStorage.getItem('token');
      // Usar el proxy del backend con el token
      const proxyUrl = `${getBackendURL()}/api/tasks/attachment-proxy/${encodeURIComponent(cloudinaryId)}?token=${token}`;
      return proxyUrl;
    } catch (error) {
      console.error('Error obteniendo URL firmada:', error);
      return null;
    }
  };

  // Cargar URLs firmadas para archivos PDF de Cloudinary
  useEffect(() => {
    const loadSignedUrls = async () => {
      if (!task.attachments || task.attachments.length === 0) return;
      
      const urlsToLoad = {};
      for (const attachment of task.attachments) {
        // Para archivos NO imagen de Cloudinary, usar proxy con cloudinaryId
        if (attachment.cloudinaryId && !isImageFile(attachment.mimeType)) {
          const signedUrl = await getSignedUrl(attachment.cloudinaryId);
          if (signedUrl) {
            urlsToLoad[attachment._id] = signedUrl;
          }
        }
      }
      setSignedUrls(urlsToLoad);
    };

    loadSignedUrls();
  }, [task.attachments]);

  // Función para obtener URL final del attachment (firmada o normal)
  const getFinalAttachmentUrl = (attachment) => {
    // Si es imagen, usar URL original directamente
    if (isImageFile(attachment.mimeType)) {
      return getAttachmentUrl(attachment.url, attachment.originalName);
    }
    
    // Para archivos antiguos de Cloudinary que no funcionan con proxy, 
    // usar URL original (aunque pueda dar error al visualizar, permite descargar)
    if (attachment.url && attachment.url.includes('cloudinary.com')) {
      return attachment.url;
    }
    
    // Para otros archivos, usar URL firmada si está disponible
    if (signedUrls[attachment._id]) {
      return signedUrls[attachment._id];
    }
    return getAttachmentUrl(attachment.url, attachment.originalName);
  };

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
      estimatedSize: task.effortMetrics?.estimatedSize || 'M',
      estimatedHours: task.effortMetrics?.estimatedHours || 8,
    });
  }, [task]);

  // Preguntar automáticamente si se quiere iniciar el timer al abrir la tarea
  useEffect(() => {
    if (task && !task.effortMetrics?.activeTimer?.isActive && !task.completed) {
      setShowStartTimerDialog(true);
    }
  }, [task._id]);

  // Escuchar actualizaciones de socket para actualizar timer en tiempo real
  useEffect(() => {
    const handleTaskUpdate = (updatedTask) => {
      if (updatedTask._id === task._id) {
        // Actualizar la tarea en el store para reflejar cambios del timer
        fetchTask(task._id);
      }
    };

    socketService.on('task-updated', handleTaskUpdate);

    return () => {
      socketService.off('task-updated', handleTaskUpdate);
    };
  }, [task._id, fetchTask]);

  // Función para iniciar el timer
  const handleStartTimer = async () => {
    try {
      await tasksAPI.startTimer(task._id);
      // Recargar la tarea para actualizar el estado
      await fetchTask(task._id);
      setShowStartTimerDialog(false);
    } catch (error) {
      console.error('Error iniciando timer:', error);
      // Solo mostrar error si no es porque ya hay un timer activo
      if (error.response?.status !== 400) {
        alert(error.response?.data?.message || 'Error al iniciar timer automáticamente');
      }
      setShowStartTimerDialog(false);
    }
  };

  // Interceptar el cierre del modal para verificar si hay timer activo
  const handleCloseModal = () => {
    // Verificar si hay un timer activo
    if (task.effortMetrics?.activeTimer?.isActive) {
      setShowCloseWithTimerDialog(true);
    } else {
      onClose();
    }
  };

  // Confirmar cierre con timer activo
  const handleConfirmCloseWithTimer = () => {
    setShowCloseWithTimerDialog(false);
    onClose();
  };

  // Mostrar modal para detener timer
  const handleRequestStopTimer = () => {
    setShowStopTimerDialog(true);
  };

  // Detener timer con nota
  const handleStopTimer = async () => {
    if (!stopTimerNote.trim()) {
      alert('Debes agregar una descripción de lo realizado');
      return;
    }

    try {
      await tasksAPI.stopTimer(task._id, { note: stopTimerNote });
      await fetchTask(task._id);
      setShowStopTimerDialog(false);
      setStopTimerNote('');
    } catch (error) {
      console.error('Error deteniendo timer:', error);
      alert(error.response?.data?.message || 'Error al detener timer');
    }
  };

  const handleUpdate = async () => {
    await updateTask(task._id, {
      ...formData,
      dueDate: formData.dueDate || undefined,
      effortMetrics: {
        ...task.effortMetrics,
        estimatedSize: formData.estimatedSize,
        estimatedHours: formData.estimatedHours,
      },
    });
    setEditing(false);
  };

  const handleDelete = async () => {
    setConfirmDialog({
      title: 'Eliminar Tarea',
      message: '¿Estás seguro de eliminar esta tarea? Esta acción no se puede deshacer.',
      type: 'danger',
      confirmText: 'Eliminar',
      onConfirm: async () => {
        const result = await deleteTask(task._id);
        if (result.success) {
          showToast('Tarea eliminada exitosamente', 'success');
          setConfirmDialog(null);
          onClose();
          // Forzar actualización del componente padre
          window.dispatchEvent(new Event('tasksUpdated'));
        } else {
          showToast('Error al eliminar la tarea: ' + (result.error || 'Error desconocido'), 'error');
          setConfirmDialog(null);
        }
      },
      onCancel: () => setConfirmDialog(null)
    });
  };

  const handleArchive = async () => {
    try {
      const action = task.archived ? 'desarchivar' : 'archivar';
      setConfirmDialog({
        title: task.archived ? 'Desarchivar Tarea' : 'Archivar Tarea',
        message: `¿Estás seguro de ${action} esta tarea?`,
        type: 'warning',
        confirmText: task.archived ? 'Desarchivar' : 'Archivar',
        onConfirm: async () => {
          try {
            await tasksAPI.archive(task._id, !task.archived);
            showToast(`Tarea ${task.archived ? 'desarchivada' : 'archivada'} exitosamente`, 'success');
            setConfirmDialog(null);
            onClose();
            window.location.reload();
          } catch (error) {
            console.error('Error archivando tarea:', error);
            showToast('Error al archivar la tarea', 'error');
            setConfirmDialog(null);
          }
        },
        onCancel: () => setConfirmDialog(null)
      });
    } catch (error) {
      console.error('Error:', error);
      showToast('Error al procesar la solicitud', 'error');
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

  const handleStartEditSubtask = (index) => {
    setEditingSubtaskIndex(index);
    setEditingSubtaskText(task.subtasks[index].title);
  };

  const handleSaveEditSubtask = async () => {
    if (!editingSubtaskText.trim()) return;
    
    const updatedSubtasks = [...task.subtasks];
    updatedSubtasks[editingSubtaskIndex].title = editingSubtaskText.trim();
    await updateTask(task._id, { subtasks: updatedSubtasks });
    setEditingSubtaskIndex(null);
    setEditingSubtaskText('');
  };

  const handleCancelEditSubtask = () => {
    setEditingSubtaskIndex(null);
    setEditingSubtaskText('');
  };

  const handleDeleteSubtask = async (index) => {
    setConfirmDialog({
      title: 'Eliminar Subtarea',
      message: '¿Estás seguro de eliminar esta subtarea?',
      type: 'warning',
      confirmText: 'Eliminar',
      onConfirm: async () => {
        const updatedSubtasks = task.subtasks.filter((_, i) => i !== index);
        await updateTask(task._id, { subtasks: updatedSubtasks });
        showToast('Subtarea eliminada', 'success');
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null)
    });
  };

  const handleAddTag = async () => {
    if (!newTag.trim()) return;

    const updatedTags = [...(task.tags || []), newTag.trim()];
    await updateTask(task._id, { tags: updatedTags });
    setNewTag('');
  };

  const handleStartEditTag = (index) => {
    setEditingTagIndex(index);
    setEditingTagText(task.tags[index]);
  };

  const handleSaveEditTag = async () => {
    if (!editingTagText.trim()) return;

    const updatedTags = [...task.tags];
    updatedTags[editingTagIndex] = editingTagText.trim();
    await updateTask(task._id, { tags: updatedTags });
    setEditingTagIndex(null);
    setEditingTagText('');
  };

  const handleCancelEditTag = () => {
    setEditingTagIndex(null);
    setEditingTagText('');
  };

  const handleDeleteTag = async (index) => {
    setConfirmDialog({
      title: 'Eliminar Etiqueta',
      message: '¿Eliminar esta etiqueta?',
      type: 'warning',
      confirmText: 'Eliminar',
      onConfirm: async () => {
        const updatedTags = task.tags.filter((_, i) => i !== index);
        await updateTask(task._id, { tags: updatedTags });
        showToast('Etiqueta eliminada', 'success');
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null)
    });
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
    setConfirmDialog({
      title: 'Eliminar Comentario',
      message: '¿Estás seguro de eliminar este comentario?',
      type: 'warning',
      confirmText: 'Eliminar',
      onConfirm: async () => {
        await deleteComment(task._id, commentId);
        showToast('Comentario eliminado', 'success');
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null)
    });
  };

  const handleSendReminder = async () => {
    try {
      setLoading(true);
      const response = await tasksAPI.sendReminder(task._id);
      if (response.data.success) {
        showToast(`Recordatorio enviado a ${response.data.notifications.length} usuario(s)`, 'success');
      }
    } catch (error) {
      console.error('Error enviando recordatorio:', error);
      showToast('Error al enviar recordatorio: ' + (error.response?.data?.message || error.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await authAPI.getAllUsers();
      const allUsers = response.data.users || [];
      console.log('👥 Usuarios cargados en CardDetailsModal:', allUsers.length);
      setAvailableUsers(allUsers);
    } catch (error) {
      console.error('❌ Error cargando usuarios:', error);
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
    // Recargar la tarea para reflejar los cambios inmediatamente
    await fetchTask(task._id);
  };

  const handleRequestValidation = async () => {
    if (loading) return;
    setLoading(true);
    
    const result = await requestValidation(task._id);
    setLoading(false);
    
    if (result.success) {
      showToast(result.message || 'Validación solicitada exitosamente', 'success');
    } else {
      showToast(result.error || 'Error al solicitar validación', 'error');
    }
  };

  const handleValidateTask = async (approved) => {
    if (loading) return;
    setLoading(true);
    
    const result = await validateTask(task._id, approved, validationComment);
    setLoading(false);
    
    if (result.success) {
      showToast(result.message, 'success');
      setShowValidationModal(false);
      setValidationComment('');
    } else {
      showToast(result.error || 'Error al validar tarea', 'error');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;

    await uploadFile(file);
    if (e.target) e.target.value = '';
  };

  const uploadFile = async (file) => {
    // Validar tamaño (10MB máximo)
    if (file.size > 10 * 1024 * 1024) {
      showToast('El archivo es demasiado grande. Máximo 10MB', 'error');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await tasksAPI.uploadAttachment(task._id, formData);
      if (response.data.attachment) {
        await fetchTask(task._id);
        showToast(`${file.name} subido exitosamente`, 'success');
      }
    } catch (error) {
      console.error('Error subiendo archivo:', error);
      showToast('Error al subir archivo: ' + (error.response?.data?.message || error.message), 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    
    if (files.length === 0) return;

    // Subir archivos uno por uno
    for (const file of files) {
      await uploadFile(file);
    }
  };

  const handlePaste = async (e) => {
    const items = Array.from(e.clipboardData?.items || []);
    
    for (const item of items) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          await uploadFile(file);
        }
      }
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    setConfirmDialog({
      title: 'Eliminar Archivo',
      message: '¿Estás seguro de eliminar este archivo?',
      type: 'warning',
      confirmText: 'Eliminar',
      onConfirm: async () => {
        try {
          await tasksAPI.deleteAttachment(task._id, attachmentId);
          await fetchTask(task._id);
          showToast('Archivo eliminado exitosamente', 'success');
          setConfirmDialog(null);
        } catch (error) {
          console.error('Error eliminando archivo:', error);
          showToast('Error al eliminar archivo: ' + (error.response?.data?.message || error.message), 'error');
          setConfirmDialog(null);
        }
      },
      onCancel: () => setConfirmDialog(null)
    });
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

  const isImageFile = (mimeType) => {
    return mimeType && mimeType.startsWith('image/');
  };

  const isAdmin = user?.role === 'administrador';

  return (
    <div className="modal-overlay" onClick={handleCloseModal}>
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
          <button onClick={handleCloseModal} className="modal-close">
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
                      disabled={editingSubtaskIndex === index}
                    />
                    {editingSubtaskIndex === index ? (
                      <div className="subtask-edit-container">
                        <input
                          type="text"
                          value={editingSubtaskText}
                          onChange={(e) => setEditingSubtaskText(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSaveEditSubtask()}
                          className="subtask-edit-input"
                          autoFocus
                        />
                        <div className="subtask-edit-actions">
                          <button onClick={handleSaveEditSubtask} className="btn-icon-tiny btn-success" title="Guardar">
                            <Check size={16} />
                          </button>
                          <button onClick={handleCancelEditSubtask} className="btn-icon-tiny" title="Cancelar">
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className={subtask.completed ? 'completed-subtask' : ''}>
                          {subtask.title}
                        </span>
                        <div className="subtask-actions">
                          <button
                            onClick={() => handleStartEditSubtask(index)}
                            className="btn-icon-tiny"
                            title="Editar subtarea"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteSubtask(index)}
                            className="btn-icon-tiny btn-danger"
                            title="Eliminar subtarea"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    )}
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
                      {isImageFile(attachment.mimeType) ? (
                        <div className="attachment-image-preview">
                          <a
                            href={getFinalAttachmentUrl(attachment)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src={getFinalAttachmentUrl(attachment)}
                              alt={attachment.originalName}
                              className="attachment-preview-img"
                            />
                          </a>
                          <div className="attachment-image-info">
                            <div className="attachment-details">
                              <span className="attachment-name">{attachment.originalName}</span>
                              <span className="attachment-meta">
                                {formatFileSize(attachment.size)} • {format(new Date(attachment.uploadedAt), 'dd MMM yyyy', { locale: es })}
                                {attachment.uploadedBy && ` • ${attachment.uploadedBy.name}`}
                              </span>
                            </div>
                            <div className="attachment-actions">
                              <a
                                href={getFinalAttachmentUrl(attachment)}
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
                                  title="Eliminar"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="attachment-info">
                            <span className="attachment-icon">{getFileIcon(attachment.mimeType)}</span>
                            <div className="attachment-details">
                              <a
                                href={getFinalAttachmentUrl(attachment)}
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
                              href={getFinalAttachmentUrl(attachment)}
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
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="no-attachments">No hay archivos adjuntos</p>
                )}
              </div>
              <div 
                className={`add-attachment ${isDragging ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onPaste={handlePaste}
              >
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
                  {uploading ? 'Subiendo...' : 'Adjuntar archivo o foto'}
                </button>
                <span className="attachment-hint">
                  {isDragging 
                    ? '📂 Suelta los archivos aquí' 
                    : 'Arrastra archivos, pega o haz clic • Máximo 10MB'}
                </span>
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
                        {getAvatarUrl(comment.user.avatar) ? (
                          <img src={getAvatarUrl(comment.user.avatar)} alt={comment.user.name} className="comment-avatar" />
                        ) : (
                          <div className="comment-avatar avatar-initials">
                            {getInitials(comment.user.name)}
                          </div>
                        )}
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
                  {getAvatarUrl(user?.avatar) ? (
                    <img src={getAvatarUrl(user?.avatar)} alt={user?.name} className="comment-avatar" />
                  ) : (
                    <div className="comment-avatar avatar-initials">
                      {getInitials(user?.name)}
                    </div>
                  )}
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
            {/* Badge de tarea bloqueada */}
            {isBlocked && (
              <div className="blocked-badge">
                🚫 Tarea Bloqueada
                <button 
                  onClick={() => setShowBlockModal(true)}
                  className="btn-view-block"
                >
                  Ver detalles
                </button>
              </div>
            )}

            {/* Acciones */}
            <div className="sidebar-section">
              {/* Estado de validación */}
              {task.pendingValidation && (
                <div className="validation-status pending">
                  <CheckCircle size={18} />
                  <span>Pendiente de validación</span>
                </div>
              )}
              
              {!task.pendingValidation && task.validatedBy && (
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
              
              {/* Botones de bloqueo */}
              <button
                onClick={() => setShowBlockModal(true)}
                className={isBlocked ? 'btn-success' : 'btn-danger'}
              >
                {isBlocked ? '✅ Desbloquear tarea' : '🚫 Marcar bloqueada'}
              </button>
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

              {/* Estimación de esfuerzo */}
              {editing && (
                <div className="detail-item detail-item-full">
                  <EstimationPicker
                    value={formData.estimatedSize}
                    onChange={(size, hours) => setFormData({ ...formData, estimatedSize: size, estimatedHours: hours })}
                    required={false}
                  />
                </div>
              )}

              <div className="detail-item">
                <label>
                  <Tag size={16} />
                  Etiquetas ({task.tags?.length || 0})
                </label>
                <div className="tags-list">
                  {task.tags && task.tags.length > 0 ? (
                    task.tags.map((tag, index) => (
                      <div key={index} className="tag-item">
                        {editingTagIndex === index ? (
                          <div className="tag-edit-container">
                            <input
                              type="text"
                              value={editingTagText}
                              onChange={(e) => setEditingTagText(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleSaveEditTag()}
                              className="tag-edit-input"
                              autoFocus
                            />
                            <div className="tag-edit-actions">
                              <button onClick={handleSaveEditTag} className="btn-icon-tiny btn-success" title="Guardar">
                                <Check size={14} />
                              </button>
                              <button onClick={handleCancelEditTag} className="btn-icon-tiny" title="Cancelar">
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <span className="detail-tag">{tag}</span>
                            <div className="tag-actions">
                              <button
                                onClick={() => handleStartEditTag(index)}
                                className="btn-icon-tiny"
                                title="Editar etiqueta"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={() => handleDeleteTag(index)}
                                className="btn-icon-tiny btn-danger"
                                title="Eliminar etiqueta"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="no-tags">Sin etiquetas</p>
                  )}
                </div>
                <div className="add-tag">
                  <input
                    type="text"
                    placeholder="Agregar etiqueta..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  />
                  <button onClick={handleAddTag} className="btn-icon-small">
                    <Plus size={18} />
                  </button>
                </div>
              </div>

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
                        <UserAvatarDetail user={assignedUser} className="assigned-user-avatar" />
                        <span className="assigned-user-name">{assignedUser.name}</span>
                        <button
                          onClick={() => handleAssignUser(assignedUser._id)}
                          className="btn-remove-user"
                          title="Quitar usuario"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="no-assigned-users">Sin usuarios asignados</p>
                  )}
                </div>
                <button
                  onClick={() => setShowUserSelector(!showUserSelector)}
                  className="btn-add-user"
                >
                  <UserPlus size={16} />
                  Asignar usuario
                </button>
                
                {/* Selector de usuarios */}
                {showUserSelector && (
                  <div className="user-selector">
                    {availableUsers.map((availableUser) => {
                      const isAssigned = task.assignedTo?.some(u => u._id === availableUser._id);
                      return (
                        <div
                          key={availableUser._id}
                          className={`user-option ${isAssigned ? 'assigned' : ''}`}
                          onClick={() => handleAssignUser(availableUser._id)}
                        >
                          {getAvatarUrl(availableUser.avatar) ? (
                            <img 
                              src={getAvatarUrl(availableUser.avatar)} 
                              alt={availableUser.name} 
                              className="user-option-avatar"
                            />
                          ) : (
                            <div className="user-option-avatar avatar-initials">
                              {getInitials(availableUser.name)}
                            </div>
                          )}
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
                <button 
                  onClick={() => setEditing(true)} 
                  className="btn-secondary"
                >
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

              {isAdmin && (
                <>
                  <button onClick={handleArchive} className="btn-secondary">
                    <Archive size={18} />
                    {task.archived ? 'Desarchivar' : 'Archivar'}
                  </button>
                  <button onClick={handleDelete} className="btn-danger">
                    <Trash2 size={18} />
                    Eliminar tarea
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* TimeTracker Component */}
        <TimeTracker 
          taskId={task._id}
          effortMetrics={task.effortMetrics}
          onUpdate={() => fetchTask(task._id)}
          onStopTimerRequest={handleRequestStopTimer}
        />

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

        {/* Modal de bloqueo */}
        {showBlockModal && (
          <BlockedTaskModal
            taskId={task._id}
            isBlocked={isBlocked}
            blockedBy={task.effortMetrics?.blockedBy}
            effortMetrics={task.effortMetrics}
            onClose={() => setShowBlockModal(false)}
            onUpdate={() => fetchTask(task._id)}
          />
        )}
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

      {/* Modal para iniciar timer */}
      <ConfirmDialog 
        isOpen={showStartTimerDialog}
        title="Iniciar Timer"
        message="¿Deseas iniciar el timer automáticamente para esta tarea?"
        type="question"
        confirmText="Iniciar Timer"
        cancelText="No, gracias"
        onConfirm={handleStartTimer}
        onCancel={() => setShowStartTimerDialog(false)}
        confirmButtonClass="info"
      />

      {/* Modal para cerrar con timer activo */}
      <ConfirmDialog 
        isOpen={showCloseWithTimerDialog}
        title="Tienes un timer activo en esta tarea"
        message="El timer seguirá corriendo en segundo plano. No olvides detenerlo antes de que agote el tiempo.¿Deseas cerrar esta tarea?"
        type="warning"
        confirmText="Aceptar"
        cancelText="Cancelar"
        onConfirm={handleConfirmCloseWithTimer}
        onCancel={() => setShowCloseWithTimerDialog(false)}
        confirmButtonClass="warning"
      />

      {/* Modal para detener timer */}
      {showStopTimerDialog && (
        <div className="modal-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detener Timer</h3>
              <button onClick={() => setShowStopTimerDialog(false)} className="btn-close">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
                Describe qué trabajaste durante este tiempo
              </p>
              <div className="form-group">
                <label htmlFor="stop-timer-note">
                  Descripción <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <textarea
                  id="stop-timer-note"
                  value={stopTimerNote}
                  onChange={(e) => setStopTimerNote(e.target.value)}
                  placeholder="Describe qué trabajaste en este tiempo..."
                  rows={4}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button 
                className="btn-secondary" 
                onClick={() => setShowStopTimerDialog(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-primary" 
                onClick={handleStopTimer}
                disabled={!stopTimerNote.trim()}
              >
                Detener Timer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
