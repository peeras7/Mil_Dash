import React, { useState } from 'react';
import { BellIcon, UserIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ms } from 'date-fns/locale';

export default function CompactNotificationWidget({ requests }) {
  const [isOpen, setIsOpen] = useState(false);

  // Ambil permohonan yang masih 'Pending' untuk notifikasi live
  const pendingRequests = requests.filter(r => r.status === 'Pending');
  const count = pendingRequests.length;

  return (
    <div className="relative h-full flex items-center justify-center bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50 hover:shadow-md transition-all">
      
      {/* Butang Trigger */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-4 flex flex-col items-center justify-center gap-2 w-full h-full text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
      >
        <div className="relative">
            <BellIcon className="w-8 h-8" />
            {count > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-[#1e293b] animate-bounce">
                    {count}
                </span>
            )}
        </div>
        <span className="text-xs font-bold">Notifikasi</span>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
            <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-full mt-2 right-0 w-80 bg-white dark:bg-[#1e293b] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden"
            >
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-[#162032] flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm">Permohonan Baru</h3>
                    <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">
                        {count} Menunggu
                    </span>
                </div>

                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                    {pendingRequests.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs italic">
                            Tiada permohonan baru.
                        </div>
                    ) : (
                        pendingRequests.map(req => (
                            <div key={req.id} className="p-3 border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 flex gap-3 cursor-default">
                                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center flex-shrink-0">
                                    <UserIcon className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-800 dark:text-white">
                                        {req.userName}
                                    </p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                        Memohon <span className="font-medium">{req.leaveType}</span>
                                    </p>
                                    <p className="text-[9px] text-slate-400 mt-1">
                                        {req.createdAt ? formatDistanceToNow(req.createdAt, { addSuffix: true, locale: ms }) : 'Baru tadi'}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}