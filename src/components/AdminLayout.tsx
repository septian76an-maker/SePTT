import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Server, 
  Users, 
  Settings, 
  Bell,
  Search,
  LogOut,
  Cpu,
  Folder,
  Clock,
  Menu,
  X,
  Activity
} from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export function AdminLayout({ 
  children,
  activeTab,
  onTabChange,
  onLogout,
  username
}: { 
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  username: string;
}) {
  const [pendingDevices, setPendingDevices] = useState<any[]>([]);
  const [dismissedDeviceIds, setDismissedDeviceIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dismissedDevices');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const handleMarkAllRead = () => {
    const newDismissed = [...dismissedDeviceIds, ...pendingDevices.map(d => d.id)];
    const uniqueDismissed = Array.from(new Set(newDismissed));
    setDismissedDeviceIds(uniqueDismissed);
    localStorage.setItem('dismissedDevices', JSON.stringify(uniqueDismissed));
    setShowNotifications(false);
  };
  const visibleNotifications = pendingDevices.filter(d => !dismissedDeviceIds.includes(d.id));
  const [showNotifications, setShowNotifications] = useState(false);
  const [isWiggling, setIsWiggling] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const prevCountRef = useRef(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'devices'), where('isActive', '==', false));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const devices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPendingDevices(devices);
      
      if (devices.length > prevCountRef.current) {
        setIsWiggling(true);
        setTimeout(() => setIsWiggling(false), 1500);
      }
      prevCountRef.current = devices.length;
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'pending', label: 'Perangkat Tertunda', icon: Cpu },
    { id: 'groups', label: 'Group', icon: Folder },
    { id: 'server', label: 'Server', icon: Server },
    { id: 'users', label: 'Pengguna', icon: Users },
    { id: 'livekit', label: 'LiveKit Monitoring', icon: Activity },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ease-in-out md:relative ${
        isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 md:w-0 md:border-r-0 md:overflow-hidden md:-translate-x-full'
      }`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100 dark:border-gray-700 whitespace-nowrap overflow-hidden">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Server className="w-6 h-6 flex-shrink-0" />
            <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">SePTT</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5 flex-shrink-0" />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto overflow-x-hidden whitespace-nowrap">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <LogOut className="w-5 h-5 text-gray-400" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 sm:px-6 lg:px-8 transition-colors">
          <div className="flex-1 flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className={`p-2 -ml-2 text-gray-400 hover:text-gray-500 ${isSidebarOpen ? 'md:hidden' : ''}`}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="relative w-full max-w-md hidden sm:block">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input 
                type="text" 
                placeholder="Cari..." 
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg leading-5 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
              />
            </div>
          </div>
          <div className="ml-4 flex items-center md:ml-6 gap-4">
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="sr-only">Notifikasi</span>
                <Bell className={`h-5 w-5 ${isWiggling ? 'animate-wiggle' : ''}`} />
                {visibleNotifications.length > 0 && (
                  <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifikasi</h3>
                    {visibleNotifications.length > 0 && (
                      <span className="text-xs font-medium bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full">
                        {visibleNotifications.length} Baru
                      </span>
                    )}
                    </div>
                    {visibleNotifications.length > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="w-full text-right text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium"
                      >
                        Tandai sudah dibaca
                      </button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {visibleNotifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                        Tidak ada notifikasi baru
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {visibleNotifications.slice(0, 4).map(device => (
                          <div 
                            key={device.id}
                            className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                            onClick={() => {
                              onTabChange('pending');
                              setShowNotifications(false);
                            }}
                          >
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              Perangkat Baru Terdaftar
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              ID: {device.id}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {visibleNotifications.length > 0 && (
                    <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                      <button 
                        onClick={() => {
                          onTabChange('pending');
                          setShowNotifications(false);
                        }}
                        className="w-full text-center text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                      >
                        Lihat Semua Perangkat Tertunda
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium text-sm">
              {username.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
