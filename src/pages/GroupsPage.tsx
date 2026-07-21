import React, { useState, useEffect } from 'react';
import { FolderPlus, Folder, Trash2, Loader2, AlertCircle, CheckCircle2, Search } from 'lucide-react';
import { collection, addDoc, deleteDoc, doc, serverTimestamp, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { ConfirmModal } from '../components/ConfirmModal';
import { AlertModal } from '../components/AlertModal';
import { notifyUpdate } from '../utils/fcm';

interface Group {
  id: string;
  name: string;
  createdAt: Date;
}

export function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // States for custom modals
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [alertInfo, setAlertInfo] = useState<{isOpen: boolean, title: string, message: string, type: 'success' | 'error' | 'info'} | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'groups'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const groupsData: Group[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        groupsData.push({
          id: docSnap.id,
          name: data.name || '',
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      });
      setGroups(groupsData);
      setIsLoading(false);
    }, (err) => {
      console.error("Error fetching groups: ", err);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setError("Nama group tidak boleh kosong.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await addDoc(collection(db, 'groups'), {
        name: groupName.trim(),
        createdAt: serverTimestamp(),
      });
      notifyUpdate('global', 'Grup Baru Dibuat', `Grup "${groupName.trim()}" telah ditambahkan.`);
      setSuccessMsg("Group berhasil ditambahkan.");
      setGroupName('');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error("Error adding group:", err);
      setError("Gagal menambahkan group.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    setConfirmDeleteId(null);
    try {
      await deleteDoc(doc(db, 'groups', id));
      notifyUpdate('global', 'Grup Dihapus', 'Sebuah grup telah dihapus dari sistem.');
      setAlertInfo({
        isOpen: true,
        title: 'Berhasil',
        message: 'Group berhasil dihapus.',
        type: 'success'
      });
    } catch (err) {
      console.error("Error deleting group:", err);
      setAlertInfo({
        isOpen: true,
        title: 'Gagal',
        message: 'Gagal menghapus group.',
        type: 'error'
      });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Manajemen Group</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Buat dan kelola daftar group untuk mengelompokkan perangkat aktif Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tambah Group Baru */}
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 transition-colors">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-indigo-500" />
              Tambah Group
            </h2>

            <form onSubmit={handleAddGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nama Group
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Folder className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="Contoh: Tim Lapangan A"
                  />
                </div>
              </div>

              {error && (
                <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {successMsg && (
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-sm flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>{successMsg}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-75 transition-colors cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Group'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Daftar Group */}
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden transition-colors">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Daftar Group</h2>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                  {groups.length} Group
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
                  placeholder="Cari group..."
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Nama Group
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tanggal Dibuat
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                        <Loader2 className="mx-auto h-6 w-6 text-indigo-500 animate-spin mb-2" />
                        Memuat group...
                      </td>
                    </tr>
                  ) : groups.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        <Folder className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600 mb-2" />
                        <p className="text-sm font-medium">Belum ada group</p>
                        <p className="text-xs mt-1">Gunakan form di samping untuk membuat group pertama Anda.</p>
                      </td>
                    </tr>
                  ) : (() => {
                      const filtered = groups.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase().trim()));
                      if (filtered.length === 0) {
                        return (
                          <tr>
                            <td colSpan={3} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                              <Search className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600 mb-2" />
                              <p className="text-sm font-medium">Tidak ada hasil pencarian</p>
                              <p className="text-xs mt-1">Coba cari dengan kata kunci lain.</p>
                            </td>
                          </tr>
                        );
                      }
                      return filtered.map((group) => (
                      <tr key={group.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                              <Folder className="h-4.5 w-4.5 text-indigo-500 dark:text-indigo-400" />
                            </div>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {group.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {group.createdAt.toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => setConfirmDeleteId(group.id)}
                            className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                            title="Hapus Group"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
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
        title="Hapus Group"
        message="Apakah Anda yakin ingin menghapus group ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        type="danger"
        onConfirm={() => confirmDeleteId && handleDeleteGroup(confirmDeleteId)}
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
