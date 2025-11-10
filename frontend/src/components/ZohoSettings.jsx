import { useState } from 'react';
import { Calendar, Key, Link as LinkIcon, Unlink } from 'lucidereact';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import './Settings.css';

export default function ZohoSettings() {
  const { user, token } = useAuthStore();
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const isConnected = user?.zohoAccessToken;

  const handleConnect = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await axios.post(
        'http://localhost:5000/api/zoho/connect',
        {
          accessToken,
          refreshToken,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setMessage('✅ Cuenta de Zoho conectada exitosamente');
        setAccessToken('');
        setRefreshToken('');
        // Recargar usuario
        window.location.reload();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al conectar cuenta de Zoho');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('¿Estás seguro de que quieres desconectar tu cuenta de Zoho?')) {
      return;
    }

    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await axios.delete(
        'http://localhost:5000/api/zoho/disconnect',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setMessage('✅ Cuenta de Zoho desconectada');
        // Recargar usuario
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al desconectar cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="zohosettingscontainer">
      <div className="settingsheader">
        <Calendar size={32} />
        <h2>Integración con Zoho Calendar</h2>
        <p>Conecta tu cuenta de Zoho para sincronizar tareas con tu calendario</p>
      </div>

      {message && (
        <div className="successmessage">
          {message}
        </div>
      )}

      {error && (
        <div className="errormessage">
          {error}
        </div>
      )}

      {isConnected ? (
        <div className="connectedstate">
          <div className="statusbadge connected">
            <LinkIcon size={20} />
            <span>Cuenta de Zoho conectada</span>
          </div>

          <div className="connectioninfo">
            <p>Tu cuenta de Zoho está conectada y lista para sincronizar eventos.</p>
            <ul>
              <li>✅ Las tareas se sincronizarán automáticamente</li>
              <li>✅ Los eventos se actualizarán en tiempo real</li>
              <li>✅ Puedes ver tu calendario de Zoho aquí</li>
            </ul>
          </div>

          <button 
            onClick={handleDisconnect} 
            className="btndisconnect"
            disabled={loading}
          >
            <Unlink size={18} />
            {loading ? 'Desconectando...' : 'Desconectar cuenta de Zoho'}
          </button>
        </div>
      ) : (
        <div className="connectionform">
          <div className="instructions">
            <h3>📝 Cómo obtener tu token de Zoho:</h3>
            <ol>
              <li>Ve a <a href="https://accounts.zoho.com/" target="_blank" rel="noopener noreferrer">Zoho Accounts</a></li>
              <li>Inicia sesión con tu cuenta</li>
              <li>Ve a <strong>Seguridad</strong> → <strong>Tokens de autenticación</strong></li>
              <li>Genera un nuevo token para "Zoho Calendar"</li>
              <li>Copia el token y pégalo aquí abajo</li>
            </ol>
          </div>

          <form onSubmit={handleConnect}>
            <div className="formgroup">
              <label htmlFor="accessToken">
                <Key size={18} />
                Token de Acceso de Zoho *
              </label>
              <input
                type="text"
                id="accessToken"
                placeholder="1000.xxxxxxxxxxxxxxxxxxxxx"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                required
              />
              <small>Requerido: Este es el token de autenticación de Zoho</small>
            </div>

            <div className="formgroup">
              <label htmlFor="refreshToken">
                <Key size={18} />
                Token de Actualización (Opcional)
              </label>
              <input
                type="text"
                id="refreshToken"
                placeholder="1000.xxxxxxxxxxxxxxxxxxxxx"
                value={refreshToken}
                onChange={(e) => setRefreshToken(e.target.value)}
              />
              <small>Opcional: Permite renovar el token automáticamente</small>
            </div>

            <button 
              type="submit" 
              className="btnconnect"
              disabled={loading || !accessToken}
            >
              <LinkIcon size={18} />
              {loading ? 'Conectando...' : 'Conectar cuenta de Zoho'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

