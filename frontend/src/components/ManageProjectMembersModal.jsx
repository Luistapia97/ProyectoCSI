import { useState, useEffect } from 'react';
import { X, UserPlus, Trash2, Shield, User } from 'lucide-react';
import useProjectStore from '../store/projectStore';
import { usersAPI, projectsAPI, getBackendURL } from '../services/api';
import './Modal.css';

export default function ManageProjectMembersModal({ project, isOpen, onClose }) {
  const { updateProject, setCurrentProject } = useProjectStore();
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('miembro');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    if (isOpen && project) {
      console.log('🔍 Modal abierto - Proyecto recibido:', {
        name: project.name,
        membersCount: project.members?.length,
        members: project.members
      });
      fetchAvailableUsers();
    }
  }, [isOpen, project]);

  const fetchAvailableUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      // Filtrar usuarios que no son miembros del proyecto
      const memberIds = project.members?.map(m => m.user._id) || [];
      const available = response.data.users.filter(
        user => !memberIds.includes(user._id)
      );
      setAvailableUsers(available);
    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      setError('Error al cargar usuarios disponibles');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    
    if (!selectedUserId) {
      setError('Selecciona un usuario');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Buscar el email del usuario seleccionado
      const selectedUser = availableUsers.find(u => u._id === selectedUserId);
      if (!selectedUser) {
        setError('Usuario no encontrado');
        setLoading(false);
        return;
      }

      console.log('🔄 Agregando miembro:', {
        projectId: project._id,
        email: selectedUser.email,
        role: selectedRole === 'supervisor' ? 'supervisor' : 'member'
      });

      // Usar projectsAPI en lugar de fetch directo
      const response = await projectsAPI.addMember(project._id, {
        email: selectedUser.email,
        role: selectedRole === 'supervisor' ? 'supervisor' : 'member'
      });

      console.log('📡 Respuesta del servidor:', response);
      console.log('📡 Respuesta data:', response.data);

      if (response.data.success && response.data.project) {
        console.log('✅ Miembro agregado exitosamente');
        console.log('✅ Proyecto actualizado:', response.data.project);
        console.log('✅ Número de miembros en el proyecto actualizado:', response.data.project.members?.length);
        // Actualizar directamente en el store
        setCurrentProject(response.data.project);
        console.log('✅ setCurrentProject llamado');
        setSelectedUserId('');
        setSelectedRole('miembro');
        await fetchAvailableUsers();
        setError('');
      } else {
        console.error('❌ Error en la respuesta:', response.data);
        setError(response.data.message || 'Error al agregar miembro al proyecto');
      }
    } catch (error) {
      console.error('❌ Error completo:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error response data:', error.response?.data);
      setError(`Error al agregar miembro: ${error.response?.data?.message || error.message}`);
    }
    
    setLoading(false);
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('¿Estás seguro de eliminar este miembro del proyecto?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await projectsAPI.removeMember(project._id, userId);
      
      if (response.data.success && response.data.project) {
        // Actualizar directamente en el store
        setCurrentProject(response.data.project);
        await fetchAvailableUsers();
        setError('');
      } else {
        setError(response.data.message || 'Error al eliminar miembro');
      }
    } catch (error) {
      console.error('❌ Error eliminando miembro:', error);
      setError(`Error al eliminar miembro: ${error.response?.data?.message || error.message}`);
    }
    
    setLoading(false);
  };

  const handleUpdateMemberRole = async (userId, newRole) => {
    setLoading(true);
    setError('');

    try {
      console.log('🔄 Actualizando rol de miembro:', {
        projectId: project._id,
        userId,
        newRole
      });

      const response = await projectsAPI.updateMemberRole(project._id, userId, newRole);

      console.log('📡 Respuesta del servidor:', response);

      if (response.data.success && response.data.project) {
        console.log('✅ Rol actualizado exitosamente');
        // Actualizar directamente en el store
        setCurrentProject(response.data.project);
        setError('');
      } else {
        console.error('❌ Error en la respuesta:', response.data);
        setError(response.data.message || 'Error al actualizar rol');
      }
    } catch (error) {
      console.error('❌ Error actualizando rol:', error);
      console.error('❌ Error response:', error.response);
      setError(`Error al actualizar rol: ${error.response?.data?.message || error.message}`);
    }
    
    setLoading(false);
  };

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

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Gestionar Miembros del Proyecto</h2>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Formulario para agregar miembro */}
        <div className="add-member-section">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <UserPlus size={20} />
            Agregar Miembro
          </h3>
          <form onSubmit={handleAddMember} style={{ display: 'flex', gap: '12px', alignItems: 'end' }}>
            <div className="form-group" style={{ flex: 1, margin: 0 }}>
              <label htmlFor="user-select">Usuario</label>
              <select
                id="user-select"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                disabled={loading || availableUsers.length === 0}
                required
              >
                <option value="">Seleccionar usuario...</option>
                {availableUsers.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ width: '200px', margin: 0 }}>
              <label htmlFor="role-select">Rol</label>
              <select
                id="role-select"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                disabled={loading}
              >
                <option value="miembro">Miembro</option>
                <option value="supervisor">Supervisor</option>
              </select>
            </div>

            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading || !selectedUserId || availableUsers.length === 0}
              style={{ marginBottom: '0' }}
            >
              {loading ? 'Agregando...' : 'Agregar'}
            </button>
          </form>
          {availableUsers.length === 0 && (
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '8px' }}>
              Todos los usuarios ya son miembros del proyecto
            </p>
          )}
        </div>

        {/* Lista de miembros actuales */}
        <div className="members-list-section">
          <h3 style={{ marginBottom: '16px' }}>
            Miembros Actuales ({project.members?.length || 0})
          </h3>
          
          {project.members && project.members.length > 0 ? (
            <div className="members-list">
              {project.members.map((member) => {
                const avatarUrl = getAvatarUrl(member.user.avatar);
                const hasError = imageErrors[member.user._id];
                
                return (
                  <div key={member.user._id} className="member-item">
                    <div className="member-info">
                      <div className="member-avatar-container">
                        {!avatarUrl || hasError ? (
                          <div className="member-avatar-initials">
                            {getInitials(member.user.name)}
                          </div>
                        ) : (
                          <img 
                            src={avatarUrl}
                            alt={member.user.name}
                            className="member-avatar"
                            onError={() => setImageErrors(prev => ({ ...prev, [member.user._id]: true }))}
                          />
                        )}
                      </div>
                      <div className="member-details">
                        <div className="member-name">{member.user.name}</div>
                        <div className="member-email">{member.user.email}</div>
                      </div>
                    </div>

                    <div className="member-actions">
                      <select
                        value={member.role}
                        onChange={(e) => handleUpdateMemberRole(member.user._id, e.target.value)}
                        disabled={loading}
                        className="role-select"
                      >
                        <option value="member">
                          Miembro
                        </option>
                        <option value="supervisor">
                          Supervisor
                        </option>
                      </select>

                      <button
                        onClick={() => handleRemoveMember(member.user._id)}
                        disabled={loading}
                        className="btn-remove-member"
                        title="Eliminar miembro"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '32px' }}>
              No hay miembros en este proyecto
            </p>
          )}
        </div>

        <div className="modal-actions">
          <button 
            type="button" 
            className="btn-primary" 
            onClick={onClose}
            disabled={loading}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
