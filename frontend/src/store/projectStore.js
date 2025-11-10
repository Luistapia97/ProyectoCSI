import { create } from 'zustand';
import { projectsAPI } from '../services/api';

const useProjectStore = create((set, get) => ({
  projects: [],
  currentProject: null,
  loading: false,
  error: null,

  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      const response = await projectsAPI.getAll();
      set({ projects: response.data.projects, loading: false });
    } catch (error) {
      console.error('Error obteniendo proyectos:', error);
      set({ 
        error: error.response?.data?.message || 'Error al cargar proyectos', 
        loading: false 
      });
    }
  },

  fetchProject: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await projectsAPI.getById(id);
      set({ currentProject: response.data.project, loading: false });
    } catch (error) {
      console.error('Error obteniendo proyecto:', error);
      set({ 
        error: error.response?.data?.message || 'Error al cargar proyecto', 
        loading: false 
      });
    }
  },

  createProject: async (projectData) => {
    try {
      const response = await projectsAPI.create(projectData);
      set((state) => ({
        projects: [response.data.project, ...state.projects],
      }));
      return { success: true, project: response.data.project };
    } catch (error) {
      console.error('Error creando proyecto:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al crear proyecto' 
      };
    }
  },

  updateProject: async (id, projectData) => {
    try {
      const response = await projectsAPI.update(id, projectData);
      set((state) => ({
        projects: state.projects.map((p) =>
          p._id === id ? response.data.project : p
        ),
        currentProject: state.currentProject?._id === id 
          ? response.data.project 
          : state.currentProject,
      }));
      return { success: true };
    } catch (error) {
      console.error('Error actualizando proyecto:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al actualizar proyecto' 
      };
    }
  },

  deleteProject: async (id) => {
    try {
      await projectsAPI.delete(id);
      set((state) => ({
        projects: state.projects.filter((p) => p._id !== id),
      }));
      return { success: true };
    } catch (error) {
      console.error('Error eliminando proyecto:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al eliminar proyecto' 
      };
    }
  },

  addMember: async (projectId, memberData) => {
    try {
      const response = await projectsAPI.addMember(projectId, memberData);
      set((state) => ({
        currentProject: response.data.project,
      }));
      return { success: true };
    } catch (error) {
      console.error('Error agregando miembro:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al agregar miembro' 
      };
    }
  },
}));

export default useProjectStore;
