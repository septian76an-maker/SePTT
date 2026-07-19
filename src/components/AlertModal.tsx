import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

interface AlertModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export function AlertModal({
  isOpen,
  title,
  message,
  type = 'info',
  onClose,
}: AlertModalProps) {
  if (!isOpen) return null;

  const getColorConfig = () => {
    switch (type) {
      case 'success':
        return {
          iconBg: 'bg-emerald-100 dark:bg-emerald-950/30',
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          btnBg: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500',
          icon: <CheckCircle2 className="h-6 w-6" />,
        };
      case 'error':
        return {
          iconBg: 'bg-red-100 dark:bg-red-950/30',
          iconColor: 'text-red-600 dark:text-red-400',
          btnBg: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          icon: <AlertCircle className="h-6 w-6" />,
        };
      case 'info':
      default:
        return {
          iconBg: 'bg-indigo-100 dark:bg-indigo-950/30',
          iconColor: 'text-indigo-600 dark:text-indigo-400',
          btnBg: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
          icon: <Info className="h-6 w-6" />,
        };
    }
  };

  const colors = getColorConfig();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 bg-gray-500/75 dark:bg-gray-900/80 transition-opacity" 
          aria-hidden="true"
          onClick={onClose}
        />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="relative inline-block align-bottom bg-white dark:bg-gray-800 rounded-xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full sm:p-6 border border-gray-100 dark:border-gray-700 animate-in fade-in-50 duration-200">
          <div className="absolute top-4 right-4">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${colors.iconBg} ${colors.iconColor} sm:mx-0 sm:h-10 sm:w-10`}>
              {colors.icon}
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {message}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className={`w-full inline-flex justify-center rounded-lg border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors cursor-pointer sm:w-auto ${colors.btnBg}`}
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
