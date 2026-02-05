import React, { useEffect, useState, useMemo } from "react";
import { db, auth } from "../firebase"; // ✅ Consolidated import (auth is here)
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import Layout from "../components/Layout";
import { 
    ClipboardDocumentListIcon, 
    MagnifyingGlassIcon, 
    ArrowDownTrayIcon,
    FunnelIcon 
} from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';
// Removed duplicate 'auth' import here
// Removed unused 'logAudit' import

export default function AuditLogs() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Admin");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [logLimit, setLogLimit] = useState(100);

  // 1. Auth Guard
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) navigate("/login");
      else setUserName(u.displayName || (u.email ? u.email.split("@")[0] : "Admin"));
    });
    return () => unsub();
  }, [navigate]);

  // 2. FETCH LOGS (Real-time Listener)
  useEffect(() => {
    setLoading(true);
    
    const q = query(
        collection(db, "audit_logs"), 
        orderBy("timestamp", "desc"), 
        limit(logLimit)
    );

    const unsub = onSnapshot(q, 
      (snapshot) => {
        const data = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
              id: doc.id,
              ...d,
              timestamp: d.timestamp?.toDate ? d.timestamp.toDate() : new Date()
          };
        });
        setLogs(data);
        setLoading(false);
      },
      (error) => {
        console.error("FIREBASE ERROR:", error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [logLimit]);

  // 3. Filter Logic (Memoized)
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
        const term = searchQuery.toLowerCase();
        const action = (log.action || "").toString().toLowerCase();
        const performedBy = (log.performedBy || "").toString().toLowerCase();
        const details = (log.details || "").toString().toLowerCase();
        
        return action.includes(term) || performedBy.includes(term) || details.includes(term);
    });
  }, [logs, searchQuery]);

  // 4. Export to Excel
  const handleExport = () => {
    const dataToExport = filteredLogs.map(log => ({
        Masa: format(log.timestamp, 'dd/MM/yyyy HH:mm:ss'),
        Tindakan: log.action,
        'Dilakukan Oleh': log.performedBy,
        Butiran: log.details
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Audit Logs");
    XLSX.writeFile(wb, `Audit_Log_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
  };

  const getActionColor = (action) => {
      const act = (action || "").toString().toLowerCase();
      if (act.includes("login") || act.includes("masuk")) return "bg-blue-50 text-blue-700 border-blue-200";
      if (act.includes("lulus") || act.includes("approved")) return "bg-green-50 text-green-700 border-green-200";
      if (act.includes("tolak") || act.includes("rejected")) return "bg-red-50 text-red-700 border-red-200";
      if (act.includes("kemaskini") || act.includes("update")) return "bg-amber-50 text-amber-700 border-amber-200";
      return "bg-slate-50 text-slate-700 border-slate-200";
  };

  return (
    <Layout userName={userName}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                Jejak <span className="text-blue-600">Audit</span>
            </h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400 font-medium">
                Log keselamatan dan rekod aktiviti sistem.
            </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
                <input
                    type="text"
                    placeholder="Cari ID, Nama, Tindakan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white shadow-sm"
                />
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-xl shadow-lg shadow-blue-900/20 transition-all font-bold text-sm"
            >
                <ArrowDownTrayIcon className="w-4 h-4" />
                Eksport CSV
            </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700/50 flex flex-col overflow-hidden min-h-[500px]">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/50 dark:bg-[#162032]/50">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm text-blue-600">
                    <ClipboardDocumentListIcon className="w-5 h-5"/>
                </div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-white uppercase tracking-wider">
                    Senarai Log ({filteredLogs.length})
                </h3>
            </div>
            <select 
                value={logLimit} 
                onChange={(e) => setLogLimit(Number(e.target.value))}
                className="text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500 text-slate-600 dark:text-slate-300"
            >
                <option value={50}>50 Terkini</option>
                <option value={100}>100 Terkini</option>
                <option value={500}>500 Terkini</option>
            </select>
        </div>

        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-[#162032] border-b border-slate-200 dark:border-slate-700/50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider w-40">Masa</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider w-48">Jenis Tindakan</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider w-48">Pengguna</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Keterangan Aktiviti</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                        <td className="px-6 py-4"><div className="h-6 bg-slate-200 rounded w-20"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-32"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-full"></div></td>
                    </tr>
                ))
              ) : filteredLogs.length === 0 ? (
                <tr>
                    <td colSpan="4" className="text-center py-20 text-slate-400 dark:text-slate-500">
                        <FunnelIcon className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        <p className="text-sm font-medium">Tiada rekod dijumpai.</p>
                        <p className="text-xs mt-2 opacity-50">Cuba tukar kata kunci atau tambah had paparan.</p>
                    </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                            <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-200">
                                {log.timestamp ? format(log.timestamp, 'HH:mm:ss') : '-'}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wide">
                                {log.timestamp ? format(log.timestamp, 'dd MMM yyyy') : '-'}
                            </span>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wide border ${getActionColor(log.action)}`}>
                            {log.action || "N/A"}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-xs font-black text-slate-600 dark:text-slate-300 uppercase shadow-sm">
                                {log.performedBy?.[0] || "?"}
                            </div>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                {log.performedBy || "Tidak Diketahui"}
                            </span>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
                            {log.details || "-"}
                        </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}