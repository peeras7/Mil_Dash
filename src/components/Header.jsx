import React, { useState, useContext, useEffect } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase"; // Pastikan db diimport
import { collection, query, where, onSnapshot } from "firebase/firestore"; // Import Firestore
import { useNavigate } from "react-router-dom";
import NotificationDropdown from './NotificationDropdown';
import { BellIcon, ArrowRightOnRectangleIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';

export default function Header({ userName }) {
  const [bukaNotifikasi, setBukaNotifikasi] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0); // State untuk jumlah notifikasi
  const [liveNotifications, setLiveNotifications] = useState([]); // State untuk data notifikasi
  const navigate = useNavigate();
  const { theme, toggleTheme } = useContext(ThemeContext);

  // --- LIVE NOTIFICATION LISTENER ---
  useEffect(() => {
    // Pantau permohonan yang berstatus "Pending" sahaja
    const q = query(collection(db, "leave_requests"), where("status", "==", "Pending"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const notifs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Tukar timestamp ke Date object jika wujud
            createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : new Date() 
        }));
        
        // Urutkan ikut masa terkini
        notifs.sort((a, b) => b.createdAt - a.createdAt);

        setLiveNotifications(notifs);
        setUnreadCount(notifs.length);
    });

    return () => unsubscribe();
  }, []);
  // ----------------------------------

  const handleLogKeluar = async () => {
    try {
      await signOut(auth);
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Log keluar gagal:", error);
    }
  };

  return (
    <header className="flex justify-end items-center h-20 px-6 bg-white dark:bg-[#1e293b] border-b border-slate-200 dark:border-slate-700/50 flex-shrink-0 transition-colors duration-300 shadow-sm z-10">
      <div className="flex items-center space-x-4">
        
        {/* Butang Tema */}
        <button 
          onClick={toggleTheme} 
          className="p-2 bg-slate-100 dark:bg-slate-700/50 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border border-transparent dark:border-slate-600"
        >
          {theme === 'light' ? (
            <MoonIcon className="h-6 w-6 text-slate-600" />
          ) : (
            <SunIcon className="h-6 w-6 text-yellow-400" />
          )}
        </button>

        {/* Notifikasi */}
        <div className="relative">
          <button
            onClick={() => setBukaNotifikasi(!bukaNotifikasi)}
            className="relative p-2 bg-slate-100 dark:bg-slate-700/50 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 focus:outline-none border border-transparent dark:border-slate-600"
          >
            <BellIcon className="h-6 w-6 text-slate-600 dark:text-slate-300" />
            
            {/* Badge Merah (Hanya jika ada unread) */}
            {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white dark:border-[#1e293b] animate-bounce">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
          </button>
          
          {bukaNotifikasi && (
            <NotificationDropdown 
                notifications={liveNotifications} // Hantar data live
                onClose={() => setBukaNotifikasi(false)}
            />
          )}
        </div>

        {/* Profil */}
        <div className="flex items-center space-x-3 pl-4 border-l border-slate-200 dark:border-slate-700/50">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-tr from-blue-800 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md border-2 border-white dark:border-slate-600">
                {userName[0]?.toUpperCase()}
            </div>
            <span className="hidden md:block font-medium text-slate-700 dark:text-slate-200">{userName}</span>
        </div>

        {/* Log Keluar */}
        <button onClick={handleLogKeluar} className="p-2 bg-red-50 dark:bg-red-900/20 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 transition-colors" title="Log Keluar">
          <ArrowRightOnRectangleIcon className="h-6 w-6" />
        </button>
      </div>
    </header>
  );
}