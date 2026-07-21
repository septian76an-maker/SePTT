import { useState, useEffect } from 'react';
import { Cpu, Link2, Server, CheckCircle2, Loader2, AlertCircle, Trash2, Search } from 'lucide-react';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, Timestamp, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Device } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';
import { AlertModal } from '../components/AlertModal';
import { notifyUpdate } from '../utils/fcm';

export function PendingDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [availableServers, setAvailableServers] = useState<{id: string, name: string, url: string}[]>([]);
  const [serverUrls, setServerUrls] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Name editing states
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

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
          name: data.name || '',
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
      notifyUpdate(`device-${deviceId}`, "Perangkat Diaktifkan", "Perangkat Anda telah disetujui dan diaktifkan.");
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

  const handleSaveName = async (deviceId: string) => {
    setIsSavingName(true);
    try {
      const deviceRef = doc(db, 'devices', deviceId);
      await updateDoc(deviceRef, {
        name: tempName.trim()
      });
      notifyUpdate(`device-${deviceId}`, "Nama Diperbarui", `Nama perangkat diubah menjadi: ${tempName.trim()}`);
      setEditingNameId(null);
    } catch (error) {
      console.error("Gagal menyimpan nama perangkat:", error);
    } finally {
      setIsSavingName(false);
    }
  };

  const filteredDevices = devices.filter((device) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const deviceName = device.name || '';
    return (
      device.id.toLowerCase().includes(q) ||
      device.activationCode.toLowerCase().includes(q) ||
      deviceName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Perangkat Menunggu Aktivasi</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Daftar perangkat baru yang terdaftar di Firestore namun belum diberikan URL Server Suara.
          </p>
        </div>
        <div className="relative max-w-xs w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm transition-colors"
            placeholder="Cari perangkat atau kode..."
          />
        </div>
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
                  Nama
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
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <Loader2 className="mx-auto h-8 w-8 text-indigo-500 animate-spin mb-3" />
                    <p className="text-base font-medium text-gray-900 dark:text-white">Memuat data...</p>
                  </td>
                </tr>
              ) : devices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <CheckCircle2 className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-base font-medium text-gray-900 dark:text-white">Semua perangkat sudah aktif</p>
                    <p className="text-sm">Tidak ada perangkat baru yang menunggu aktivasi.</p>
                  </td>
                </tr>
              ) : filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <Search className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-base font-medium text-gray-900 dark:text-white">Tidak ada hasil pencarian</p>
                    <p className="text-sm">Coba cari dengan kata kunci lain.</p>
                  </td>
                </tr>
              ) : (
                filteredDevices.map((device) => (
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
                      <div className="max-w-[180px]">
                        {editingNameId === device.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={tempName}
                              onChange={(e) => setTempName(e.target.value)}
                              className="block w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Nama perangkat..."
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveName(device.id);
                                if (e.key === 'Escape') setEditingNameId(null);
                              }}
                            />
                            <button
                              onClick={() => handleSaveName(device.id)}
                              disabled={isSavingName}
                              className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium text-xs p-1"
                            >
                              Simpan
                            </button>
                            <button
                              onClick={() => setEditingNameId(null)}
                              className="text-gray-400 hover:text-gray-500 text-xs p-1"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between w-full group">
                            <span className="text-sm text-gray-900 dark:text-gray-200 font-medium truncate">
                              {device.name || <em className="text-gray-400 dark:text-gray-500 font-normal">Belum dinamai</em>}
                            </span>
                            <button
                              onClick={() => {
                                setEditingNameId(device.id);
                                setTempName(device.name || '');
                              }}
                              className="ml-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-xs font-medium cursor-pointer"
                            >
                              Ubah
                            </button>
                          </div>
                        )}
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
