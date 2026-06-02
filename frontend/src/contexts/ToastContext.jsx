import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now().toString();
    setToasts((currentToasts) => [...currentToasts, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toast = {
    success: (message, duration) => addToast(message, 'success', duration),
    error: (message, duration) => addToast(message, 'error', duration)
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none max-w-sm w-full">
        {toasts.map((t) => (
          <div 
            key={t.id} 
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-2xl border backdrop-blur-md animate-slide-up transition-all ${
              t.type === 'success' 
                ? 'bg-emerald-950/80 border-emerald-500/30' 
                : 'bg-red-950/80 border-red-500/30'
            }`}
          >
            <div className={`mt-0.5 shrink-0 ${t.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
              {t.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            </div>
            
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-100">
                {t.type === 'success' ? 'Success' : 'Error'}
              </p>
              <p className={`text-xs mt-1 ${t.type === 'success' ? 'text-emerald-200/70' : 'text-red-200/70'}`}>
                {t.message}
              </p>
            </div>
            
            <button 
              onClick={() => removeToast(t.id)}
              className="p-1 rounded-md hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
