import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, UserIcon, IdentificationIcon, UserGroupIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import Swal from 'sweetalert2';

export default function AddUserModal({ onClose, onUserAdded }) {
  const [formData, setFormData] = useState({
    name: '',
    rank: '',
    militaryID: '',
    platoon: '',
    contactNumber: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.militaryID) {
        Swal.fire("Ralat", "Sila isi Nama dan ID Tentera.", "warning");
        return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "military_personnel"), {
        ...formData,
        createdAt: serverTimestamp(),
        leavesTaken: 0, // Default values
        leaveBalance: 20
      });

      Swal.fire({
        icon: 'success',
        title: 'Berjaya!',
        text: 'Anggota baru telah ditambah.',
        timer: 1500,
        showConfirmButton: false
      });
      
      onUserAdded();
      onClose();
    } catch (error) {
      console.error("Error adding user: ", error);
      Swal.fire("Ralat", "Gagal menambah anggota.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-white dark:bg-[#1e293b] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-[#162032]">
            <div>
                <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Tambah Anggota</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Masukkan butiran anggota baru</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400">
              <XMarkIcon className="w-6 h-6" strokeWidth={2.5} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            
            {/* Nama */}
            <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Nama Penuh</label>
                <div className="relative">
                    <UserIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text" 
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Contoh: Kpl Ahmad bin Abu"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white text-sm"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
                {/* Pangkat */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Pangkat</label>
                    <select 
                        name="rank"
                        value={formData.rank}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white text-sm appearance-none"
                    >
                        <option value="">Pilih Pangkat</option>
                        <option value="Prajurit Muda">Prajurit Muda</option>
                        <option value="Laskar Udara Kanan">Laskar Udara Kanan</option>
                        <option value="Koperal Udara">Koperal Udara</option>
                        <option value="Sarjan Udara">Sarjan Udara</option>
                        <option value="Pegawai Waran">Pegawai Waran</option>
                        <option value="Leftenan Muda">Leftenan Muda</option>
                        <option value="Leftenan">Leftenan</option>
                        <option value="Kapten">Kapten</option>
                        <option value="Mejar">Mejar</option>
                    </select>
                </div>

                {/* ID Tentera */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">ID Tentera</label>
                    <div className="relative">
                        <IdentificationIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            name="militaryID"
                            value={formData.militaryID}
                            onChange={handleChange}
                            placeholder="T123456"
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white text-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
                {/* Platun */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Platun</label>
                    <div className="relative">
                        <UserGroupIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            name="platoon"
                            value={formData.platoon}
                            onChange={handleChange}
                            placeholder="Alpha / Bravo"
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white text-sm"
                        />
                    </div>
                </div>

                {/* No. Telefon */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">No. Telefon</label>
                    <div className="relative">
                        <PhoneIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            name="contactNumber"
                            value={formData.contactNumber}
                            onChange={handleChange}
                            placeholder="012-3456789"
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Footer Butang */}
            <div className="pt-6 mt-2 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700/50">
                <button 
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                    Batal
                </button>
                <button 
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30 flex items-center gap-2 disabled:opacity-50 transition-all transform hover:scale-105"
                >
                    {loading ? 'Menyimpan...' : 'Simpan Anggota'}
                </button>
            </div>
          </form>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}