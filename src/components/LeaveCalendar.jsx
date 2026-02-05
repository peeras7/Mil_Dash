import React, { useState } from 'react';
import { 
    format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
    eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isWithinInterval, isValid 
} from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { ms } from 'date-fns/locale';

// --- DATA CUTI UMUM MALAYSIA 2026 ---
const MALAYSIA_HOLIDAYS = [
    { date: "2026-01-01", name: "Tahun Baru" },
    { date: "2026-01-14", name: "Hari Keputeraan YDPB N. Sembilan" },
    { date: "2026-01-25", name: "Thaipusam" },
    { date: "2026-02-01", name: "Hari Wilayah Persekutuan" },
    { date: "2026-02-17", name: "Tahun Baru Cina" },
    { date: "2026-02-18", name: "Tahun Baru Cina (Hari Kedua)" },
    { date: "2026-03-07", name: "Nuzul Al-Quran" },
    { date: "2026-03-21", name: "Hari Raya Aidilfitri" },
    { date: "2026-03-22", name: "Hari Raya Aidilfitri (Hari Kedua)" },
    { date: "2026-03-23", name: "Cuti Ganti Hari Raya" },
    { date: "2026-05-01", name: "Hari Pekerja" },
    { date: "2026-05-27", name: "Hari Raya Haji" },
    { date: "2026-05-31", name: "Hari Wesak" },
    { date: "2026-06-01", name: "Hari Keputeraan Agong" },
    { date: "2026-06-01", name: "Cuti Ganti Hari Wesak" },
    { date: "2026-06-17", name: "Awal Muharram" },
    { date: "2026-07-07", name: "Hari Warisan George Town" },
    { date: "2026-08-25", name: "Maulidur Rasul" },
    { date: "2026-08-31", name: "Hari Kebangsaan" },
    { date: "2026-09-16", name: "Hari Malaysia" },
    { date: "2026-11-08", name: "Deepavali" },
    { date: "2026-11-09", name: "Cuti Ganti Deepavali" },
    { date: "2026-12-11", name: "Hari Keputeraan Sultan Selangor" },
    { date: "2026-12-25", name: "Hari Krismas" }
];

