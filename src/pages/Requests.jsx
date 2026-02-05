import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query } from "firebase/firestore"; // Buang 'orderBy' sementara
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import LeaveRequestList from "../components/LeaveRequestList";
import QuickViewModal from "../components/QuickViewModal"; 

export default function RequestsPage() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Admin");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  // State untuk Penapis Status (Default: Semua)
  const [filterStatus, setFilterStatus] = useState("All");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) navigate("/login");
      else setUserName(u.displayName || u.email?.split("@")[0] || "Admin");
    });
    return () => unsub();
  }, [navigate]);

  useEffect(() => {
    // 1. QUERY SEMUA DATA (Tanpa 'orderBy' untuk elak index error/missing data)
    const q = query(collection(db, "leave_requests"));
    
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => {
        const docData = d.data();

        // Parse Date yang selamat
        const parseDate = (val) => {
            if (!val) return null;
            if (val.toDate) return val.toDate(); // Timestamp
            return new Date(val); // String/Number
        };

        return {
          id: d.id, 
          ...docData,
          startDate: parseDate(docData.startDate), 
          endDate: parseDate(docData.endDate),
          // Fallback tarikh lama jika createdAt tiada
          createdAt: parseDate(docData.createdAt) || new Date(0),
        };
      });

      // 2. SUSUN DI CLIENT (Terbaru di atas)
      data.sort((a, b) => b.createdAt - a.createdAt);

      setRequests(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Filter Logic
  const filteredRequests = requests.filter((req) => {
    if (filterStatus === "All") return true;
    return (req.status || "").toLowerCase() === filterStatus.toLowerCase();
  });

  const counts = {
    All: requests.length,
    Pending: requests.filter(r => (r.status || "").toLowerCase() === 'pending').length,
    Approved: requests.filter(r => (r.status || "").toLowerCase() === 'approved').length,
    Rejected: requests.filter(r => (r.status || "").toLowerCase() === 'rejected').length
  };

  const filters = [
    { id: 'All', label: 'Semua', color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
    { id: 'Pending', label: 'Menunggu', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200' },
    { id: 'Approved', label: 'Diluluskan', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200' },
    { id: 'Rejected', label: 'Ditolak', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200' },
  ];

  return (
    <>
      <Layout userName={userName}>
        {/* Header Halaman */}
        <div className="mb-6">
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
            Senarai Permohonan <span className="text-blue-600">Cuti</span>
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400 font-medium">
            Semak dan urus semua permohonan cuti anggota di sini.
          </p>
        </div>

        {/* Butang Penapis */}
        <div className="flex flex-wrap gap-3 mb-6">
            {filters.map((f) => (
                <button
                    key={f.id}
                    onClick={() => setFilterStatus(f.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                        filterStatus === f.id 
                        ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-[#0f172a] ' + f.color
                        : 'border-transparent bg-white dark:bg-[#1e293b] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm'
                    }`}
                >
                    {f.label}
                    <span className="bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-md text-xs">
                        {counts[f.id]}
                    </span>
                </button>
            ))}
        </div>

        {/* Kandungan Utama */}
        <div>
          {loading ? (
            <div className="text-center p-12 bg-white dark:bg-[#273750] rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700/50">
                <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 dark:text-slate-400 font-bold animate-pulse">Memuatkan permohonan...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
             <div className="text-center p-12 bg-white dark:bg-[#1e293b] rounded-3xl shadow-sm border border-dashed border-slate-300 dark:border-slate-700">
                <p className="text-slate-500 dark:text-slate-400 italic">Tiada permohonan dijumpai untuk status ini.</p>
             </div>
          ) : (
            /* DI SINI KITA TIDAK LETAK LIMIT, JADI IA TUNJUK SEMUA */
            <LeaveRequestList 
                requests={filteredRequests} 
                onItemClick={(request) => setSelectedRequest(request)} 
            />
          )}
        </div>
      </Layout>

      {/* Modal Lulus/Tolak */}
      {selectedRequest && (
        <QuickViewModal 
            request={selectedRequest} 
            onClose={() => setSelectedRequest(null)} 
        />
      )}
    </>
  );
}