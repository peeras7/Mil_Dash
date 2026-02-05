import React, { useEffect, useState, useCallback, useMemo } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, orderBy, doc, deleteDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Layout from "../components/Layout";
import AddUserModal from "../components/AddUserModal";
import EditUserModal from "../components/EditUserModal";
import UserLeaveReportModal from "../components/UserLeaveReportModal"; // Modal ini akan buat kiraan baki cuti
import { 
    MagnifyingGlassIcon, 
    UserPlusIcon, 
    TrashIcon, 
    PencilIcon,
    IdentificationIcon,
    BriefcaseIcon 
} from '@heroicons/react/24/outline';

export default function EmployeesPage() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Admin");
  
  // Hanya simpan data anggota, tiada data cuti di sini
  const [personnel, setPersonnel] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal States
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isReportModalOpen, setReportModalOpen] = useState(false);
  
  const [currentUserToEdit, setCurrentUserToEdit] = useState(null);
  const [currentUserForReport, setCurrentUserForReport] = useState(null);

  // Auth Check
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) navigate("/login");
      else setUserName(u.displayName || (u.email ? u.email.split("@")[0] : "Admin"));
    });
    return () => unsub();
  }, [navigate]);

  // --- FETCH DATA ANGGOTA SAHAJA (Lightweight) ---
  const fetchPersonnel = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "military_personnel"), orderBy("name"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPersonnel(data);
    } catch (error) {
      console.error("Error fetching personnel:", error);
      Swal.fire("Ralat", "Tidak dapat memuatkan data anggota.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPersonnel(); }, [fetchPersonnel]);

  // Handle Delete
  const handleDelete = async (e, user) => {
    e.stopPropagation(); 
    const result = await Swal.fire({
      title: 'Adakah anda pasti?',
      text: `Anda akan memadam ${user.name} secara kekal.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, padam!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, "military_personnel", user.id));
        Swal.fire('Dipadam!', `${user.name} telah dikeluarkan.`, 'success');
        fetchPersonnel();
      } catch (error) {
        Swal.fire("Ralat", "Gagal memadam.", "error");
      }
    }
  };

  // Modal Handlers
  const openEditModal = (e, user) => { 
      e.stopPropagation(); 
      setCurrentUserToEdit(user); 
      setEditModalOpen(true); 
  };
  
  // Apabila klik kad, buka modal ini. 
  // Modal ini yang akan buat kerja fetching & pengiraan cuti (Integration).
  const openReportModal = (user) => { 
      setCurrentUserForReport(user); 
      setReportModalOpen(true); 
  };

  // Filter Logic
  const filteredPersonnel = useMemo(() => {
      return personnel.filter((p) =>
        Object.values(p).join(" ").toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [personnel, searchQuery]);

  return (
    <>
      <Layout userName={userName}>
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                    Pengurusan <span className="text-blue-600">Anggota</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">
                    Senarai direktori dan profil anggota TUDM.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                    <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Cari nama, ID, platun..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-700 dark:text-white shadow-sm"
                    />
                </div>
                
                {/* Add Button */}
                <button
                    onClick={() => setAddModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all transform hover:scale-[1.02] active:scale-95 text-sm whitespace-nowrap"
                >
                    <UserPlusIcon className="h-5 w-5 stroke-2" />
                    Tambah Anggota
                </button>
            </div>
        </div>

        {/* --- GRID ANGGOTA (Profil Ringkas Sahaja) --- */}
        {loading ? (
            <div className="text-center py-20 text-slate-400 animate-pulse font-medium">Memuatkan data anggota...</div>
        ) : filteredPersonnel.length === 0 ? (
            <div className="text-center py-20 text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                Tiada rekod anggota dijumpai.
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 pb-10">
                {filteredPersonnel.map((p) => (
                    <div 
                        key={p.id}
                        onClick={() => openReportModal(p)}
                        className="group bg-white dark:bg-[#1e293b] p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer relative overflow-hidden"
                    >
                        {/* Hiasan Hover */}
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                        <div className="flex items-start gap-4 mb-2">
                            {/* Avatar */}
                            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center font-black text-xl text-slate-400 dark:text-slate-500 overflow-hidden shadow-inner border border-slate-100 dark:border-slate-700 uppercase group-hover:scale-105 transition-transform">
                                {p.profilePictureUrl ? ( <img src={p.profilePictureUrl} alt={p.name} className="w-full h-full object-cover" /> ) : ( p.name?.[0] || "?" )}
                            </div>
                            
                            {/* Info Peribadi */}
                            <div className="flex-1 min-w-0 pt-1">
                                <h3 className="font-bold text-lg text-slate-800 dark:text-white truncate group-hover:text-blue-600 transition-colors">
                                    {p.name || "Tanpa Nama"}
                                </h3>
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
                                    <BriefcaseIcon className="w-3.5 h-3.5" />
                                    <span className="truncate">{p.rank || "Tiada Pangkat"}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                    <IdentificationIcon className="w-3.5 h-3.5" />
                                    <span className="font-mono">{p.militaryID || "N/A"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer Kad (Platun & Actions) - TIADA BAKI CUTI DISINI */}
                        <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100 dark:border-slate-700/50">
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide truncate max-w-[120px]">
                                {p.platoon || "Platun -"}
                            </span>

                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={(e) => openEditModal(e, p)} 
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" 
                                    title="Sunting Profil"
                                >
                                    <PencilIcon className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={(e) => handleDelete(e, p)} 
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" 
                                    title="Padam Anggota"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}

      </Layout>
      
      {/* Modals */}
      {isAddModalOpen && <AddUserModal onClose={() => setAddModalOpen(false)} onUserAdded={fetchPersonnel} />}
      {isEditModalOpen && currentUserToEdit && <EditUserModal user={currentUserToEdit} onClose={() => setEditModalOpen(false)} onUserUpdated={fetchPersonnel} />}
      
      {/* INI ADALAH MODAL YANG AKAN KIRA BAKI CUTI APABILA DI-KLIK */}
      {isReportModalOpen && currentUserForReport && (
          <UserLeaveReportModal 
            user={currentUserForReport} 
            onClose={() => setReportModalOpen(false)} 
          />
      )}
    </>
  );
}