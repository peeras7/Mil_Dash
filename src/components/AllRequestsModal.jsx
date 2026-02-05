import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export default function AllRequestsModal({ requests, onClose, onItemClick }) {
  const [search, setSearch] = useState('');

  // Penapis carian tempatan
  const filtered = requests.filter(r => 
    r.userName?.toLowerCase().includes(search.toLowerCase()) || 
    r.leaveType?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status) => {
    switch (status) {
        case 'Approved': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
        case 'Rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
        default: return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm" onClick={onClose}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-5xl h-[85vh] bg-white dark:bg-[#1e293b] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700/50 bg-slate-50/80 dark:bg-[#162032]">
            <div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Semua Permohonan Cuti</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Senarai penuh rekod permohonan</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400">
              <XMarkIcon className="w-7 h-7" strokeWidth={2.5} />
            </button>
          </div>

          {/* Bar Carian */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-700/50 bg-white dark:bg-[#1e293b]">
            <div className="relative w-full md:w-96">
                <input 
                    type="text" 
                    placeholder="Cari nama atau jenis cuti..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                />
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* Jadual Besar */}
          <div className="flex-1 overflow-auto p-0">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-[#162032] text-xs uppercase text-slate-500 dark:text-slate-400 font-bold sticky top-0 z-10 shadow-sm">
                    <tr>
                        <th className="px-6 py-4">Anggota</th>
                        <th className="px-6 py-4">Jenis Cuti</th>
                        <th className="px-6 py-4">Tarikh Mula</th>
                        <th className="px-6 py-4">Tarikh Tamat</th>
                        <th className="px-6 py-4">Tarikh Mohon</th>
                        <th className="px-6 py-4 text-center">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {filtered.length === 0 ? (
                        <tr><td colSpan="6" className="p-10 text-center text-slate-500">Tiada rekod dijumpai.</td></tr>
                    ) : (
                        filtered.map((req) => (
                            <tr 
                                key={req.id} 
                                onClick={() => onItemClick(req)}
                                className="hover:bg-blue-50/50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer group"
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-xs">
                                            {req.userName?.[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-white text-sm">{req.userName}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{req.rank || 'Anggota'}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">{req.leaveType}</td>
                                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{req.startDate ? format(req.startDate, 'dd MMM yyyy') : '-'}</td>
                                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{req.endDate ? format(req.endDate, 'dd MMM yyyy') : '-'}</td>
                                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-500">{req.createdAt ? format(req.createdAt, 'dd/MM/yy HH:mm') : '-'}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusBadge(req.status)}`}>
                                        {req.status === 'Pending' ? 'Menunggu' : req.status === 'Approved' ? 'Lulus' : 'Tolak'}
                                    </span>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-[#162032] border-t border-slate-200 dark:border-slate-700/50 text-right">
             <p className="text-xs text-slate-500 dark:text-slate-400">Menunjukkan {filtered.length} daripada {requests.length} rekod</p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}