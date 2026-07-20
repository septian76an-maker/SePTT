import React, { useState, useEffect } from 'react';
import { Server, Plus, Link as LinkIcon, Trash2, Loader2, ServerCog, Search } from 'lucide-react';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { ConfirmModal } from '../components/ConfirmModal';
import { AlertModal } from '../components/AlertModal';

interface LivekitServer {
  id: string;
  name: string;
  url: string;
  createdAt: Date;
}

export function ServerPage() {
  const [servers, setServers] = useState<LivekitServer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverName, setServerName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // States for custom modals
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [alertInfo, setAlertInfo] = useState<{isOpen: boolean, title: string, message: string, type: 'success' | 'error' | 'info'} | null>(null);
  
  // Format the name into a simple url, e.g. wss://[name]-livekit.app.com
  const generatedUrl = serverName.trim() 
    ? `wss://${serverName.toLowerCase().replace(/[^a-z0-9-]/g, '-')}.livekit.cloud`
    : '';

  useEffect(() => {
    const q = query(collection(db, 'servers'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const serversData: LivekitServer[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        serversData.push({
          id: docSnap.id,
          name: data.name || '',
          url: data.url || '',
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
        });
      });
      setServers(serversData);
      setIsLoading(false);
    }, (err) => {
      console.error("Error fetching servers: ", err);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverName.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'servers'), {
        name: serverName.trim(),
        url: generatedUrl,
        createdAt: serverTimestamp(),
      });
      setServerName('');
      setAlertInfo({
        isOpen: true,
        title: 'Berhasil',
        message: 'Server LiveKit berhasil ditambahkan.',
        type: 'success'
      });
    } catch (err) {
      console.error("Error adding server:", err);
      setAlertInfo({
        isOpen: true,
        title: 'Gagal',
        message: 'Gagal menambahkan server.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteServer = async (id: string) => {
    setConfirmDeleteId(null);
    try {
      await deleteDoc(doc(db, 'servers', id));
      setAlertInfo({
        isOpen: true,
        title: 'Berhasil',
        message: 'Konfigurasi server berhasil dihapus.',
        type: 'success'
      });
    } catch (err) {
      console.error("Error deleting server:", err);
      setAlertInfo({
        isOpen: true,
        title: 'Gagal',
        message: 'Gagal menghapus server.',
        type: 'error'
      });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Manajemen Server LiveKit</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Buat dan kelola URL server WebRTC LiveKit untuk dihubungkan ke perangkat.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tambah Server Baru */}
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 transition-colors">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <ServerCog className="w-5 h-5 text-indigo-500" />
              Buat Server Baru
            </h2>

            <form onSubmit={handleAddServer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nama Server / Proyek
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Server className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={serverName}
                    onChange={(e) => setServerName(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="Misal: ruang-tunggu-1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL LiveKit Otomatis
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LinkIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={generatedUrl}
                    className="block w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-100 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 cursor-not-allowed transition-colors"
                    placeholder="wss://..."
                  />
                </div>
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  URL ini akan otomatis dihasilkan dari nama server.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !serverName.trim()}
                className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-75 transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Tambah Server
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Daftar Server */}
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden transition-colors h-full">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Daftar Server</h2>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                  {servers.length} Server
                </span>
              </div>
              <div className="relative max-w-xs w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-9 pr-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                  placeholder="Cari server..."
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Nama Server
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      LiveKit URL
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        <Loader2 className="mx-auto h-6 w-6 text-indigo-500 animate-spin mb-3" />
                        <p className="text-sm">Memuat data server...</p>
                      </td>
                    </tr>
                  ) : servers.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        <Server className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
                        <p className="text-base font-medium text-gray-900 dark:text-white">Belum ada Server</p>
                      </td>
                    </tr>
                  ) : (() => {
                      const filtered = servers.filter(s => 
                        s.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
                        s.url.toLowerCase().includes(searchQuery.toLowerCase().trim())
                      );
                      if (filtered.length === 0) {
                        return (
                          <tr>
                            <td colSpan={3} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                              <Search className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
                              <p className="text-sm font-medium">Tidak ada hasil pencarian</p>
                              <p className="text-xs mt-1">Coba cari dengan kata kunci lain.</p>
                            </td>
                          </tr>
                        );
                      }
                      return filtered.map((server) => (
                        <tr key={server.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {server.name}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md inline-block">
                              <LinkIcon className="w-3.5 h-3.5" />
                              {server.url}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={async () => {
                                try {
                                  const res = await fetch('/api/livekit/token', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ roomName: server.name, participantName: 'admin-user' })
                                  });
                                  const data = await res.json();
                                  if (data.token) {
                                    setAlertInfo({
                                      isOpen: true,
                                      title: 'Token Dihasilkan',
                                      message: `Token berhasil dibuat untuk server "${server.name}":\n\n${String(data.token).substring(0, 60)}...`,
                                      type: 'success'
                                    });
                                  } else {
                                    setAlertInfo({
                                      isOpen: true,
                                      title: 'Gagal Membuat Token',
                                      message: `Error: ${data.error}`,
                                      type: 'error'
                                    });
                                  }
                                } catch (e) {
                                  console.error(e);
                                  setAlertInfo({
                                    isOpen: true,
                                    title: 'Gagal Membuat Token',
                                    message: `Failed to generate token: ${e instanceof Error ? e.message : String(e)}`,
                                    type: 'error'
                                  });
                                }
                              }}
                              className="text-indigo-600 hover:text-indigo-900 dark:hover:text-indigo-400 p-1 mr-2 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                              title="Generate Token"
                            >
                              <ServerCog className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(server.id)}
                              className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                              title="Hapus Server"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ));
                    })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmDeleteId !== null}
        title="Hapus Konfigurasi Server"
        message="Apakah Anda yakin ingin menghapus konfigurasi server LiveKit ini? Hubungan perangkat yang memakai server ini mungkin akan terganggu."
        confirmText="Hapus"
        cancelText="Batal"
        type="danger"
        onConfirm={() => confirmDeleteId && handleDeleteServer(confirmDeleteId)}
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
