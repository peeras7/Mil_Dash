import React from "react";
import { format } from "date-fns";
import { PencilSquareIcon } from "@heroicons/react/24/outline";

// Tambah prop 'limit' (default null = tunjuk semua)
export default function LeaveRequestList({ requests, onItemClick, onViewAll, limit = null }) {
  
  // --- LOGIK SLICING (DASHBOARD SAHAJA) ---
  const displayRequests = limit ? requests.slice(0, limit) : requests;

  // UI Colors (Gaya Bold/Boxy)
  const getRowColor = (status) => {
    switch (status) {
        case 'Approved': return 'bg-green-50/80 hover:bg-green-100 dark:bg-green-900/10 border-green-100/50 dark:border-green-800/30';
        case 'Rejected': return 'bg-red-50/80 hover:bg-red-100 dark:bg-red-900/10 border-red-100/50 dark:border-red-800/30';
        case 'Cancelled': return 'bg-slate-50/80 hover:bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'; // <--- NEW COLOR
        default: return 'bg-yellow-50/80 hover:bg-yellow-100 dark:bg-yellow-900/10 border-yellow-100/50 dark:border-yellow-800/30';
    }
  };

  return (
    <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50 flex flex-col h-full overflow-hidden transition-all duration-300 hover:scale-[1.002] hover:shadow-md hover:shadow-blue-100/50 dark:hover:shadow-blue-900/20">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/50 dark:bg-[#162032]">
        <div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-white">
                {limit ? "Permohonan Terkini" : "Senarai Penuh Permohonan"}
            </h3>
        </div>
        {onViewAll && limit && (
            <button 
                onClick={onViewAll}
                className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-lg hover:bg-blue-100 transition-colors"
            >
                Lihat Semua
            </button>
        )}
      </div>
      
      {/* Table Body */}
      <div className="p-3 overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-separate border-spacing-y-2">
            <thead className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold">
                <tr>
                    <th className="px-3 pb-1">Anggota</th>
                    <th className="px-3 pb-1">Jenis</th>
                    <th className="px-3 pb-1">Tarikh</th>
                    <th className="px-3 pb-1 text-center">Status</th>
                    <th className="px-3 pb-1 text-center">Tindakan</th>
                </tr>
            </thead>
            <tbody>
                {displayRequests.length === 0 ? (
                    <tr><td colSpan="5" className="p-8 text-center text-xs text-slate-500 italic">Tiada permohonan dijumpai.</td></tr>
                ) : (
                    displayRequests.map((req) => (
                        <tr 
                            key={req.id} 
                            onClick={() => onItemClick(req)}
                            className={`transition-all cursor-pointer rounded-xl shadow-sm border ${getRowColor(req.status)} group`}
                        >
                            {/* 1. Anggota */}
                            <td className="px-3 py-2 rounded-l-xl">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-white/60 dark:bg-black/20 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-xs shadow-sm backdrop-blur-sm group-hover:scale-105 transition-transform">
                                        {req.userName?.[0]}
                                    </div>
                                    <div className="min-w-0 max-w-[120px]">
                                        <p className="font-bold text-slate-800 dark:text-white text-xs truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {req.userName}
                                        </p>
                                        <p className="text-[10px] text-slate-600 dark:text-slate-300 opacity-80 truncate">
                                            {req.userRank || 'Anggota'}
                                        </p>
                                    </div>
                                </div>
                            </td>

                            {/* 2. Jenis */}
                            <td className="px-3 py-2">
                                <span className="font-bold text-slate-700 dark:text-slate-200 text-xs truncate block max-w-[100px]">
                                    {req.leaveType}
                                </span>
                            </td>

                            {/* 3. Tarikh */}
                            <td className="px-3 py-2">
                                <span className="text-[10px] text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                                    {(() => {
                                        try {
                                            const d = req.startDate?.seconds ? req.startDate.toDate() : new Date(req.startDate);
                                            return !isNaN(d) ? format(d, 'dd/MM') : '-';
                                        } catch (e) { return '-'; }
                                    })()}
                                </span>
                            </td>

                            {/* 4. Status Badge (UPDATED) */}
                            <td className="px-3 py-2 text-center">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider shadow-sm ${
                                    req.status === 'Approved' ? 'bg-white/70 text-green-700 dark:bg-black/40 dark:text-green-400' :
                                    req.status === 'Rejected' ? 'bg-white/70 text-red-700 dark:bg-black/40 dark:text-red-400' :
                                    req.status === 'Cancelled' ? 'bg-white/70 text-slate-600 dark:bg-black/40 dark:text-slate-400' : // <--- NEW STYLE
                                    'bg-white/70 text-yellow-700 dark:bg-black/40 dark:text-yellow-400'
                                }`}>
                                    {
                                        req.status === 'Approved' ? 'Lulus' : 
                                        req.status === 'Rejected' ? 'Ditolak' : 
                                        req.status === 'Cancelled' ? 'Dibatalkan' : 
                                        'Menunggu'
                                    }
                                </span>
                            </td>

                            {/* 5. Tindakan */}
                            <td className="px-3 py-2 text-center rounded-r-xl">
                                <button 
                                    className="p-1.5 bg-white/60 dark:bg-black/20 rounded-lg hover:bg-blue-500 hover:text-white dark:hover:bg-blue-500 dark:hover:text-white transition-all text-slate-600 dark:text-slate-300 shadow-sm backdrop-blur-sm"
                                    onClick={(e) => { e.stopPropagation(); onItemClick(req); }}
                                >
                                    <PencilSquareIcon className="w-4 h-4" strokeWidth={2} />
                                </button>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
}