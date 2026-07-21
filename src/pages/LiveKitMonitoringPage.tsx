import React, { useState, useEffect } from 'react';
import { Activity, Users, ArrowUpRight, ArrowDownRight, RefreshCw, Loader2 } from 'lucide-react';

interface Session {
  id: string;
  name: string;
  participants: number;
  createdAt: string;
}

interface Stats {
  participantMinutes: number;
  totalUpstream: string;
  totalDownstream: string;
}

export function LiveKitMonitoringPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMonitoringData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/livekit/monitoring');
      if (!response.ok) {
        throw new Error('Gagal mengambil data monitoring LiveKit');
      }
      const data = await response.json();
      setSessions(data.sessions || []);
      setStats(data.stats || { participantMinutes: 0, totalUpstream: '0 GB', totalDownstream: '0 GB' });
    } catch (err) {
      console.error(err);
      setError('Gagal mengambil data monitoring LiveKit dari server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
    
    // Auto refresh every 30 seconds
    const interval = setInterval(() => {
      fetchMonitoringData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (isLoading && !stats) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="ml-3 text-gray-500">Memuat data monitoring...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex flex-col items-center justify-center py-12">
          <p className="font-medium text-lg mb-4">{error}</p>
          <button 
            onClick={fetchMonitoringData}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="w-6 h-6 text-indigo-500" />
              LiveKit Monitoring
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Pantau statistik dan sesi aktif dari server LiveKit
            </p>
          </div>
          
          <button 
            onClick={fetchMonitoringData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Segarkan
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/50 rounded-lg">
                <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">WebRTC participant minutes</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats?.participantMinutes.toLocaleString()} <span className="text-sm font-normal text-gray-500">mnt</span>
                </h3>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/50 rounded-lg">
                <ArrowUpRight className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Upstream</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats?.totalUpstream}
                </h3>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
                <ArrowDownRight className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Downstream</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats?.totalDownstream}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Sessions Table */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm transition-colors">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Sesi Aktif ({sessions.length})</h3>
          </div>
          
          {sessions.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center">
              <Activity className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
              <p>Tidak ada sesi yang sedang aktif saat ini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                    <th className="px-6 py-4 font-medium">Room ID / Name</th>
                    <th className="px-6 py-4 font-medium">Participants</th>
                    <th className="px-6 py-4 font-medium">Waktu Dibuat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">{session.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{session.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                          {session.participants} Active
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                        {new Date(session.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
