import React from 'react';
import { Activity } from 'lucide-react';

export default function MetricCard({ title, value, subtitle, icon: Icon, trend }) {
  return (
    // Ditambah: hover:shadow-blue-100 (Pastel blue hint) & transition classes
    <div className="bg-white dark:bg-[#1e293b] p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50 flex flex-col justify-between h-full transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-100/50 dark:hover:shadow-blue-900/20 group">
      
      <div className="flex justify-between items-start mb-2">
        <div className={`p-2 rounded-xl ${
            title.includes("Menunggu") ? "bg-orange-500/10 text-orange-500" :
            title.includes("Bercuti") ? "bg-blue-500/10 text-blue-500" :
            title.includes("Kelulusan") ? "bg-green-500/10 text-green-500" :
            "bg-slate-500/10 text-slate-400"
        }`}>
          {/* DIKEMASKINI: strokeWidth={2.5} untuk ikon lebih tajam (HD) */}
          {Icon ? <Icon size={20} strokeWidth={2.5} /> : <Activity size={20} strokeWidth={2.5} />}
        </div>
        {trend && (
           <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-600">
             {trend}
           </span>
        )}
      </div>

      <div>
        <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {value}
        </h3>
        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider truncate">
            {title}
        </p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium truncate">
            {subtitle}
        </p>
      </div>
    </div>
  );
}