import React, { createContext, useContext, useState, useCallback } from 'react';
import { cn } from '../../utils/cn';
import { CheckCircle, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (title: string, description?: string, type?: ToastType) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((title: string, description?: string, type: ToastType = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastMessage = { id, title, description, type };
    setToasts((prev) => [...prev, newToast]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const success = useCallback((title: string, description?: string) => showToast(title, description, 'success'), [showToast]);
  const error = useCallback((title: string, description?: string) => showToast(title, description, 'error'), [showToast]);
  const warning = useCallback((title: string, description?: string) => showToast(title, description, 'warning'), [showToast]);
  const info = useCallback((title: string, description?: string) => showToast(title, description, 'info'), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => {
          const icons = {
            success: <CheckCircle className="w-5 h-5 text-emerald-bright shrink-0" />,
            error: <XCircle className="w-5 h-5 text-rose-danger shrink-0" />,
            warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
            info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
          };

          const borderColors = {
            success: "border-l-4 border-l-emerald-bright bg-white/95",
            error: "border-l-4 border-l-rose-danger bg-white/95",
            warning: "border-l-4 border-l-amber-500 bg-white/95",
            info: "border-l-4 border-l-blue-500 bg-white/95",
          };

          return (
            <div
              key={t.id}
              className={cn(
                "pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-glass border border-slate/15 backdrop-blur-md animate-slide-down transition-all",
                borderColors[t.type]
              )}
            >
              {icons[t.type]}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-obsidian">{t.title}</p>
                {t.description && <p className="text-xs text-slate mt-0.5 leading-relaxed">{t.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="text-slate hover:text-obsidian p-1 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
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
