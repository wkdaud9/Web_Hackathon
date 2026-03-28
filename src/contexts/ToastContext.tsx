import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {typeof document !== 'undefined' && createPortal(
        <div className="fixed bottom-10 right-10 z-[10001] flex flex-col gap-3 pointer-events-none items-end">
          <AnimatePresence>
            {toasts.map((toast) => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 50, scale: 0.9, x: 20 }}
                animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2 } }}
                className="pointer-events-auto flex items-center gap-3 bg-white/95 backdrop-blur-md border border-gray-100 shadow-[0_12px_40px_rgba(0,0,0,0.15)] px-6 py-4 rounded-[24px] w-full max-w-sm"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full shrink-0">
                  {toast.type === 'success' && <div className="bg-emerald-50 p-1.5 rounded-full"><CheckCircle2 className="w-5 h-5 text-emerald-500" /></div>}
                  {toast.type === 'error' && <div className="bg-red-50 p-1.5 rounded-full"><AlertCircle className="w-5 h-5 text-red-500" /></div>}
                  {toast.type === 'info' && <div className="bg-blue-50 p-1.5 rounded-full"><Info className="w-5 h-5 text-blue-500" /></div>}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold text-primary leading-tight whitespace-nowrap truncate">{toast.message}</p>
                </div>

                <button 
                  onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                  className="p-1 text-tertiary hover:text-primary transition-colors rounded-full hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};
