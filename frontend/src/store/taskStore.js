import { create } from 'zustand';
import { tasksAPI } from '../services/api';

const useTaskStore = create((set, get) => ({
  tasks: [],
  currentTask: null,
  comments: [],
  loading: false,
  error: null,

  fetchTasks: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const response = await tasksAPI.getByProject(projectId);
      set({ tasks: response.data.tasks, loading: false });
    } catch (error) {
      console.error('Error obteniendo tareas:', error);
      set({ 
        error: error.response?.data?.message || 'Error al cargar tareas', 
        loading: false 
      });
    }
  },

  fetchTask: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await tasksAPI.getById(id);
      set({ currentTask: response.data.task, loading: false });
    } catch (error) {
      console.error('Error obteniendo tarea:', error);
      set({ 
        error: error.response?.data?.message || 'Error al cargar tarea', 
        loading: false 
      });
    }
  },

  createTask: async (taskData) => {
    try {
      const response = await tasksAPI.create(taskData);
      set((state) => ({
        tasks: [...state.tasks, response.data.task],
      }));
      return { success: true, task: response.data.task };
    } catch (error) {
      console.error('Error creando tarea:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al crear tarea' 
      };
    }
  },

  updateTask: async (id, taskData) => {
    try {
      const response = await tasksAPI.update(id, taskData);
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t._id === id ? response.data.task : t
        ),
        currentTask: state.currentTask?._id === id 
          ? response.data.task 
          : state.currentTask,
      }));
      return { success: true };
    } catch (error) {
      console.error('Error actualizando tarea:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al actualizar tarea' 
      };
    }
  },

  deleteTask: async (id) => {
    try {
      await tasksAPI.delete(id);
      set((state) => ({
        tasks: state.tasks.filter((t) => t._id !== id),
      }));
      return { success: true };
    } catch (error) {
      console.error('Error eliminando tarea:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al eliminar tarea' 
      };
    }
  },

  reorderTask: async (reorderData) => {
    try {
      await tasksAPI.reorder(reorderData);
      // La actualización optimista se maneja en el componente
      return { success: true };
    } catch (error) {
      console.error('Error reordenando tarea:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al reordenar tarea' 
      };
    }
  },

  fetchComments: async (taskId) => {
    try {
      const response = await tasksAPI.getComments(taskId);
      set({ comments: response.data.comments });
    } catch (error) {
      console.error('Error obteniendo comentarios:', error);
    }
  },

  addComment: async (taskId, content) => {
    try {
      const response = await tasksAPI.addComment(taskId, { content });
      set((state) => ({
        comments: [...state.comments, response.data.comment],
      }));
      return { success: true };
    } catch (error) {
      console.error('Error agregando comentario:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al agregar comentario' 
      };
    }
  },

  updateComment: async (taskId, commentId, content) => {
    try {
      const response = await tasksAPI.updateComment(taskId, commentId, { content });
      set((state) => ({
        comments: state.comments.map((c) =>
          c._id === commentId ? response.data.comment : c
        ),
      }));
      return { success: true };
    } catch (error) {
      console.error('Error editando comentario:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al editar comentario' 
      };
    }
  },

  deleteComment: async (taskId, commentId) => {
    try {
      await tasksAPI.deleteComment(taskId, commentId);
      set((state) => ({
        comments: state.comments.filter((c) => c._id !== commentId),
      }));
      return { success: true };
    } catch (error) {
      console.error('Error eliminando comentario:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al eliminar comentario' 
      };
    }
  },

  requestValidation: async (taskId) => {
    try {
      const response = await tasksAPI.requestValidation(taskId);
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t._id === taskId ? response.data.task : t
        ),
        currentTask: state.currentTask?._id === taskId 
          ? response.data.task 
          : state.currentTask,
      }));
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('Error solicitando validación:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al solicitar validación' 
      };
    }
  },

  validateTask: async (taskId, approved, comment) => {
    try {
      const response = await tasksAPI.validateTask(taskId, { approved, comment });
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t._id === taskId ? response.data.task : t
        ),
        currentTask: state.currentTask?._id === taskId 
          ? response.data.task 
          : state.currentTask,
      }));
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('Error validando tarea:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al validar tarea' 
      };
    }
  },
}));

export default useTaskStore;
