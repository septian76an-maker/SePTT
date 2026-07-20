import { useState, useEffect } from 'react';
import { Cpu, Server, Loader2, CheckCircle2, Link2, AlertCircle, Folder, Search } from 'lucide-react';
import { collection, query, where, onSnapshot, Timestamp, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Device } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';
import { AlertModal } from '../components/AlertModal';

export function Overview() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [availableServers, setAvailableServers] = useState<{id: string, name: string, url: string}[]>([]);
  const [availableGroups, setAvailableGroups] = useState<{id: string, name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [updatingGroupId, setUpdatingGroupId] = useState<string | null>(null);
  const [groupErrorId, setGroupErrorId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Name editing states
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  // States for custom modals
  const [confirmDeactivateId, setConfirmDeactivateId] = useState<string | null>(null);
  const [alertInfo, setAlertInfo] = useState<{isOpen: boolean, title: string, message: string, type: 'success' | 'error' | 'info'} | null>(null);

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
          groupId: data.groupId || '',
          name: data.name || '',
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

    // Query available groups
    const qGroups = query(collection(db, 'groups'), orderBy('createdAt', 'desc'));
    const unsubscribeGroups = onSnapshot(qGroups, (querySnapshot) => {
      const groupsData: {id: string, name: string}[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        groupsData.push({
          id: docSnap.id,
          name: data.name || 'Tanpa Nama',
        });
      });
      setAvailableGroups(groupsData);
    }, (error) => {
      console.error("Error fetching groups for overview: ", error);
    });

    return () => {
      unsubscribe();
      unsubscribeServers();
      unsubscribeGroups();
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

  const handleGroupChange = async (deviceId: string, newGroupId: string) => {
    setUpdatingGroupId(deviceId);
    setGroupErrorId(null);
    
    try {
      const deviceRef = doc(db, 'devices', deviceId);
      await updateDoc(deviceRef, {
        groupId: newGroupId
      });
    } catch (error) {
      console.error("Gagal mengubah group:", error);
      setGroupErrorId(deviceId);
    } finally {
      setUpdatingGroupId(null);
    }
  };

  const handleDeactivate = async (deviceId: string) => {
    setConfirmDeactivateId(null);
    try {
      const deviceRef = doc(db, 'devices', deviceId);
      await updateDoc(deviceRef, {
        isActive: false
      });
      setAlertInfo({
        isOpen: true,
        title: 'Berhasil',
        message: `Perangkat "${deviceId}" berhasil dinonaktifkan.`,
        type: 'success'
      });
    } catch (error) {
      console.error("Gagal menonaktifkan perangkat:", error);
      setAlertInfo({
        isOpen: true,
        title: 'Gagal',
        message: 'Gagal menonaktifkan perangkat.',
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
    
    const groupName = availableGroups.find(g => g.id === device.groupId)?.name || 'Tanpa Group';
    const serverName = availableServers.find(s => s.url === device.assignedServerUrl)?.name || '';
    const deviceName = device.name || '';

    return (
      device.id.toLowerCase().includes(q) ||
      device.activationCode.toLowerCase().includes(q) ||
      deviceName.toLowerCase().includes(q) ||
      groupName.toLowerCase().includes(q) ||
      serverName.toLowerCase().includes(q) ||
      device.assignedServerUrl.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Daftar perangkat (client) yang sedang aktif dan terhubung ke Server Suara.
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
            placeholder="Cari perangkat, kode, group..."
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
                  Group
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
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <Loader2 className="mx-auto h-8 w-8 text-indigo-500 animate-spin mb-3" />
                    <p className="text-base font-medium text-gray-900 dark:text-white">Memuat data...</p>
                  </td>
                </tr>
              ) : devices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <Server className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-base font-medium text-gray-900 dark:text-white">Belum ada perangkat aktif</p>
                    <p className="text-sm">Silakan aktivasi perangkat dari menu Perangkat Tertunda.</p>
                  </td>
                </tr>
              ) : filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
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
                      <div className="relative max-w-[180px]">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Folder className="h-4 w-4 text-gray-400" />
                        </div>
                        <select
                          value={device.groupId || ''}
                          onChange={(e) => handleGroupChange(device.id, e.target.value)}
                          disabled={updatingGroupId === device.id}
                          className={`block w-full pl-9 pr-8 py-1.5 sm:text-xs rounded-lg border focus:ring-2 focus:outline-none transition-all bg-gray-50 dark:bg-gray-700 appearance-none ${
                            groupErrorId === device.id 
                              ? 'border-red-300 text-red-900 dark:text-red-400 focus:ring-red-500 focus:border-red-500'
                              : 'border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500'
                          } ${updatingGroupId === device.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <option value="">Tanpa Group</option>
                          {availableGroups.map(group => (
                            <option key={group.id} value={group.id}>
                              {group.name}
                            </option>
                          ))}
                        </select>
                        {updatingGroupId === device.id && (
                          <div className="absolute inset-y-0 right-6 pr-1 flex items-center pointer-events-none">
                            <Loader2 className="h-3 w-3 text-indigo-500 animate-spin" />
                          </div>
                        )}
                        {groupErrorId === device.id && (
                          <div className="absolute inset-y-0 right-6 pr-1 flex items-center pointer-events-none">
                            <AlertCircle className="h-3 w-3 text-red-500" />
                          </div>
                        )}
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                      {groupErrorId === device.id && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          Gagal mengubah group.
                        </p>
                      )}
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
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setConfirmDeactivateId(device.id)}
                          className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 bg-emerald-500"
                          role="switch"
                          aria-checked="true"
                          title="Klik untuk menonaktifkan perangkat"
                        >
                          <span
                            aria-hidden="true"
                            className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                          />
                        </button>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Aktif
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Deactivation */}
      <ConfirmModal
        isOpen={confirmDeactivateId !== null}
        title="Nonaktifkan Perangkat"
        message={`Apakah Anda yakin ingin menonaktifkan perangkat "${confirmDeactivateId}"? Perangkat ini akan dipindahkan kembali ke daftar Perangkat Tertunda.`}
        confirmText="Nonaktifkan"
        cancelText="Batal"
        type="warning"
        onConfirm={() => confirmDeactivateId && handleDeactivate(confirmDeactivateId)}
        onCancel={() => setConfirmDeactivateId(null)}
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
