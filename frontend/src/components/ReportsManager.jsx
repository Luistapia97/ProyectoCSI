import { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Mail, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle,
  Calendar,
  Trash2,
  Send
} from 'lucide-react';
import { reportsAPI } from '../services/api';
import Toast from './Toast';
import ConfirmDialog from './ConfirmDialog';

const ReportsManager = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [cronStatus, setCronStatus] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [emailModal, setEmailModal] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, filename: null });

  useEffect(() => {
    fetchReports();
    fetchCronStatus();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await reportsAPI.getHistory();
      setReports(response.data.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      showToast('Error cargando historial de reportes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCronStatus = async () => {
    try {
      const response = await reportsAPI.getCronStatus();
      setCronStatus(response.data);
    } catch (error) {
      console.error('Error fetching cron status:', error);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      const response = await reportsAPI.generate();
      showToast('Reporte generado exitosamente', 'success');
      await fetchReports(); // Refrescar la lista
    } catch (error) {
      console.error('Error generating report:', error);
      showToast('Error generando el reporte', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadReport = async (filename) => {
    try {
      await reportsAPI.download(filename);
      showToast('Reporte descargado exitosamente', 'success');
    } catch (error) {
      console.error('Error downloading report:', error);
      const errorMessage = error.message || 'Error descargando el reporte';
      showToast(errorMessage, 'error');
    }
  };

  const handleVerifyEmail = async () => {
    try {
      setVerifyingEmail(true);
      const response = await reportsAPI.verifyEmail();
      showToast(response.data.message || 'Email de prueba enviado exitosamente', 'success');
    } catch (error) {
      console.error('Error verifying email:', error);
      const errorMessage = error.response?.data?.message || 'Error al verificar configuración de email';
      showToast(errorMessage, 'error');
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailRecipients.trim()) {
      showToast('Ingresa al menos un destinatario', 'error');
      return;
    }

    try {
      setSendingEmail(true);
      const recipients = emailRecipients.split(',').map(email => email.trim());
      const response = await reportsAPI.sendEmail(recipients);
      
      if (response.data.success) {
        showToast(response.data.message, 'success');
        setEmailModal(false);
        setEmailRecipients('');
      } else {
        showToast(response.data.message, 'error');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      showToast('Error enviando el reporte', 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleTriggerAutomated = async () => {
    try {
      setLoading(true);
      await reportsAPI.trigger();
      showToast('Reporte automático ejecutado', 'success');
    } catch (error) {
      console.error('Error triggering report:', error);
      showToast('Error ejecutando reporte automático', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async () => {
    if (!deleteConfirm.filename) {
      showToast('Error: No se especificó el archivo a eliminar', 'error');
      setDeleteConfirm({ show: false, filename: null });
      return;
    }

    try {
      await reportsAPI.deleteReport(deleteConfirm.filename);
      showToast('Reporte eliminado exitosamente', 'success');
      setDeleteConfirm({ show: false, filename: null });
      await fetchReports();
    } catch (error) {
      console.error('Error deleting report:', error);
      const errorMessage = error.response?.data?.message || 'Error eliminando el reporte';
      showToast(errorMessage, 'error');
      setDeleteConfirm({ show: false, filename: null });
    }
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="reports-manager">
      <div className="reports-header">
        <div className="header-content">
          <FileText size={24} />
          <div>
            <h2>Reportes de Seguimiento</h2>
            <p>Gestiona y genera reportes semanales de desempeño</p>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="btn-outline"
            onClick={handleVerifyEmail}
            disabled={verifyingEmail}
            title="Enviar correo de prueba para verificar configuración SMTP"
          >
            {verifyingEmail ? (
              <>
                <RefreshCw size={18} className="spinning" />
                Verificando...
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                Verificar Email
              </>
            )}
          </button>
          <button
            className="btn-secondary"
            onClick={() => setEmailModal(true)}
            disabled={generating || reports.length === 0}
          >
            <Mail size={18} />
            Enviar por Email
          </button>
          <button
            className="btn-primary"
            onClick={handleGenerateReport}
            disabled={generating}
          >
            {generating ? (
              <>
                <RefreshCw size={18} className="spinning" />
                Generando...
              </>
            ) : (
              <>
                <FileText size={18} />
                Generar Reporte
              </>
            )}
          </button>
        </div>
      </div>

      {/* Cron Status */}
      {cronStatus && (
        <div className="cron-status-card">
          <div className="cron-info">
            <Clock size={20} />
            <div>
              <h3>Envío Automático</h3>
              <p>Próximo envío: {cronStatus.jobs?.[0]?.schedule || 'No configurado'}</p>
              {cronStatus.recipients?.length > 0 && (
                <p className="recipients">
                  Destinatarios: {cronStatus.recipients.join(', ')}
                </p>
              )}
            </div>
          </div>
          <button
            className="btn-outline"
            onClick={handleTriggerAutomated}
            disabled={loading}
          >
            <Send size={18} />
            Ejecutar Ahora
          </button>
        </div>
      )}

      {/* Reports History */}
      <div className="reports-list">
        <h3>Historial de Reportes</h3>
        {loading && reports.length === 0 ? (
          <div className="loading-state">
            <RefreshCw size={24} className="spinning" />
            <p>Cargando reportes...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <p>No hay reportes generados</p>
            <p className="subtitle">Genera tu primer reporte para comenzar</p>
          </div>
        ) : (
          <div className="reports-grid">
            {reports.map((report) => (
              <div key={report.filename} className="report-card">
                <div className="report-icon">
                  <FileText size={32} />
                </div>
                <div className="report-info">
                  <h4>{report.filename}</h4>
                  <div className="report-meta">
                    <span>
                      <Calendar size={14} />
                      {formatDate(report.createdAt)}
                    </span>
                    <span className="file-size">
                      {formatFileSize(report.size)}
                    </span>
                  </div>
                </div>
                <div className="report-actions">
                  <button
                    className="btn-icon"
                    onClick={() => handleDownloadReport(report.filename)}
                    title="Descargar"
                  >
                    <Download size={18} />
                  </button>
                  <button
                    className="btn-icon danger"
                    onClick={() => setDeleteConfirm({ show: true, filename: report.filename })}
                    title="Eliminar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Email Modal */}
      {emailModal && (
        <div className="modal-overlay" onClick={() => setEmailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <Mail size={20} />
                Enviar Reporte por Email
              </h3>
              <button
                className="close-button"
                onClick={() => setEmailModal(false)}
              >
                <XCircle size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                Se generará y enviará el reporte más reciente a los destinatarios especificados.
              </p>
              <div className="form-group">
                <label>Destinatarios (separar por comas)</label>
                <textarea
                  value={emailRecipients}
                  onChange={(e) => setEmailRecipients(e.target.value)}
                  placeholder="admin@ejemplo.com, gerente@ejemplo.com"
                  rows="3"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setEmailModal(false)}
                disabled={sendingEmail}
              >
                Cancelar
              </button>
              <button
                className="btn-primary"
                onClick={handleSendEmail}
                disabled={sendingEmail}
              >
                {sendingEmail ? (
                  <>
                    <RefreshCw size={18} className="spinning" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Enviar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.show}
        title="Eliminar Reporte"
        message="¿Estás seguro de que deseas eliminar este reporte? Esta acción no se puede deshacer."
        onConfirm={handleDeleteReport}
        onCancel={() => setDeleteConfirm({ show: false, filename: null })}
        confirmText="Eliminar"
        confirmButtonClass="danger"
      />

      {/* Toast */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
};

export default ReportsManager;
