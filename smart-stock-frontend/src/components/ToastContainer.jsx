import { useEffect } from 'react';
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';

const DURACAO_TOAST_MS = 4000;

const ICONES_TOAST = {
  sucesso: CircleCheck,
  erro: CircleAlert,
  info: Info
};

function ToastItem({ toast, onFechar }) {
  const { id } = toast;
  const Icone = ICONES_TOAST[toast.tipo] ?? Info;

  useEffect(() => {
    const timer = setTimeout(() => onFechar(id), DURACAO_TOAST_MS);
    return () => clearTimeout(timer);
  }, [id, onFechar]);

  return (
    <div className={`toast toast--${toast.tipo}`}>
      <Icone size={18} className="toast-icone" aria-hidden="true" />
      <span className="toast-mensagem">{toast.mensagem}</span>
      <button type="button" className="toast-fechar" onClick={() => onFechar(id)} aria-label="Fechar notificação">
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

function ToastContainer({ toasts, onFechar }) {
  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onFechar={onFechar} />
      ))}
    </div>
  );
}

export default ToastContainer;
