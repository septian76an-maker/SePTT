import { Moon, Sun } from 'lucide-react';

export function SettingsPage({ 
  isDarkMode, 
  setIsDarkMode 
}: { 
  isDarkMode: boolean; 
  setIsDarkMode: (val: boolean) => void;
}) {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Pengaturan</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Kelola preferensi dan pengaturan tampilan dashboard.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 transition-colors">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tampilan</h2>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-200">Mode Gelap (Dark Mode)</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gunakan tampilan gelap untuk mengurangi cahaya di ruangan yang minim cahaya.
            </p>
          </div>
          
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              isDarkMode ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
            }`}
            role="switch"
            aria-checked={isDarkMode}
          >
            <span className="sr-only">Toggle dark mode</span>
            <span
              className={`pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                isDarkMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            >
              {isDarkMode ? (
                <Moon className="h-3 w-3 text-indigo-600" />
              ) : (
                <Sun className="h-3 w-3 text-gray-400" />
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
