import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const Toast = ({ toast, onDismiss }) => {
  const { id, message, type = 'info', duration = 4000 } = toast;
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setExiting(true);
        setTimeout(() => onDismiss(id), 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onDismiss]);

  const config = {
    success: { icon: CheckCircle, bg: 'bg-green-600', border: 'border-green-400', text: 'text-green-400' },
    error:   { icon: AlertCircle, bg: 'bg-red-600', border: 'border-red-400', text: 'text-red-400' },
    warning: { icon: AlertTriangle, bg: 'bg-yellow-600', border: 'border-yellow-400', text: 'text-yellow-400' },
    info:    { icon: Info, bg: 'bg-cyan-600', border: 'border-cyan-400', text: 'text-cyan-400' },
  };

  const { icon: Icon, border, text } = config[type] || config.info;

  return (
    <div
      className={`flex items-start gap-3 p-4 bg-gray-900 border-l-4 ${border} rounded-lg shadow-2xl max-w-sm w-full animate-slide-in ${exiting ? 'opacity-0 translate-x-full transition-all duration-300' : ''}`}
      role="alert"
      aria-live="polite"
    >
      <Icon className={`w-5 h-5 ${text} flex-shrink-0 mt-0.5`} />
      <p className="text-gray-200 text-sm flex-1">{message}</p>
      <button
        onClick={() => { setExiting(true); setTimeout(() => onDismiss(id), 300); }}
        className="text-gray-500 hover:text-white transition-colors flex-shrink-0"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

const ToastContainer = ({ toasts, onDismiss }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none" aria-label="Notifications">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
