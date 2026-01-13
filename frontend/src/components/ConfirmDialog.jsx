import { AlertTriangle, Info, HelpCircle } from 'lucide-react';
import './ConfirmDialog.css';

const ConfirmDialog = ({ 
  isOpen = false,
  title, 
  message, 
  type = 'warning', 
  confirmText = 'Confirmar', 
  cancelText = 'Cancelar',
  onConfirm, 
  onCancel,
  confirmButtonClass
}) => {
  // No renderizar si no está abierto
  if (!isOpen) return null;

  const icons = {
    warning: <AlertTriangle size={48} />,
    danger: <AlertTriangle size={48} />,
    info: <Info size={48} />,
    question: <HelpCircle size={48} />
  };

  // Usar confirmButtonClass si se proporciona, sino usar type
  const buttonClass = confirmButtonClass || type;

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className={`confirm-icon confirm-icon-${type}`}>
          {icons[type] || icons.warning}
        </div>
        <h3 className="confirm-title">{title}</h3>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="btn-cancel" onClick={onCancel}>
            {cancelText}
          </button>
          <button className={`btn-confirm btn-confirm-${buttonClass}`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
