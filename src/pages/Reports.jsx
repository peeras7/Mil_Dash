import React, { useEffect, useState, useMemo, useRef } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Chart from "chart.js/auto";
import Layout from "../components/Layout";
import { 
    format, 
    differenceInCalendarDays, 
    startOfYear, 
    endOfMonth, 
    eachMonthOfInterval,
    addDays,
    isWithinInterval,
    startOfDay,
    endOfDay
} from 'date-fns';
import { ms } from 'date-fns/locale';

// Icons
import { 
    ChartBarIcon, 
    PrinterIcon, 
    ArrowDownTrayIcon, 
    ShieldCheckIcon, 
    GlobeAltIcon, 
    UserGroupIcon, 
    BriefcaseIcon, 
    ExclamationTriangleIcon,
    ArrowPathIcon,
    CalendarDaysIcon,
    MapPinIcon,
    ClockIcon
} from '@heroicons/react/24/outline';

import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Swal from "sweetalert2";

// --- COMPONENT: FILE CARD ---
const FileCard = ({ title, icon, children, className = "" }) => {
    return (
        <div className={`relative bg-white dark:bg-[#1e293b] rounded-3xl rounded-tl-lg shadow-sm flex flex-col group transition-all duration-300 hover:shadow-lg ${className} print:shadow-none print:rounded-none print:border print:border-black print:bg-transparent print:mb-4`}>
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-600 via-sky-400 to-yellow-400 rounded-t-3xl opacity-90 print:hidden"></div>
            <div className="absolute inset-0 border border-slate-200 dark:border-slate-700/50 rounded-3xl rounded-tl-lg pointer-events-none group-hover:border-blue-200 dark:group-hover:border-blue-800 transition-colors print:hidden"></div>
            <div className="relative px-6 py-4 flex justify-between items-center bg-slate-50/50 dark:bg-[#162032]/50 border-b border-slate-100 dark:border-slate-700/50 rounded-t-3xl rounded-tl-lg backdrop-blur-sm print:bg-transparent print:border-b print:border-black print:px-3 print:py-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors print:hidden">
                        {icon}
                    </div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-white uppercase tracking-wider print:text-black">
                        {title}
                    </h3>
                </div>
            </div>
            <div className="relative flex-1 p-0 h-full overflow-hidden print:overflow-visible">
                {children}
            </div>
        </div>
    );
};

// --- COMPONENT: METRIC CARD ---
function AnalyticsCard({ icon, title, value, subtext, color }) {
    const borderColor = color ? color.replace('text-', 'border-') : 'border-slate-400';
    return (
        <div className={`bg-white dark:bg-[#1e293b] p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between h-full ${color ? color.replace('text-', 'border-l-4 ') : 'border-l-4 border-slate-400'} print:border print:border-black print:rounded-none print:shadow-none print:p-2`}>
            <div className="flex justify-between items-start mb-2">
                <div>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 print:text-black">{title}</p>
                    <h3 className={`text-2xl font-black tracking-tight ${color || 'text-slate-900'} dark:text-white print:text-black`}>
                        {value}
                    </h3>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 print:hidden">
                    {icon}
                </div>
            </div>
            <div className="border-t border-slate-100 dark:border-slate-700 pt-2 mt-2 print:border-black">
                <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 print:text-black truncate">
                    {subtext}
                </p>
            </div>
        </div>
    );
}

