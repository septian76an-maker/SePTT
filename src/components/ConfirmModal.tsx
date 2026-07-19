import React from 'react';
import { AlertTriangle, Info, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  type = 'info',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getColorConfig = () => {
    switch (type) {
      case 'danger':
        return {
          iconBg: 'bg-red-100 dark:bg-red-950/30',
          iconColor: 'text-red-600 dark:text-red-400',
          btnBg: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          icon: <Trash2 className="h-6 w-6" />,
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-100 dark:bg-amber-950/30',
          iconColor: 'text-amber-600 dark:text-amber-400',
          btnBg: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
          icon: <AlertTriangle className="h-6 w-6" />,
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
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Backdrop with fade-in */}
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 bg-gray-500/75 dark:bg-gray-900/80 transition-opacity" 
          aria-hidden="true"
          onClick={onCancel}
        />

        {/* Modal panel container to center on screen */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="relative inline-block align-bottom bg-white dark:bg-gray-800 rounded-xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 border border-gray-100 dark:border-gray-700">
          {/* Close button */}
          <div className="absolute top-4 right-4">
            <button
              onClick={onCancel}
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white" id="modal-title">
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {message}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-2">
            <button
              type="button"
              onClick={onConfirm}
              className={`w-full inline-flex justify-center rounded-lg border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors cursor-pointer sm:w-auto ${colors.btnBg}`}
            >
              {confirmText}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors cursor-pointer sm:mt-0 sm:w-auto"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
