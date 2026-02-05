import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ children, userName }) {
  return (
    <div className="flex h-screen bg-[#F4F7FE] dark:bg-[#0f172a] font-sans transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName={userName} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          {/* DIKEMASKINI: Menggunakan w-full dan padding standard (px-6 py-6) */}
          <div className="w-full px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}