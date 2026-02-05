import React from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ms } from 'date-fns/locale';
import { BellIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

export default function NotificationDropdown({ notifications, onClose }) {
  const navigate = useNavigate();

  const handleItemClick = () => {
      onClose();
      navigate('/requests'); // Bawa ke halaman senarai permohonan
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute right-0 mt-3 w-80 bg-white dark:bg-[#1e293b] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden"
    >
      <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-[#162032] flex justify-between items-center">
        <h3 className="font-bold text-slate-800 dark:text-white">Notifikasi</h3>
        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">
            {notifications.length} Baru
        </span>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                Tiada notifikasi baru.
            </div>
        ) : (
            notifications.map((notif) => (
                <div 
                    key={notif.id} 
                    onClick={handleItemClick}
                    className="p-4 border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer flex gap-3 transition-colors"
                >
                    <div className="mt-1">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <BellIcon className="w-4 h-4" />
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">Permohonan Baru</p>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                            <span className="font-semibold">{notif.userName}</span> memohon <span className="italic">{notif.leaveType}</span>.
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
                            {formatDistanceToNow(notif.createdAt, { addSuffix: true, locale: ms })}
                        </p>
                    </div>
                </div>
            ))
        )}
      </div>

      <div className="p-2 bg-slate-50 dark:bg-[#162032] text-center border-t border-slate-100 dark:border-slate-700">
        <button 
            onClick={handleItemClick}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700"
        >
            Lihat Semua Permohonan
        </button>
      </div>
    </motion.div>
  );
}