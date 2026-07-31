import React from 'react';
import { toast } from 'sonner';
import { Toaster } from './Sonner';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastContextType {
  showToast: (title: string, description?: string, type?: ToastType) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const showToast = React.useCallback((title: string, description?: string, type: ToastType = 'info') => {
    const opts = description ? { description } : {};
    switch (type) {
      case 'success':
        toast.success(title, opts);
        break;
      case 'error':
        toast.error(title, opts);
        break;
      case 'warning':
        toast.warning(title, opts);
        break;
      default:
        toast.info(title, opts);
    }
  }, []);

  const success = React.useCallback(
    (title: string, description?: string) => showToast(title, description, 'success'),
    [showToast]
  );
  const error = React.useCallback(
    (title: string, description?: string) => showToast(title, description, 'error'),
    [showToast]
  );
  const warning = React.useCallback(
    (title: string, description?: string) => showToast(title, description, 'warning'),
    [showToast]
  );
  const info = React.useCallback(
    (title: string, description?: string) => showToast(title, description, 'info'),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <Toaster richColors position="top-right" />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
