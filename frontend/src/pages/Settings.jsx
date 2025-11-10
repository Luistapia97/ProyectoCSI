import { useState } from 'react';
import { Settings as SettingsIcon, User, Calendar, Bell, Shield } from 'lucide-react';
import ZohoSettings from '../components/ZohoSettings';
import '../components/Settings.css';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('zoho');

  const tabs = [
    { id: 'zoho', label: 'Integración Zoho', icon: Calendar },
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'security', label: 'Seguridad', icon: Shield },
  ];

  return (
    <div className="settings-page">
      <div className="settings-header-main">
        <SettingsIcon size={32} />
        <h1>Configuración</h1>
      </div>

      <div className="settings-layout">
        <div className="settings-sidebar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={20} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="settings-content">
          {activeTab === 'zoho' && <ZohoSettings />}
          {activeTab === 'profile' && (
            <div className="tab-content">
              <h2>Perfil de Usuario</h2>
              <p>Configuración de perfil próximamente...</p>
            </div>
          )}
          {activeTab === 'notifications' && (
            <div className="tab-content">
              <h2>Notificaciones</h2>
              <p>Configuración de notificaciones próximamente...</p>
            </div>
          )}
          {activeTab === 'security' && (
            <div className="tab-content">
              <h2>Seguridad</h2>
              <p>Configuración de seguridad próximamente...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
