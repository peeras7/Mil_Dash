import React, { useEffect, useState, useRef, useContext } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Chart from "chart.js/auto";
import Layout from "../components/Layout";
import MetricCard from "../components/MetricCard";
import LeaveRequestList from "../components/LeaveRequestList";
import NotificationList from "../components/NotificationList";
import QuickViewModal from "../components/QuickViewModal";
import LeaveMap from "../components/LeaveMap";
// KEKALKAN IMPORT ASAL YANG BERFUNGSI (+ Bell jika ada, jika tiada guna FileClock)
import { FileClock, Plane, Users, CheckCircle2, Bell } from "lucide-react";
import { ThemeContext } from "../context/ThemeContext";
import { format } from "date-fns";
import { ms } from "date-fns/locale";

// --- KOMPONEN KAD REKA BENTUK FAIL (FILE CARD) ---
const FileCard = ({ title, icon: Icon, children, action, className = "" }) => {
    return (
        <div className={`relative bg-white dark:bg-[#1e293b] rounded-3xl rounded-tl-lg shadow-sm flex flex-col group transition-all duration-300 hover:shadow-lg ${className}`}>
            
            {/* Tab Atas (Aksen Warna TUDM) */}
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-600 via-sky-400 to-yellow-400 rounded-t-3xl opacity-90"></div>
            
            {/* Sempadan Halus (Simulasi Folder) */}
            <div className="absolute inset-0 border border-slate-200 dark:border-slate-700/50 rounded-3xl rounded-tl-lg pointer-events-none group-hover:border-blue-200 dark:group-hover:border-blue-800 transition-colors"></div>

            {/* Header Folder */}
            <div className="relative px-6 py-4 flex justify-between items-center bg-slate-50/50 dark:bg-[#162032]/50 border-b border-slate-100 dark:border-slate-700/50 rounded-t-3xl rounded-tl-lg backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {/* Jika Icon wujud, papar. Jika tidak, elak error */}
                        {Icon && <Icon size={18} />}
                    </div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-white uppercase tracking-wider">
                        {title}
                    </h3>
                </div>
                {action && <div className="z-10">{action}</div>}
            </div>

            {/* Isi Kandungan */}
            <div className="relative flex-1 p-0 h-full overflow-hidden">
                {children}
            </div>
        </div>
    );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);
  const [userName, setUserName] = useState("Admin");
  const [requests, setRequests] = useState([]);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [quickViewRequest, setQuickViewRequest] = useState(null);

  // Semak Login
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) navigate("/login", { replace: true });
      else setUserName(u.displayName || u.email?.split("@")[0] || "Admin");
    });
    return () => unsub();
  }, [navigate]);

  // Dapatkan Data Live dari Firestore
  useEffect(() => {
    const q = query(
      collection(db, "leave_requests"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setRequests(
        snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          startDate: d.data().startDate?.toDate(),
          endDate: d.data().endDate?.toDate(),
          createdAt: d.data().createdAt?.toDate(),
        }))
      );
    });
    return () => unsub();
  }, []);

  // Kira-kira Metrik
  const pending = requests.filter((r) => r.status === "Pending").length;
  const onLeave = requests.filter(
    (r) =>
      r.status === "Approved" &&
      r.startDate &&
      r.endDate &&
      new Date() >= r.startDate &&
      new Date() <= r.endDate
  ).length;
  const total = requests.length;
  const approved = requests.filter((r) => r.status === "Approved").length;
  const approvalRate = total ? Math.round((approved / total) * 100) : 0;

  // Konfigurasi Carta
  useEffect(() => {
    if (!requests.length || !chartRef.current) return;
    if (chartInstance.current) chartInstance.current.destroy();

    const quarters = [0, 0, 0, 0];
    requests.forEach((r) => {
      if (r.status === "Approved" && r.startDate && r.endDate) {
        const days =
          (r.endDate.getTime() - r.startDate.getTime()) /
            (1000 * 60 * 60 * 24) +
          1;
        const qStart = Math.floor(r.startDate.getMonth() / 3);
        quarters[qStart] += days;
      }
    });

    const ctx = chartRef.current.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, "rgba(59, 130, 246, 0.4)");
    gradient.addColorStop(1, "rgba(59, 130, 246, 0.0)");

    const isDark = theme === "dark";
    const gridColor = isDark ? "#334155" : "#e2e8f0";
    const textColor = isDark ? "#94a3b8" : "#64748b";

    chartInstance.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: ["Suku 1", "Suku 2", "Suku 3", "Suku 4"],
        datasets: [
          {
            label: "Hari Cuti",
            data: quarters,
            borderColor: "#3b82f6",
            backgroundColor: gradient,
            fill: true,
            tension: 0.35,
            borderWidth: 2.5,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointBackgroundColor: "#3b82f6",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDark ? "#1e293b" : "#ffffff",
            titleColor: isDark ? "#ffffff" : "#1e293b",
            bodyColor: isDark ? "#cbd5e1" : "#475569",
            borderColor: isDark ? "#334155" : "#e2e8f0",
            borderWidth: 1,
            padding: 10,
            displayColors: false,
            callbacks: {
              label: (context) => ` ${context.raw} Hari`,
            },
          },
        },
        interaction: {
          mode: "index",
          intersect: false,
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: textColor, font: { weight: "600", size: 11 } },
          },
          y: {
            border: { display: false, dash: [4, 4] },
            grid: { color: gridColor, tickLength: 0, borderDash: [4, 4] },
            ticks: { color: textColor, font: { size: 10 }, padding: 10 },
            beginAtZero: true,
          },
        },
      },
    });
  }, [requests, theme]);

  return (
    <>
      <Layout userName={userName}>
        
        {/* --- 1. WELCOME BANNER (REKA BENTUK BARU) --- */}
        <div className="relative bg-gradient-to-r from-[#0f172a] via-[#1e3a8a] to-[#2563eb] rounded-[2rem] p-8 md:p-10 mb-8 text-white overflow-hidden shadow-xl shadow-blue-900/10">
            {/* Hiasan Latar */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none"></div>
            <div className="absolute bottom-0 left-20 w-48 h-48 bg-yellow-400/10 rounded-full blur-[60px] pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2 opacity-80">
                        <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/20 text-[10px] font-bold uppercase tracking-wider">
                            Dashboard Admin
                        </span>
                        <span className="text-xs font-medium">
                            {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: ms })}
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
                        Selamat Kembali, <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-200">{userName}</span>
                    </h1>
                    <p className="text-slate-300 max-w-lg text-sm md:text-base leading-relaxed">
                        Anda mempunyai <span className="font-bold text-white">{pending} permohonan</span> menunggu tindakan hari ini.
                    </p>
                </div>
                
                <button 
                    onClick={() => navigate('/calendar')}
                    className="flex items-center gap-2 bg-white text-blue-900 px-5 py-3 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all shadow-lg active:scale-95"
                >
                    <FileClock size={18} />
                    Lihat Takwim
                </button>
            </div>
        </div>

        {/* --- 2. GRID UTAMA --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-min">
          
          {/* BARIS 1: KPI CARDS */}
          <MetricCard title="Menunggu" value={pending} subtitle="Tindakan Segera" icon={FileClock} trend="+2%" />
          <MetricCard title="Bercuti" value={onLeave} subtitle="Kekuatan: 85%" icon={Plane} />
          <MetricCard title="Jumlah" value={total} subtitle="Tahun 2025" icon={Users} trend="+12%" />
          <MetricCard title="Kelulusan" value={`${approvalRate}%`} />

          {/* BARIS 2: NOTIFIKASI & PERMOHONAN TERKINI (SWAPPED) */}
          
          {/* 1. NOTIFIKASI */}
          <FileCard 
            title="Pusat Notifikasi" 
            icon={Bell} 
            className="md:col-span-2 min-h-[380px]"
          >
              <NotificationList requests={requests} />
          </FileCard>

          {/* 2. SENARAI PERMOHONAN (Naik ke Baris 2) */}
          <FileCard 
            title="Permohonan Terkini" 
            icon={FileClock} 
            className="md:col-span-2 min-h-[380px]"
          >
             <div className="h-full">
                <LeaveRequestList
                    requests={requests}
                    limit={5}
                    onItemClick={(r) => setQuickViewRequest(r)}
                    onViewAll={() => navigate("/requests")}
                />
             </div>
          </FileCard>

          {/* BARIS 3: CARTA & PETA (SWAPPED) */}
          
          {/* 3. CARTA ANALISIS */}
          <FileCard 
            title="Analisis Cuti" 
            icon={Users} 
            className="md:col-span-2 min-h-[380px]"
            action={
                <button className="text-[10px] font-bold text-slate-500 hover:text-blue-600 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-lg transition-colors">
                    Laporan
                </button>
            }
          >
            <div className="p-6 h-full flex flex-col">
                <div className="mb-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Prestasi pengambilan cuti suku tahunan anggota.</p>
                </div>
                <div className="flex-1 w-full min-h-[200px]">
                    <canvas ref={chartRef}></canvas>
                </div>
            </div>
          </FileCard>

          {/* 4. PETA LOKASI (Turun ke Baris 3) */}
          <FileCard 
            title="Pemetaan Lokasi" 
            icon={Plane} 
            className="md:col-span-2 min-h-[380px]"
          >
            <LeaveMap requests={requests} />
          </FileCard>

        </div>
      </Layout>

      {quickViewRequest && (
        <QuickViewModal
          request={quickViewRequest}
          onClose={() => setQuickViewRequest(null)}
        />
      )}
    </>
  );
}