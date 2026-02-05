import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: "ri-dashboard-line", label: "Papan Pemuka", path: "/dashboard" },
    { icon: "ri-group-line", label: "Anggota", path: "/view-employees" },
    { icon: "ri-calendar-event-line", label: "Kalendar", path: "/calendar" },
    { icon: "ri-file-list-3-line", label: "Permohonan", path: "/requests" },
    { icon: "ri-bar-chart-2-line", label: "Laporan", path: "/reports" },
    { icon: "ri-shield-check-line", label: "Jejak Audit", path: "/audit-logs" },
    { icon: "ri-settings-3-line", label: "Tetapan", path: "/settings" },
  ];

  return (
    // Background: #1e293b (Slate 800)
    <aside className="hidden md:flex w-64 flex-shrink-0 bg-white dark:bg-[#1e293b] border-r border-slate-200 dark:border-slate-700/50 flex-col transition-colors duration-300 shadow-xl z-20">
      <div className="flex items-center justify-center h-20 border-b border-slate-200 dark:border-slate-700/50 flex-shrink-0">
        <a className="flex items-center cursor-pointer" onClick={() => navigate("/dashboard")}>
          <img src="/assets/tudm.png" alt="TUDM" className="h-10 w-auto drop-shadow-md" />
          <span className="ml-3 text-xl font-bold text-slate-800 dark:text-white tracking-wide">MilLeave</span>
        </a>
      </div>
      <nav className="mt-6 flex-1 px-3 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.label}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 group relative overflow-hidden
            ${location.pathname === item.path 
              ? "bg-blue-700 text-white shadow-lg shadow-blue-900/50" // Active: TUDM Blue
              : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-blue-700 dark:hover:text-white font-medium"
            }`}
            onClick={() => navigate(item.path)}
          >
            <i className={`${item.icon} text-xl relative z-10`}></i>
            <span className="ml-4 relative z-10">{item.label}</span>
          </button>
        ))}
      </nav>
      
      {/* Footer Sidebar */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700/50">
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-lg p-3 text-center shadow-lg">
            <p className="text-xs text-blue-100 font-semibold">Markas Tentera Udara</p>
            <p className="text-[10px] text-blue-200/70 mt-1">Sistem Pengurusan Cuti v1.0</p>
        </div>
      </div>
    </aside>
  );
}