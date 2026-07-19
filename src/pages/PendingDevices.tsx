import { useState, useEffect } from 'react';
import { Cpu, Link2, Server, CheckCircle2, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, Timestamp, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Device } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';
import { AlertModal } from '../components/AlertModal';

export function PendingDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [availableServers, setAvailableServers] = useState<{id: string, name: string, url: string}[]>([]);
  const [serverUrls, setServerUrls] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // States for custom modals
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [alertInfo, setAlertInfo] = useState<{isOpen: boolean, title: string, message: string, type: 'success' | 'error' | 'info'} | null>(null);

  useEffect(() => {
    // Query devices that are not active yet
    const qDevices = query(
      collection(db, 'devices'),
      where('isActive', '==', false)
    );

    const unsubscribeDevices = onSnapshot(qDevices, (querySnapshot) => {
      const devicesData: Device[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        devicesData.push({
          id: docSnap.id,
          activationCode: data.activationCode || '',
          isActive: data.isActive || false,
          assignedServerUrl: data.assignedServerUrl || '',
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
        });
      });
      setDevices(devicesData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching devices: ", error);
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
      unsubscribeDevices();
      unsubscribeServers();
    };
  }, []);

  const handleUrlChange = (deviceId: string, url: string) => {
    setServerUrls(prev => ({ ...prev, [deviceId]: url }));
    if (errorId === deviceId) setErrorId(null);
  };

  const handleActivate = async (deviceId: string) => {
    const url = serverUrls[deviceId] || '';
    
    // Validasi URL sederhana
    if (!url || (!url.startsWith('http') && !url.startsWith('ws'))) {
      setErrorId(deviceId);
      return;
    }

    setLoadingId(deviceId);
    setErrorId(null);

    try {
      const deviceRef = doc(db, 'devices', deviceId);
      await updateDoc(deviceRef, {
        isActive: true,
        assignedServerUrl: url,
        activatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Gagal mengaktivasi:", error);
      setErrorId(deviceId);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    setConfirmDeleteId(null);
    try {
      await deleteDoc(doc(db, 'devices', deviceId));
      setAlertInfo({
        isOpen: true,
        title: 'Berhasil',
        message: `Perangkat "${deviceId}" berhasil dihapus dari sistem.`,
        type: 'success'
      });
    } catch (error) {
      console.error("Gagal menghapus perangkat:", error);
      setAlertInfo({
        isOpen: true,
        title: 'Gagal',
        message: 'Gagal menghapus perangkat dari Firestore.',
        type: 'error'
      });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Perangkat Menunggu Aktivasi</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Daftar perangkat baru yang terdaftar di Firestore namun belum diberikan URL Server Suara.
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
                  Waktu Daftar
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Konfigurasi Server
                </th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Aksi
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
                    <CheckCircle2 className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-base font-medium text-gray-900 dark:text-white">Semua perangkat sudah aktif</p>
                    <p className="text-sm">Tidak ada perangkat baru yang menunggu aktivasi.</p>
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
                        {device.createdAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {device.createdAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="relative max-w-xs">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Link2 className="h-4 w-4 text-gray-400" />
                        </div>
                        <select
                          value={serverUrls[device.id] || ''}
                          onChange={(e) => handleUrlChange(device.id, e.target.value)}
                          className={`block w-full pl-9 pr-3 py-2 sm:text-sm rounded-lg border focus:ring-2 focus:outline-none transition-all bg-gray-50 dark:bg-gray-700 appearance-none ${
                            errorId === device.id 
                              ? 'border-red-300 text-red-900 dark:text-red-400 focus:ring-red-500 focus:border-red-500'
                              : 'border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500'
                          }`}
                        >
                          <option value="" disabled>Pilih Server LiveKit</option>
                          {availableServers.map(server => (
                            <option key={server.id} value={server.url}>
                              {server.name} ({server.url})
                            </option>
                          ))}
                        </select>
                        {errorId === device.id && (
                          <div className="absolute inset-y-0 right-8 pr-3 flex items-center pointer-events-none">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          </div>
                        )}
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                      {errorId === device.id && (
                        <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                          Pilih server yang valid dari daftar.
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex items-center justify-end gap-2">
                      <button
                        onClick={() => setConfirmDeleteId(device.id)}
                        className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-2 rounded hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                        title="Hapus Perangkat"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                      <button
                        onClick={() => handleActivate(device.id)}
                        disabled={loadingId === device.id}
                        className={`inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all ${
                          loadingId === device.id ? 'opacity-75 cursor-not-allowed' : ''
                        }`}
                      >
                        {loadingId === device.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Memproses...
                          </>
                        ) : (
                          <>
                            <Server className="h-4 w-4" />
                            Aktivasi
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Deleting Pending Device */}
      <ConfirmModal
        isOpen={confirmDeleteId !== null}
        title="Hapus Registrasi Perangkat"
        message={`Apakah Anda yakin ingin menghapus perangkat "${confirmDeleteId}"? Tindakan ini bersifat permanen.`}
        confirmText="Hapus"
        cancelText="Batal"
        type="danger"
        onConfirm={() => confirmDeleteId && handleDeleteDevice(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {/* Alert Modal */}
      {alertInfo && (
        <AlertModal
          isOpen={alertInfo.isOpen}
          title={alertInfo.title}
          message={alertInfo.message}
          type={alertInfo.type}
          onClose={() => setAlertInfo(null)}
        />
      )}
    </div>
  );
}
