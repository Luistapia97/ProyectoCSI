import { useState } from 'react';
import { Settings as SettingsIcon, User, Calendar, Bell, Shield } from 'lucidereact';
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
    <div className="settingspage">
      <div className="settingsheadermain">
        <SettingsIcon size={32} />
        <h1>Configuración</h1>
      </div>

      <div className="settingslayout">
        <div className="settingssidebar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`tabbutton ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={20} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="settingscontent">
          {activeTab === 'zoho' && <ZohoSettings />}
          {activeTab === 'profile' && (
            <div className="tabcontent">
              <h2>Perfil de Usuario</h2>
              <p>Configuración de perfil próximamente...</p>
            </div>
          )}
          {activeTab === 'notifications' && (
            <div className="tabcontent">
              <h2>Notificaciones</h2>
              <p>Configuración de notificaciones próximamente...</p>
            </div>
          )}
          {activeTab === 'security' && (
            <div className="tabcontent">
              <h2>Seguridad</h2>
              <p>Configuración de seguridad próximamente...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