export default function Reports() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Admin");
  const [allRequests, setAllRequests] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  
  const [startDate, setStartDate] = useState(startOfYear(new Date()));
  const [endDate, setEndDate] = useState(endOfMonth(new Date()));

  // Refs
  const lineChartRef = useRef(null);
  const lineChartInstance = useRef(null);
  const rankChartRef = useRef(null);
  const rankChartInstance = useRef(null);
  const typeChartRef = useRef(null); 
  const typeChartInstance = useRef(null);
  const reportContainerRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) navigate("/login");
      else setUserName(user.displayName || user.email?.split("@")[0] || "Admin");
    });
    return () => unsub();
  }, [navigate]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const q = query(collection(db, "leave_requests"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => {
            const d = doc.data();
            return {
                id: doc.id,
                ...d,
                startDate: d.startDate?.toDate ? d.startDate.toDate() : new Date(),
                endDate: d.endDate?.toDate ? d.endDate.toDate() : new Date(),
                createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : new Date(),
                status: d.status || 'Pending',
                leaveType: d.leaveType || 'Lain-lain',
                userRank: d.userRank || 'LLP',
                userName: d.userName || 'Tanpa Nama',
                userPlatoon: d.userPlatoon || '-',
                leaveAddress: d.leaveAddress || ''
            };
        });
        data.sort((a, b) => b.createdAt - a.createdAt);
        setAllRequests(data);
      } catch (error) {
        console.error("Error fetching data:", error);
        Swal.fire("Ralat", "Gagal memuat turun data laporan.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const approvedInDate = useMemo(() => {
    return allRequests.filter(req => {
      if (req.status !== 'Approved') return false;
      const rangeStart = startOfDay(startDate).getTime();
      const rangeEnd = endOfDay(endDate).getTime();
      const reqStart = req.startDate.getTime();
      const reqEnd = req.endDate.getTime();
      return (reqStart <= rangeEnd && reqEnd >= rangeStart);
    });
  }, [allRequests, startDate, endDate]);

  // --- 🧠 CORE ANALYTICS ENGINE (CORRECTED RANK LOGIC) ---
  const analytics = useMemo(() => {
    let totalLeaveDays = 0;
    let overseasCount = 0;
    let sickLeaveCount = 0;
    let ctrCount = 0;
    
    const monthBuckets = eachMonthOfInterval({ start: startDate, end: endDate }).map(date => ({
        key: format(date, 'yyyy-MM'),
        label: format(date, 'MMM', {locale: ms}),
        total: 0,
        officer: 0,
        llp: 0,
        types: {}
    }));

    const typeTotals = {};   
    const dailyMap = {};
    const absenteeMap = {};

    // --- LOGIC 1: STRICT RANK DEFINITION ---
    // Officers: Leftenan (LT) and above.
    // LLP: Pegawai Waran (PW) and below.
    const officerPrefixes = [
        'JEN', 'JENERAL',   // Jeneral
        'KOL', 'KOLONEL',   // Kolonel
        'MEJ', 'MEJAR',     // Mejar
        'KAPT', 'KAPTEN',   // Kapten
        'BRIG',             // Brigedier
        'LT', 'LEFTENAN'    // Leftenan (covers LT KOL, LT JEN, LT, LT M)
    ];

    const getRankCategory = (rankStr) => {
        const r = (rankStr || '').toUpperCase().trim();
        // Returns true ONLY if rank STARTS with officer prefix
        // "Pegawai Waran" starts with "P", so it returns false (LLP)
        const isOfficer = officerPrefixes.some(prefix => r.startsWith(prefix));
        return isOfficer ? 'Pegawai' : 'LLP';
    };

    // --- LOGIC 2: OVERSEAS KEYWORDS ---
    const overseasKeywords = [
        'luar negara', 'overseas', 'singapore', 'singapura', 'thailand', 'siam', 
        'indonesia', 'jakarta', 'bali', 'brunei', 'vietnam', 'hanoi', 'ho chi minh',
        'myanmar', 'cambodia', 'laos', 'philip', 'manila', 'china', 'beijing', 
        'shanghai', 'hong kong', 'taiwan', 'japan', 'jepun', 'tokyo', 'osaka',
        'korea', 'seoul', 'australia', 'sydney', 'melbourne', 'perth', 'new zealand',
        'uk', 'united kingdom', 'london', 'manchester', 'europe', 'paris', 'germany',
        'usa', 'america', 'mekah', 'madinah', 'jeddah', 'saudi', 'arab', 'haji', 
        'umrah', 'turkey', 'turkiye', 'istanbul', 'qatar', 'doha', 'dubai', 'uae'
    ];

    approvedInDate.forEach(req => {
      let loopDate = new Date(req.startDate);
      const loopEnd = new Date(req.endDate);

      const typeStr = (req.leaveType || "").toLowerCase();
      const addrStr = (req.leaveAddress || "").toLowerCase();
      
      const isOverseas = overseasKeywords.some(keyword => 
          typeStr.includes(keyword) || addrStr.includes(keyword)
      );

      if (isOverseas) overseasCount++;
      if (typeStr.includes('sakit')) sickLeaveCount++; 
      if (typeStr.includes('tanpa rekod') || typeStr.includes('kursus')) ctrCount++;

      // Determine Rank Category Once per Request
      const rankCategory = getRankCategory(req.userRank);

      while (loopDate <= loopEnd) {
          if (loopDate >= startDate && loopDate <= endDate) {
              totalLeaveDays++;
              
              const monthKey = format(loopDate, 'yyyy-MM');
              const bucket = monthBuckets.find(b => b.key === monthKey);
              if (bucket) {
                  bucket.total += 1;
                  
                  // Fill Correct Bucket
                  if (rankCategory === 'Pegawai') {
                      bucket.officer += 1;
                  } else {
                      bucket.llp += 1;
                  }
                  
                  bucket.types[req.leaveType] = (bucket.types[req.leaveType] || 0) + 1;
              }

              const dateStr = format(loopDate, 'yyyy-MM-dd');
              dailyMap[dateStr] = (dailyMap[dateStr] || 0) + 1;

              typeTotals[req.leaveType] = (typeTotals[req.leaveType] || 0) + 1;
          }
          loopDate = addDays(loopDate, 1);
      }

      absenteeMap[req.userName] = {
          count: (absenteeMap[req.userName]?.count || 0) + differenceInCalendarDays(req.endDate, req.startDate) + 1,
          rank: req.userRank
      };
    });

    const peakDayEntry = Object.entries(dailyMap).sort((a,b) => b[1] - a[1])[0] || [null, 0];
    const peakDayFormatted = peakDayEntry[0] ? format(new Date(peakDayEntry[0]), 'dd/MM/yy') : '-';
    
    const topAbsentees = Object.entries(absenteeMap)
        .map(([name, data]) => ({name, ...data}))
        .sort((a,b) => b.count - a.count)
        .slice(0, 5); 

    const estimatedStrength = Math.max(50, Object.keys(absenteeMap).length * 2);
    const readiness = Math.round(((estimatedStrength - peakDayEntry[1]) / estimatedStrength) * 100);
    
    const today = new Date();
    const nextWeek = addDays(today, 7);
    const returningCount = approvedInDate.filter(req => isWithinInterval(req.endDate, { start: today, end: nextWeek })).length;
    
    const top3Types = Object.entries(typeTotals).sort((a,b) => b[1] - a[1]).slice(0, 3).map(t => t[0]);
    const recentLogs = approvedInDate.slice(0, 10);

    return {
        readiness, estimatedStrength, totalLeaveDays, overseasCount, sickLeaveCount, ctrCount, returningCount,
        peakDay: { date: peakDayFormatted, count: peakDayEntry[1] },
        monthBuckets,
        top3Types, topAbsentees, recentLogs
    };
  }, [approvedInDate, startDate, endDate]);

  // --- CHART CONFIGURATION ---
  const modernChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: false, 
      plugins: { 
          legend: { position: 'top', align: 'end', labels: { usePointStyle: true, boxWidth: 8, font: {size: 10, family: 'Inter'} } } 
      },
      scales: { 
          y: { 
              beginAtZero: true, 
              grid: { color: '#f1f5f9', borderDash: [6, 6] }, 
              ticks: { font: {size: 9}, color: '#64748b' },
              border: { display: false }
          }, 
          x: { 
              grid: { display: false }, 
              ticks: { font: {size: 9}, color: '#64748b' },
              border: { display: false }
          } 
      },
      elements: { line: { tension: 0.4, borderWidth: 2 }, point: { radius: 0, hitRadius: 30, hoverRadius: 5 } }
  };
  
  // 1. Dual Line Chart
  useEffect(() => {
    if (loading || !rankChartRef.current) return;
    if (rankChartInstance.current) rankChartInstance.current.destroy();
    
    const ctx = rankChartRef.current.getContext("2d");
    const gradientOfficer = ctx.createLinearGradient(0, 0, 0, 200);
    gradientOfficer.addColorStop(0, "rgba(30, 58, 138, 0.2)");
    gradientOfficer.addColorStop(1, "rgba(30, 58, 138, 0)");

    rankChartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
            labels: analytics.monthBuckets.map(b => b.label),
            datasets: [
                { 
                    label: 'Pegawai', 
                    data: analytics.monthBuckets.map(b => b.officer), 
                    borderColor: '#1e3a8a', 
                    backgroundColor: gradientOfficer, 
                    fill: true 
                },
                { 
                    label: 'LLP', 
                    data: analytics.monthBuckets.map(b => b.llp), 
                    borderColor: '#f59e0b', // Amber for LLP
                    backgroundColor: 'transparent', 
                    borderDash: [], 
                    fill: false 
                }
            ]
        },
        options: modernChartOptions
    });
  }, [analytics]);

  // 2. Single Area Line
  useEffect(() => {
    if (loading || !lineChartRef.current) return;
    if (lineChartInstance.current) lineChartInstance.current.destroy();

    const ctx = lineChartRef.current.getContext("2d");
    const gradientTotal = ctx.createLinearGradient(0, 0, 0, 200);
    gradientTotal.addColorStop(0, "rgba(37, 99, 235, 0.25)");
    gradientTotal.addColorStop(1, "rgba(37, 99, 235, 0)");

    lineChartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
            labels: analytics.monthBuckets.map(b => b.label),
            datasets: [{
                label: 'Jumlah Ketiadaan',
                data: analytics.monthBuckets.map(b => b.total),
                borderColor: '#2563eb',
                backgroundColor: gradientTotal,
                fill: true
            }]
        },
        options: modernChartOptions
    });
  }, [analytics]);

  // 3. Multi Line
  useEffect(() => {
    if (loading || !typeChartRef.current) return;
    if (typeChartInstance.current) typeChartInstance.current.destroy();

    const colors = ['#059669', '#d97706', '#dc2626'];
    const datasets = analytics.top3Types.map((type, index) => ({
        label: type,
        data: analytics.monthBuckets.map(b => b.types[type] || 0),
        borderColor: colors[index],
        backgroundColor: colors[index],
        fill: false
    }));

    typeChartInstance.current = new Chart(typeChartRef.current, {
        type: 'line',
        data: { labels: analytics.monthBuckets.map(b => b.label), datasets: datasets },
        options: modernChartOptions
    });
  }, [analytics]);

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    if (!reportContainerRef.current) return;
    setIsExporting(true);
    try {
        const canvas = await html2canvas(reportContainerRef.current, { scale: 2, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const ratio = Math.min(pdfWidth / canvas.width, pdf.internal.pageSize.getHeight() / canvas.height);
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width * ratio, canvas.height * ratio);
        pdf.save(`Laporan_Statistik_Markas_${format(new Date(), 'yyyyMMdd')}.pdf`);
    } catch (e) { console.error(e); } finally { setIsExporting(false); }
  };

  return (
    <Layout userName={userName}>
      {/* TOOLBAR */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 mb-8 print:hidden">
        <div>
           <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-white uppercase tracking-widest border border-slate-700">SULIT</span>
           </div>
           <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight capitalize">
             Laporan <span className="text-blue-800 dark:text-blue-500">Statistik Markas</span>
           </h1>
        </div>
        <div className="flex gap-3">
            <div className="flex bg-white dark:bg-[#1e293b] border rounded p-1 shadow-sm">
                <input type="date" value={format(startDate, 'yyyy-MM-dd')} onChange={(e) => setStartDate(new Date(e.target.value))} className="bg-transparent text-sm font-mono p-2 outline-none dark:text-white" />
                <span className="self-center text-slate-400 px-2">-</span>
                <input type="date" value={format(endDate, 'yyyy-MM-dd')} onChange={(e) => setEndDate(new Date(e.target.value))} className="bg-transparent text-sm font-mono p-2 outline-none dark:text-white" />
            </div>
            <button onClick={handlePrint} className="p-2.5 bg-white border shadow-sm rounded hover:bg-slate-50 text-slate-700"><PrinterIcon className="w-5 h-5" /></button>
            <button onClick={handleDownloadPDF} disabled={isExporting} className="p-2.5 bg-blue-800 text-white rounded hover:bg-blue-900 shadow-sm"><ArrowDownTrayIcon className="w-5 h-5" /></button>
        </div>
      </div>

      {/* --- REPORT CONTAINER --- */}
      <div id="printable-report" ref={reportContainerRef} className="bg-white dark:bg-[#1e293b] rounded-lg border border-slate-200 dark:border-slate-700 p-8 min-h-[800px] relative print:border-none print:p-0 print:w-full">
        
        {/* PRINT HEADER */}
        <div className="hidden print:flex flex-col mb-4 border-b-2 border-black pb-2 pt-2 w-full">
            <div className="flex justify-between items-start w-full">
                <div>
                    <p className="text-sm font-bold uppercase text-black tracking-wide">Markas Tentera Udara</p>
                    <p className="text-[10px] text-black">Cawangan Sumber Manusia</p>
                </div>
                <div><p className="text-[10px] font-bold border-2 border-black px-2 py-0.5 uppercase text-black">SULIT</p></div>
            </div>
            <div className="text-center mt-2">
                <h1 className="text-xl font-black capitalize text-black tracking-tight">Laporan Statistik Markas</h1>
                <p className="text-[10px] font-mono text-black uppercase">JULAT: {format(startDate, 'dd MMM yyyy', {locale: ms})} - {format(endDate, 'dd MMM yyyy', {locale: ms})}</p>
            </div>
        </div>

        {/* SECTION A: METRICS */}
        <div className="print:mb-6">
            <h3 className="text-xs font-bold uppercase text-slate-400 mb-6 flex items-center gap-2 print:text-black border-b border-slate-100 dark:border-slate-700 pb-2 tracking-widest print:border-black print:mb-2">
                <ShieldCheckIcon className="w-4 h-4"/> A. Ringkasan Eksekutif
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 print:grid-cols-4 print:gap-3 print:mb-4">
                <AnalyticsCard icon={<ShieldCheckIcon className="w-5 h-5"/>} title="1. Kesiapsiagaan" value={`${analytics.readiness}%`} subtext="Sasaran Markas: >85%" color="text-emerald-600"/>
                <AnalyticsCard icon={<UserGroupIcon className="w-5 h-5"/>} title="2. Kekuatan Semasa" value={analytics.estimatedStrength - analytics.peakDay.count} subtext={`Daripada ${analytics.estimatedStrength} Anggota`} color="text-blue-600"/>
                <AnalyticsCard icon={<ArrowPathIcon className="w-5 h-5"/>} title="3. Panggil Balik" value={`${Math.round(((analytics.estimatedStrength - analytics.overseasCount)/analytics.estimatedStrength)*100)}%`} subtext="Aset Dalam Negara" color="text-indigo-600"/>
                <AnalyticsCard icon={<GlobeAltIcon className="w-5 h-5"/>} title="4. Luar Negara" value={`${analytics.overseasCount}`} subtext="Kelulusan Khas" color="text-amber-600"/>
                <AnalyticsCard icon={<ExclamationTriangleIcon className="w-5 h-5"/>} title="5. Cuti Sakit" value={`${analytics.sickLeaveCount}`} subtext="Hari (Kumulatif)" color="text-red-600"/>
                <AnalyticsCard icon={<BriefcaseIcon className="w-5 h-5"/>} title="6. Tugas Rasmi" value={`${analytics.ctrCount}`} subtext="Kursus & Tanpa Rekod" color="text-slate-600"/>
                <AnalyticsCard icon={<CalendarDaysIcon className="w-5 h-5"/>} title="7. Unjuran Pulang" value={`${analytics.returningCount}`} subtext="Dalam 7 Hari" color="text-teal-600"/>
                <AnalyticsCard icon={<ChartBarIcon className="w-5 h-5"/>} title="8. Hari Puncak" value={analytics.peakDay.count} subtext={analytics.peakDay.date} color="text-pink-600"/>
            </div>
        </div>

        {/* SECTION B: CHARTS (FileCard Style) */}
        <div className="print:break-inside-avoid print:mb-6">
            <h3 className="text-xs font-bold uppercase text-slate-400 mb-6 flex items-center gap-2 print:text-black border-b border-slate-100 dark:border-slate-700 pb-2 tracking-widest print:border-black print:mb-2">
                <ChartBarIcon className="w-4 h-4"/> B. Analisa Trend (Visual)
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10 print:grid-cols-3 print:gap-3 print:mb-4">
                <FileCard title="9. Trend Pangkat" icon={<UserGroupIcon className="w-4 h-4"/>}>
                    <div className="p-4 h-48 print:h-32"><canvas ref={rankChartRef}></canvas></div>
                </FileCard>
                <FileCard title="10. Trend Keseluruhan" icon={<ChartBarIcon className="w-4 h-4"/>}>
                    <div className="p-4 h-48 print:h-32"><canvas ref={lineChartRef}></canvas></div>
                </FileCard>
                <FileCard title="11. Kategori Cuti" icon={<BriefcaseIcon className="w-4 h-4"/>}>
                    <div className="p-4 h-48 print:h-32"><canvas ref={typeChartRef}></canvas></div>
                </FileCard>
            </div>
        </div>

        {/* SECTION C: TOP ABSENTEES (FileCard Style) */}
        <div className="print:break-inside-avoid print:mb-6">
            <h3 className="text-xs font-bold uppercase text-slate-400 mb-6 flex items-center gap-2 print:text-black border-b border-slate-100 dark:border-slate-700 pb-2 tracking-widest print:border-black print:mb-2">
                <MapPinIcon className="w-4 h-4"/> C. Senarai Anggota Kerap Bercuti (Top 5)
            </h3>
            <FileCard title="Analisa Kekerapan Cuti" icon={<UserGroupIcon className="w-4 h-4"/>}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 print:bg-white print:border-black">
                            <tr>
                                <th className="px-6 py-4 font-bold uppercase text-slate-500 print:text-black print:px-2 print:py-1">Nama Anggota</th>
                                <th className="px-6 py-4 font-bold uppercase text-slate-500 print:text-black print:px-2 print:py-1">Pangkat</th>
                                <th className="px-6 py-4 font-bold uppercase text-slate-500 print:text-black text-center print:px-2 print:py-1">Jumlah Hari</th>
                                <th className="px-6 py-4 font-bold uppercase text-slate-500 print:text-black text-right print:px-2 print:py-1">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700 print:divide-black">
                            {analytics.topAbsentees.map((item, i) => (
                                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 print:break-inside-avoid">
                                    <td className="px-6 py-3 font-bold text-slate-700 dark:text-slate-300 print:text-black print:px-2 print:py-1">{item.name}</td>
                                    <td className="px-6 py-3 font-mono text-slate-500 dark:text-slate-400 print:text-black print:px-2 print:py-1">{item.rank || '-'}</td>
                                    <td className="px-6 py-3 text-center font-mono text-slate-700 dark:text-slate-300 print:text-black print:px-2 print:py-1">{item.count}</td>
                                    <td className="px-6 py-3 text-right print:px-2 print:py-1">
                                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold border ${item.count > 14 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-slate-600 border-slate-200'} print:border-black print:bg-transparent print:text-black`}>
                                            {item.count > 14 ? 'SEMAKAN' : 'NORMAL'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </FileCard>
        </div>

        {/* SECTION D: RECENT LOGS (PAGE BREAK BEFORE THIS) */}
        <div className="print:break-before-page">
            <h3 className="text-xs font-bold uppercase text-slate-400 mb-6 flex items-center gap-2 print:text-black border-b border-slate-100 dark:border-slate-700 pb-2 tracking-widest print:border-black print:mb-2">
                <ClockIcon className="w-4 h-4"/> D. Log Pergerakan Cuti Terkini (10 Terawal)
            </h3>
            <FileCard title="Rekod Pergerakan Semasa" icon={<ClockIcon className="w-4 h-4"/>}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 print:bg-white print:border-black">
                            <tr>
                                <th className="px-6 py-4 font-bold uppercase text-slate-500 print:text-black print:px-2 print:py-1">Nama Anggota</th>
                                <th className="px-6 py-4 font-bold uppercase text-slate-500 print:text-black print:px-2 print:py-1">Jenis Cuti</th>
                                <th className="px-6 py-4 font-bold uppercase text-slate-500 print:text-black print:px-2 print:py-1">Tarikh Mula</th>
                                <th className="px-6 py-4 font-bold uppercase text-slate-500 print:text-black text-right print:px-2 print:py-1">Tempoh</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700 print:divide-black">
                            {analytics.recentLogs.map((log, i) => (
                                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 print:break-inside-avoid">
                                    <td className="px-6 py-3 font-bold text-slate-700 dark:text-slate-300 print:text-black print:px-2 print:py-1">
                                        {log.userName} 
                                        <span className="text-[10px] font-normal text-slate-400 ml-2 print:text-black">({log.userRank})</span>
                                    </td>
                                    <td className="px-6 py-3 text-slate-600 dark:text-slate-400 print:text-black print:px-2 print:py-1">{log.leaveType}</td>
                                    <td className="px-6 py-3 font-mono text-slate-600 dark:text-slate-400 print:text-black print:px-2 print:py-1">
                                        {format(log.startDate, 'dd MMM yyyy')}
                                    </td>
                                    <td className="px-6 py-3 text-right font-mono text-slate-600 dark:text-slate-400 print:text-black print:px-2 print:py-1">
                                        {differenceInCalendarDays(log.endDate, log.startDate) + 1} Hari
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </FileCard>
        </div>

        {/* PRINT FOOTER */}
        <div className="hidden print:flex mt-6 border-t border-black pt-2 flex-row justify-between items-end">
            <div><p className="text-[8px] text-black font-mono">ID CETAKAN: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p></div>
            <div className="text-right">
                <p className="text-[8px] text-black font-bold uppercase">DIKELUARKAN OLEH: {userName}</p>
                <p className="text-[8px] text-black font-mono">{format(new Date(), 'dd MMM yyyy HH:mm').toUpperCase()}</p>
            </div>
        </div>

      </div>

      <style>{`
        @media print {
            @page { margin: 10mm; size: A4 portrait; }
            body * { visibility: hidden; }
            #printable-report, #printable-report * { visibility: visible; }
            
            #printable-report {
                position: absolute; left: 0; top: 0; width: 100%;
                margin: 0; padding: 0;
                background-color: white !important;
                color: black !important;
                border: none !important;
                box-shadow: none !important;
                transform: scale(0.95);
                transform-origin: top left;
            }

            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .print\\:hidden { display: none !important; }
            .print\\:flex { display: flex !important; }
            .print\\:grid-cols-4 { grid-template-columns: repeat(4, 1fr) !important; }
            .print\\:grid-cols-3 { grid-template-columns: repeat(3, 1fr) !important; }
            .print\\:gap-3 { gap: 0.75rem !important; }
            .print\\:mb-4 { margin-bottom: 1rem !important; }
            .print\\:mb-2 { margin-bottom: 0.5rem !important; }
            
            .print\\:text-black { color: black !important; }
            .print\\:bg-white { background-color: white !important; }
            .print\\:border-black { border-color: black !important; }
            .print\\:shadow-none { box-shadow: none !important; }
            .print\\:rounded-none { border-radius: 0 !important; }
            .print\\:bg-transparent { background-color: transparent !important; }
            .print\\:h-32 { height: 130px !important; }
            
            .print\\:px-2 { padding-left: 0.5rem !important; padding-right: 0.5rem !important; }
            .print\\:py-1 { padding-top: 0.25rem !important; padding-bottom: 0.25rem !important; }
            
            .print\\:break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
            .print\\:break-before-page { break-before: page; page-break-before: always; margin-top: 2rem !important; }
            tr { page-break-inside: avoid; }
        }
      `}</style>
    </Layout>
  );
}