export default function LeaveCalendar({ 
    leaves, onDateClick, statusCounts, activeFilter, 
    onFilterChange, searchQuery, onSearchChange 
}) {
  // Initialize with January 2026 to match data
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 0, 1));

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  
  const handleMonthChange = (e) => {
    const [year, month] = e.target.value.split('-');
    const newDate = new Date(year, month - 1, 1);
    if (isValid(newDate)) setCurrentMonth(newDate);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const filters = [
    { label: 'Semua', count: null, color: 'border-slate-300 text-slate-600' },
    { label: 'Menunggu', count: statusCounts.Pending, color: 'bg-amber-100 text-amber-800 border-amber-200' },
    { label: 'Diluluskan', count: statusCounts.Approved, color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    { label: 'Ditolak', count: statusCounts.Rejected, color: 'bg-red-100 text-red-800 border-red-200' },
  ];

  // Helper untuk Cuti
  const getHoliday = (day) => {
    const str = format(day, 'yyyy-MM-dd');
    return MALAYSIA_HOLIDAYS.find(h => h.date === str);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Bar Kawalan */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white dark:bg-[#1e293b] p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50">
        
        {/* Tab Filter */}
        <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
                <button
                    key={f.label}
                    onClick={() => onFilterChange(f.label)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        activeFilter === f.label 
                        ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-[#1e293b] ' + f.color
                        : 'border-transparent bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                >
                    {f.label}
                    {f.count !== null && (
                        <span className="ml-2 bg-white/50 px-1.5 py-0.5 rounded-md text-[10px]">
                            {f.count}
                        </span>
                    )}
                </button>
            ))}
        </div>

        {/* Carian & Navigasi */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
            <div className="relative w-full sm:w-64">
                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Cari anggota..." 
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                />
            </div>
            
            <div className="flex items-center w-full sm:w-auto bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-1">
                <button onClick={prevMonth} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 shadow-sm transition-all">
                    <ChevronLeftIcon className="w-4 h-4" />
                </button>
                
                <div className="relative mx-2">
                    <input 
                        type="month" 
                        value={format(currentMonth, 'yyyy-MM')}
                        onChange={handleMonthChange}
                        className="bg-transparent border-none text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-0 cursor-pointer p-0 w-32 text-center"
                    />
                </div>

                <button onClick={nextMonth} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 shadow-sm transition-all">
                    <ChevronRightIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
      </div>

      {/* 2. Grid Kalendar */}
      <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50 overflow-hidden flex flex-col">
        
        {/* Header Bulan */}
        <div className="p-5 text-center border-b border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-[#162032]">
            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: ms })}
            </h2>
        </div>

        {/* Header Hari */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-[#162032]">
            {['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'].map((day) => (
                <div key={day} className="py-3 text-center text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    {day}
                </div>
            ))}
        </div>

        {/* Grid Hari */}
        <div className="grid grid-cols-7 bg-slate-200 dark:bg-slate-700 gap-px border-b border-slate-200 dark:border-slate-700/50">
            {calendarDays.map((day) => {
                // Filter cuti untuk hari ini
                const dayLeaves = leaves.filter(leave => {
                    if (!leave.startDate || !leave.endDate) return false;
                    try {
                        return isWithinInterval(day, { start: leave.startDate, end: leave.endDate });
                    } catch (e) {
                        return false;
                    }
                });

                const isToday = isSameDay(day, new Date());
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const holiday = getHoliday(day); // Check if holiday

                // --- LOGIK WARNA BOX ---
                let bgClass = 'bg-white dark:bg-[#1e293b]';
                if (!isCurrentMonth) bgClass = 'bg-slate-50/50 dark:bg-[#162032]/50';
                else if (holiday) bgClass = 'bg-purple-50 dark:bg-purple-900/10'; // UNGU (PH)
                else if (isToday) bgClass = 'bg-blue-50/50 dark:bg-blue-900/10';

                return (
                    <div 
                        key={day.toString()} 
                        className={`min-h-[140px] flex flex-col transition-colors hover:bg-slate-50 dark:hover:bg-[#253045] ${bgClass}`}
                    >
                        {/* Nombor Tarikh & Cuti Indicator */}
                        <div className="p-2 flex justify-between items-start">
                            <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                                isToday 
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' 
                                : holiday
                                ? 'text-purple-600 dark:text-purple-400' // Nombor jadi Ungu jika PH
                                : !isCurrentMonth ? 'text-slate-300 dark:text-slate-600' : 'text-slate-700 dark:text-slate-300'
                            }`}>
                                {format(day, 'd')}
                            </span>
                            
                            {/* Papar Holiday Name & Count */}
                            <div className="flex flex-col items-end">
                                {holiday && (
                                    <span className="text-[9px] font-bold text-purple-700 dark:text-purple-300 text-right leading-tight max-w-[80px] truncate mb-1 bg-purple-100 dark:bg-purple-900/50 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                                        {holiday.name}
                                    </span>
                                )}
                                {dayLeaves.length > 0 && (
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{dayLeaves.length}</span>
                                )}
                            </div>
                        </div>
                        
                        {/* Senarai Cuti (Bar Berwarna Terang) */}
                        <div className="flex-1 flex flex-col gap-[2px] w-full px-1 pb-1 overflow-y-auto custom-scrollbar">
                            {dayLeaves.map((leave) => (
                                <button
                                    key={leave.id}
                                    onClick={(e) => { e.stopPropagation(); onDateClick(leave); }}
                                    className={`w-full text-left text-[10px] px-2 py-1.5 font-bold truncate rounded-md transition-all shadow-sm ${
                                        leave.status === 'Approved' 
                                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200' 
                                            : leave.status === 'Rejected'
                                            ? 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-500/20 dark:text-red-300 border border-red-200'
                                            : 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-200'
                                    }`}
                                >
                                    {leave.userName || leave.name || "Anggota"}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
}