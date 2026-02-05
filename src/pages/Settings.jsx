import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Swal from "sweetalert2";
import { 
    TrashIcon, 
    UserCircleIcon, 
    ShieldCheckIcon, 
    CalendarDaysIcon, 
    KeyIcon, 
    IdentificationIcon,
    EnvelopeIcon,
    ClockIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ms } from 'date-fns/locale'; // Import Locale Melayu

export default function Settings() {
    const navigate = useNavigate();
    const [userName, setUserName] = useState("Admin");
    const [activeTab, setActiveTab] = useState('Akaun');

    // State
    const [profile, setProfile] = useState({ displayName: "", email: "", uid: "", createdAt: "" });
    const [passwordFields, setPasswordFields] = useState({ currentPassword: '', newPassword: '' });
    const [blackoutPeriods, setBlackoutPeriods] = useState([]);
    const [newBlackout, setNewBlackout] = useState({ startDate: '', endDate: '', reason: '' });
    const [loading, setLoading] = useState(false);

    // === SEMAK AUTH & DATA ===
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserName(user.displayName || (user.email ? user.email.split("@")[0] : "Admin"));
                setProfile({
                    displayName: user.displayName || "",
                    email: user.email || "",
                    uid: user.uid,
                    createdAt: user.metadata.creationTime ? format(new Date(user.metadata.creationTime), 'dd MMM yyyy', { locale: ms }) : 'N/A'
                });
            } else {
                navigate("/login");
            }
        });
        return () => unsub();
    }, [navigate]);

    // === DAPATKAN TARIKH TUTUP (BLACKOUT) ===
    useEffect(() => {
        const q = query(collection(db, "blackout_periods"), orderBy("startDate", "desc"));
        const unsub = onSnapshot(q, (snapshot) => {
            setBlackoutPeriods(snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                startDate: doc.data().startDate?.toDate(),
                endDate: doc.data().endDate?.toDate(),
            })));
        });
        return () => unsub();
    }, []);

    // === PENGENDALI FUNGSI (HANDLERS) ===

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.displayName !== profile.displayName) {
            try {
                await updateProfile(currentUser, { displayName: profile.displayName });
                Swal.fire({
                    title: "Berjaya",
                    text: "Nama paparan telah dikemaskini.",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false
                });
                setUserName(profile.displayName);
            } catch (error) {
                Swal.fire("Ralat", "Gagal mengemaskini profil.", "error");
            }
        }
        setLoading(false);
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { currentPassword, newPassword } = passwordFields;
        const user = auth.currentUser;
        
        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            
            Swal.fire("Berjaya", "Kata laluan telah ditukar.", "success");
            setPasswordFields({ currentPassword: '', newPassword: '' });
        } catch (error) {
            console.error(error);
            Swal.fire("Ralat", "Gagal menukar kata laluan. Sila semak kata laluan semasa anda.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleAddBlackout = async (e) => {
        e.preventDefault();
        if(!newBlackout.startDate || !newBlackout.endDate || !newBlackout.reason) {
            Swal.fire("Amaran", "Sila isi semua maklumat.", "warning");
            return;
        }

        setLoading(true);
        try {
            await addDoc(collection(db, "blackout_periods"), {
                reason: newBlackout.reason,
                startDate: new Date(newBlackout.startDate),
                endDate: new Date(newBlackout.endDate),
                createdAt: serverTimestamp()
            });
            setNewBlackout({ startDate: '', endDate: '', reason: '' });
            Swal.fire({ icon: 'success', title: 'Ditambah', text: 'Tarikh tutup berjaya ditambah.', timer: 1500, showConfirmButton: false });
        } catch (error) {
            console.error(error);
            Swal.fire("Ralat", "Gagal menambah rekod.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBlackout = async (id) => {
        const result = await Swal.fire({
            title: 'Adakah anda pasti?',
            text: "Sekatan tarikh ini akan dipadam.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, padam!',
            cancelButtonText: 'Batal'
        });

        if (result.isConfirmed) {
            try {
                await deleteDoc(doc(db, "blackout_periods", id));
                Swal.fire('Dipadam!', 'Rekod telah dipadam.', 'success');
            } catch (error) {
                Swal.fire('Ralat', 'Gagal memadam.', 'error');
            }
        }
    };

    const TABS = [
        { name: 'Akaun', icon: UserCircleIcon },
        { name: 'Keselamatan', icon: ShieldCheckIcon },
        { name: 'Tarikh Tutup', icon: CalendarDaysIcon }
    ];

    return (
        <Layout userName={userName}>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                    Tetapan <span className="text-blue-600">Sistem</span>
                </h1>
                <p className="mt-1 text-slate-600 dark:text-slate-400 font-medium">
                    Urus pilihan akaun dan konfigurasi aplikasi.
                </p>
            </div>

            {/* Tab Navigasi */}
            <div className="flex flex-wrap gap-2 mb-8 bg-slate-100 dark:bg-[#1e293b] p-1.5 rounded-2xl w-fit">
                {TABS.map((tab) => (
                    <button
                        key={tab.name}
                        onClick={() => setActiveTab(tab.name)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                            activeTab === tab.name
                                ? 'bg-white dark:bg-blue-600 text-slate-800 dark:text-white shadow-md'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                    >
                        <tab.icon className="w-5 h-5" />
                        {tab.name}
                    </button>
                ))}
            </div>

            {/* Kandungan Tab */}
            <div className="max-w-4xl">
                
                {/* === TAB AKAUN === */}
                {activeTab === 'Akaun' && (
                    <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700/50">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Maklumat Profil</h3>
                        
                        <form onSubmit={handleProfileUpdate} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Medan Baca Sahaja */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Alamat E-mel</label>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                                        <EnvelopeIcon className="w-5 h-5 text-slate-400" />
                                        <span className="text-slate-600 dark:text-slate-300 font-medium text-sm">{profile.email}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ID Pengguna</label>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                                        <IdentificationIcon className="w-5 h-5 text-slate-400" />
                                        <span className="text-slate-600 dark:text-slate-300 font-medium text-sm truncate">{profile.uid}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Akaun Dicipta</label>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                                        <ClockIcon className="w-5 h-5 text-slate-400" />
                                        <span className="text-slate-600 dark:text-slate-300 font-medium text-sm">{profile.createdAt}</span>
                                    </div>
                                </div>

                                {/* Medan Boleh Edit */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nama Paparan</label>
                                    <div className="relative">
                                        <UserCircleIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type="text" 
                                            value={profile.displayName} 
                                            onChange={(e) => setProfile({...profile, displayName: e.target.value})} 
                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all transform hover:scale-[1.02] disabled:opacity-50"
                                >
                                    {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* === TAB KESELAMATAN === */}
                {activeTab === 'Keselamatan' && (
                    <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700/50">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                                <KeyIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Tukar Kata Laluan</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Pastikan akaun anda dilindungi dengan kata laluan yang kukuh.</p>
                            </div>
                        </div>

                        <form onSubmit={handlePasswordUpdate} className="space-y-5 max-w-lg">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Kata Laluan Semasa</label>
                                <input 
                                    type="password" 
                                    value={passwordFields.currentPassword} 
                                    onChange={(e) => setPasswordFields({...passwordFields, currentPassword: e.target.value})} 
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                                    required 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Kata Laluan Baru</label>
                                <input 
                                    type="password" 
                                    value={passwordFields.newPassword} 
                                    onChange={(e) => setPasswordFields({...passwordFields, newPassword: e.target.value})} 
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                                    required 
                                />
                            </div>
                            
                            <div className="pt-2">
                                <button 
                                    type="submit" 
                                    disabled={loading} 
                                    className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Mengemaskini...' : 'Kemaskini Kata Laluan'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* === TAB TARIKH TUTUP (BLACKOUT) === */}
                {activeTab === 'Tarikh Tutup' && (
                    <div className="space-y-6">
                        {/* Borang Tambah */}
                        <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700/50">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Tambah Sekatan Tarikh</h3>
                            <form onSubmit={handleAddBlackout} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Sebab / Alasan</label>
                                    <input 
                                        type="text" 
                                        placeholder="cth: Latihan Perang"
                                        value={newBlackout.reason} 
                                        onChange={e => setNewBlackout({...newBlackout, reason: e.target.value})} 
                                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white text-sm" 
                                        required 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Tarikh Mula</label>
                                    <input 
                                        type="date" 
                                        value={newBlackout.startDate} 
                                        onChange={e => setNewBlackout({...newBlackout, startDate: e.target.value})} 
                                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white text-sm" 
                                        required 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Tarikh Tamat</label>
                                    <input 
                                        type="date" 
                                        value={newBlackout.endDate} 
                                        onChange={e => setNewBlackout({...newBlackout, endDate: e.target.value})} 
                                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white text-sm" 
                                        required 
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all text-sm h-[42px]"
                                >
                                    Tambah
                                </button>
                            </form>
                        </div>

                        {/* Senarai */}
                        <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700/50">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Senarai Tarikh Tutup Aktif</h3>
                            <div className="space-y-3">
                                {blackoutPeriods.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500 dark:text-slate-400 italic">
                                        Tiada tarikh tutup ditetapkan.
                                    </div>
                                ) : (
                                    blackoutPeriods.map((period) => (
                                        <div key={period.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl">
                                                    <CalendarDaysIcon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 dark:text-white">{period.reason}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                                                        {period.startDate ? format(period.startDate, 'dd MMM yyyy') : '-'}  
                                                        <span className="mx-2 text-slate-300">➜</span> 
                                                        {period.endDate ? format(period.endDate, 'dd MMM yyyy') : '-'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleDeleteBlackout(period.id)} 
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                                                title="Padam"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </Layout>
    );
}