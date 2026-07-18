import { useState, useEffect } from 'react';
import { Cpu, Server, Loader2, CheckCircle2, Link2, AlertCircle } from 'lucide-react';
import { collection, query, where, onSnapshot, Timestamp, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Device } from '../types';

export function Overview() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [availableServers, setAvailableServers] = useState<{id: string, name: string, url: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  useEffect(() => {
    // Query devices that are active
    const q = query(
      collection(db, 'devices'),
      where('isActive', '==', true)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const devicesData: Device[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        devicesData.push({
          id: docSnap.id,
          activationCode: data.activationCode || '',
          isActive: data.isActive || false,
          assignedServerUrl: data.assignedServerUrl || '',
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
          activatedAt: data.activatedAt instanceof Timestamp ? data.activatedAt.toDate() : undefined,
        });
      });
      setDevices(devicesData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching active devices: ", error);
      setIsLoading(false);
    });

    // Query available servers
    const qServers = query(collection(db, 'servers'), orderBy('createdAt', 'desc'));
    const unsubscribeServers = onSnapshot(qServers, (querySnapshot) => {
      const serversData: {id: string, name: string, url: string}[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.url) {
          serversData.push({
            id: docSnap.id,
            name: data.name || 'Unnamed',
            url: data.url
          });
        }
      });
      setAvailableServers(serversData);
    });

    return () => {
      unsubscribe();
      unsubscribeServers();
    };
  }, []);

  const handleUrlChange = async (deviceId: string, newUrl: string) => {
    if (!newUrl) return;
    
    setUpdatingId(deviceId);
    setErrorId(null);
    
    try {
      const deviceRef = doc(db, 'devices', deviceId);
      await updateDoc(deviceRef, {
        assignedServerUrl: newUrl
      });
    } catch (error) {
      console.error("Gagal mengubah server:", error);
      setErrorId(deviceId);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Daftar perangkat (client) yang sedang aktif dan terhubung ke Server Suara.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Device ID & Kode
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Waktu Aktivasi
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Server Terhubung
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <Loader2 className="mx-auto h-8 w-8 text-indigo-500 animate-spin mb-3" />
                    <p className="text-base font-medium text-gray-900 dark:text-white">Memuat data...</p>
                  </td>
                </tr>
              ) : devices.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <Server className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-base font-medium text-gray-900 dark:text-white">Belum ada perangkat aktif</p>
                    <p className="text-sm">Silakan aktivasi perangkat dari menu Perangkat Tertunda.</p>
                  </td>
                </tr>
              ) : (
                devices.map((device) => (
                  <tr key={device.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                          <Cpu className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">{device.id}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-0.5">Kode: {device.activationCode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-200">
                        {device.activatedAt ? device.activatedAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {device.activatedAt ? device.activatedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="relative max-w-[200px]">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Link2 className="h-4 w-4 text-gray-400" />
                        </div>
                        <select
                          value={device.assignedServerUrl}
                          onChange={(e) => handleUrlChange(device.id, e.target.value)}
                          disabled={updatingId === device.id}
                          className={`block w-full pl-9 pr-8 py-1.5 sm:text-xs rounded-lg border focus:ring-2 focus:outline-none transition-all bg-gray-50 dark:bg-gray-700 appearance-none ${
                            errorId === device.id 
                              ? 'border-red-300 text-red-900 dark:text-red-400 focus:ring-red-500 focus:border-red-500'
                              : 'border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500'
                          } ${updatingId === device.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <option value="" disabled>Pilih Server LiveKit</option>
                          {availableServers.map(server => (
                            <option key={server.id} value={server.url}>
                              {server.name}
                            </option>
                          ))}
                        </select>
                        {updatingId === device.id && (
                          <div className="absolute inset-y-0 right-6 pr-1 flex items-center pointer-events-none">
                            <Loader2 className="h-3 w-3 text-indigo-500 animate-spin" />
                          </div>
                        )}
                        {errorId === device.id && (
                          <div className="absolute inset-y-0 right-6 pr-1 flex items-center pointer-events-none">
                            <AlertCircle className="h-3 w-3 text-red-500" />
                          </div>
                        )}
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                      {errorId === device.id && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          Gagal mengubah server.
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Aktif
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
