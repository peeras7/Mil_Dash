import React, { useEffect, useState, useMemo } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs, doc, onSnapshot } from "firebase/firestore";
import { 
    XMarkIcon, PrinterIcon, CalendarDaysIcon, DocumentTextIcon, 
    ClockIcon, BuildingOfficeIcon 
} from "@heroicons/react/24/outline";
import { differenceInCalendarDays, format } from "date-fns";

// --- UPDATED CONFIGURATION ---
// I have changed the labels here to match exactly what is in your database.
// This ensures the calculation logic can 'find' the records.
const LEAVE_TYPES = [
    { label: "Cuti Tahunan", max: 25 },
    { label: "Cuti Sakit", max: 90 },
    { label: "Cuti Ikhsan", max: 7 },    // Changed from "Cuti Kecemasan"
    { label: "Cuti Paterniti", max: 7 }, // Changed from "Cuti Bapa"
    { label: "Cuti Bersalin", max: 98 }
];

export default function UserLeaveReportModal({ user, onClose }) {
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [leaveHistory, setLeaveHistory] = useState([]);
    
    // State for User Data
    const [liveUserData, setLiveUserData] = useState(user);

    const fileRef = useMemo(() => `TUDM/${new Date().getFullYear()}/${user.militaryID || '000'}/CUTI`, [user]);

    // 1. LIVE DATA LISTENER
    useEffect(() => {
        if (!user?.id) return;
        const userDocRef = doc(db, "military_personnel", user.id);
        const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                setLiveUserData({ id: docSnapshot.id, ...docSnapshot.data() });
            }
        });
        return () => unsubscribe();
    }, [user]);

    // 2. FETCH HISTORY
    useEffect(() => {
        if (!user?.id) return;

        const fetchHistory = async () => {
            setLoadingHistory(true);
            try {
                const q = query(
                    collection(db, "leave_requests"),
                    where("userId", "==", user.id)
                );

                const snapshot = await getDocs(q);
                
                const data = snapshot.docs.map(doc => {
                    const d = doc.data();
                    return {
                        id: doc.id,
                        ...d,
                        // Safely convert Timestamps to Dates
                        startDate: d.startDate?.toDate ? d.startDate.toDate() : new Date(d.startDate),
                        endDate: d.endDate?.toDate ? d.endDate.toDate() : new Date(d.endDate),
                        createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : new Date()
                    };
                }).sort((a, b) => b.createdAt - a.createdAt);

                setLeaveHistory(data);
            } catch (error) {
                console.error("Error fetching history:", error);
            } finally {
                setLoadingHistory(false);
            }
        };

        fetchHistory();
    }, [user]);

    // =========================================================================
    // 3. CALCULATION LOGIC
    // =========================================================================
    // Now that LEAVE_TYPES matches your DB strings ("Cuti Paterniti"), 
    // this logic will correctly count the days.
    const calculatedUsage = useMemo(() => {
        const usage = {};
        
        // Initialize all types to 0
        LEAVE_TYPES.forEach(t => usage[t.label] = 0);

        leaveHistory.forEach(req => {
            // Only count if Approved and belongs to current year
            const isCurrentYear = req.startDate.getFullYear() === new Date().getFullYear();
            
            // Check for both "Approved" and "Lulus" status
            if ((req.status === 'Approved' || req.status === 'Lulus') && isCurrentYear) {
                
                const days = differenceInCalendarDays(req.endDate, req.startDate) + 1;
                
                // If the leave type from DB (req.leaveType) matches our list
                if (usage[req.leaveType] !== undefined) {
                    usage[req.leaveType] += days;
                }
            }
        });

        return usage;
    }, [leaveHistory]);

    const handlePrint = () => window.print();
    const formatDate = (date) => { try { return format(date, 'dd/MM/yyyy'); } catch (e) { return '-'; } };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:p-0 print:bg-white print:static">
            <div className="bg-white dark:bg-[#1e293b] w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:w-full print:bg-white">
                
                {/* Header */}
                <div className="bg-slate-50 dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-700 p-6 flex justify-between items-start print:bg-white print:border-black print:pb-4">
                    <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-blue-900 text-white flex items-center justify-center font-bold text-2xl rounded-lg shadow-sm">
                            {liveUserData.name?.[0]}
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Rekod Perkhidmatan Anggota</p>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                {liveUserData.rank} {liveUserData.name}
                            </h2>
                            <div className="flex flex-wrap gap-4 mt-2 text-xs font-mono text-slate-600 dark:text-slate-400">
                                <span className="flex items-center gap-1"><BuildingOfficeIcon className="w-3.5 h-3.5" />{liveUserData.platoon || "-"}</span>
                                <span className="flex items-center gap-1"><DocumentTextIcon className="w-3.5 h-3.5" />No. Fail: {fileRef}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 print:hidden">
                        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50"><PrinterIcon className="w-4 h-4" /> Cetak</button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg"><XMarkIcon className="w-6 h-6 text-slate-500" /></button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar print:overflow-visible print:p-6">
                    
                    {/* SEKSYEN BAKI CUTI */}
                    <section className="mb-8">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase border-b-2 border-slate-200 dark:border-slate-700 pb-2 mb-4 flex items-center gap-2">
                            <CalendarDaysIcon className="w-4 h-4" /> Status Baki Cuti (Tahun Semasa)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
                            {LEAVE_TYPES.map((type) => {
                                const max = type.max;
                                const used = calculatedUsage[type.label] || 0; // Fetches calculated data
                                const currentBalance = max - used;

                                const percentageLeft = Math.round((currentBalance / max) * 100);
                                let barColor = percentageLeft < 25 ? 'bg-red-500' : percentageLeft < 50 ? 'bg-amber-500' : 'bg-blue-600';
                                
                                return (
                                    <div key={type.label} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 print:bg-white print:border-black">
                                        <div className="flex justify-between items-start mb-2 h-8">
                                            <span className="text-[10px] font-bold uppercase text-slate-500 leading-tight">{type.label}</span>
                                        </div>
                                        
                                        <div className="text-right mb-2">
                                            <span className={`text-3xl font-black ${currentBalance < 0 ? 'text-red-600' : currentBalance < 5 ? 'text-amber-500' : 'text-slate-800 dark:text-white'}`}>
                                                {currentBalance}
                                            </span>
                                            <span className="text-[10px] font-bold uppercase text-slate-400 ml-1">Baki</span>
                                        </div>

                                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2 print:border print:border-black">
                                            <div className={`h-full ${barColor} transition-all duration-500 print:bg-black`} style={{ width: `${Math.max(0, percentageLeft)}%` }}></div>
                                        </div>

                                        <div className="flex justify-between text-[9px] font-mono border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                                            <span className="text-slate-500">Layak: <b>{max}</b></span>
                                            <span className="text-red-600 font-bold">Diambil: {used}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Rekod Sejarah */}
                    <section>
                         <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase border-b-2 border-slate-200 dark:border-slate-700 pb-2 mb-4 flex items-center gap-2">
                            <ClockIcon className="w-4 h-4" /> Rekod Permohonan Cuti
                        </h3>
                        <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase text-xs">
                                    <tr>
                                        <th className="px-4 py-3">Tarikh</th>
                                        <th className="px-4 py-3">Jenis</th>
                                        <th className="px-4 py-3">Tempoh</th>
                                        <th className="px-4 py-3">Lokasi</th>
                                        <th className="px-4 py-3 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {leaveHistory.length === 0 ? (
                                        <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-400 text-xs italic">Tiada rekod dijumpai.</td></tr>
                                    ) : (
                                        leaveHistory.map((req) => {
                                            const days = req.startDate && req.endDate ? differenceInCalendarDays(req.endDate, req.startDate) + 1 : 0;
                                            return (
                                                <tr key={req.id} className="bg-white dark:bg-[#1e293b]">
                                                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{formatDate(req.createdAt)}</td>
                                                    <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200">{req.leaveType}</td>
                                                    <td className="px-4 py-3 text-xs">{days} Hari <br/><span className="text-slate-400">{formatDate(req.startDate)} - {formatDate(req.endDate)}</span></td>
                                                    <td className="px-4 py-3 text-xs max-w-[150px] truncate">{req.leaveAddress || "-"}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                                            req.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' :
                                                            req.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' : 
                                                            'bg-amber-50 text-amber-700 border-amber-200'
                                                        }`}>
                                                            {req.status === 'Approved' ? 'LULUS' : req.status === 'Rejected' ? 'DITOLAK' : 'MENUNGGU'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}