import React, { useState } from 'react';
import { 
    BellIcon, 
    ServerStackIcon, 
    UserIcon,
    ExclamationTriangleIcon,
    ArrowRightIcon,
    ChevronUpIcon,
    ChevronDownIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { ms } from 'date-fns/locale';

export default function NotificationList({ requests = [] }) {
  // State untuk mengawal dropdown (Tunjuk semua atau terhad)
  const [showAll, setShowAll] = useState(false);
  
  // 1. DATA STATIK (Sistem / Senggaraan)
  const systemNotifications = [
    {
        id: 'sys-1',
        type: 'maintenance',
        title: 'Senggaraan Berjadual',
        message: 'Sistem akan ditutup sementara pada 25 Dis, 2300H.',
        time: 'Akan Datang',
        urgent: true
    },
    {
        id: 'sys-2',
        type: 'update',
        title: 'Kemaskini Sistem v2.4',
        message: 'Modul laporan baru kini tersedia.',
        time: '2 hari lepas',
        urgent: false
    }
  ];

  // 2. DATA LIVE (Dari Permohonan Cuti)
  const liveNotifications = requests.map(req => ({
    id: req.id,
    type: 'request',
    title: 'Permohonan Baru',
    message: `${req.userName} memohon ${req.leaveType}.`,
    time: req.createdAt ? formatDistanceToNow(req.createdAt, { addSuffix: true, locale: ms }) : 'Baru sebentar',
    urgent: false,
  }));

  // Gabungkan: Maintenance > Live > Update
  const allNotifications = [
    ...systemNotifications.filter(n => n.urgent), 
    ...liveNotifications,
    ...systemNotifications.filter(n => !n.urgent)
  ];

  // LOGIK PAPARAN: Jika showAll true, tunjuk semua. Jika false, tunjuk 4 sahaja.
  const visibleNotifications = showAll ? allNotifications : allNotifications.slice(0, 4);

  // Ikon Helper
  const getIcon = (type) => {
    switch (type) {
        case 'maintenance': return <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
        case 'update': return <ServerStackIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
        case 'request': return <UserIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
        default: return <BellIcon className="w-5 h-5 text-slate-500" />;
    }
  };

  const getIconBg = (type) => {
    switch (type) {
        case 'maintenance': return 'bg-amber-100 dark:bg-amber-900/20';
        case 'update': return 'bg-blue-100 dark:bg-blue-900/20';
        case 'request': return 'bg-emerald-100 dark:bg-emerald-900/20';
        default: return 'bg-slate-100 dark:bg-slate-800';
    }
  };

  return (
    <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50 flex flex-col h-full overflow-hidden transition-all hover:shadow-md">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/50 dark:bg-[#162032]">
        <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
            <BellIcon className="w-4 h-4 text-blue-500" />
            Pusat Notifikasi
        </h3>
        <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold">
            Live: {allNotifications.length}
        </span>
      </div>

      {/* Senarai (Boleh Scroll) */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto custom-scrollbar transition-all duration-300">
        {visibleNotifications.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-slate-400 text-xs italic">
                Tiada notifikasi baru.
            </div>
        ) : (
            visibleNotifications.map((notif, idx) => (
                <div 
                    key={notif.id || idx} 
                    className={`p-3 rounded-xl flex gap-4 transition-colors items-start animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                        notif.type === 'maintenance' 
                        ? 'bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30' 
                        : 'bg-white dark:bg-slate-800/20 hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent'
                    }`}
                >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${getIconBg(notif.type)}`}>
                        {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                            <p className={`text-sm font-bold truncate ${notif.type === 'maintenance' ? 'text-amber-700 dark:text-amber-400' : 'text-slate-800 dark:text-white'}`}>
                                {notif.title}
                            </p>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2 bg-slate-100 dark:bg-slate-700/50 px-1.5 py-0.5 rounded">
                                {notif.time}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                            {notif.message}
                        </p>
                    </div>
                </div>
            ))
        )}
      </div>

      {/* Footer: Butang Dropdown (Hanya jika ada lebih dari 4 notifikasi) */}
      {allNotifications.length > 4 && (
          <div className="p-3 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-[#162032]">
            <button 
                onClick={() => setShowAll(!showAll)} 
                className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
            >
                {showAll ? (
                    <>
                        Tutup Senarai
                        <ChevronUpIcon className="w-3 h-3" />
                    </>
                ) : (
                    <>
                        Lihat Semua Notifikasi
                        <ChevronDownIcon className="w-3 h-3" />
                    </>
                )}
            </button>
          </div>
      )}
    </div>
  );
}