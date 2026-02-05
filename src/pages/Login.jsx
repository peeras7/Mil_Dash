import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Bell, ShieldCheck, AlertCircle, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth"; // Added sendPasswordResetEmail
import { auth } from "../firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false); // State for success message
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResetSent(false);

    if (!email || !password) {
      setShake(true);
      setError("Sila lengkapkan e-mel dan kata laluan.");
      setTimeout(() => setShake(false), 500);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err) {
      setShake(true);
      setError("Maklumat tidak sah. Sila semak e-mel atau kata laluan anda.");
      setTimeout(() => setShake(false), 500);
    }
  };

  // --- LOGIC FORGOT PASSWORD ---
  const handleResetPassword = async () => {
    setError("");
    setResetSent(false);

    if (!email) {
      setShake(true);
      setError("Sila masukkan alamat e-mel anda di atas untuk set semula kata laluan.");
      setTimeout(() => setShake(false), 500);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (err) {
      setShake(true);
      if (err.code === 'auth/user-not-found') {
        setError("E-mel ini tidak berdaftar dalam sistem.");
      } else if (err.code === 'auth/invalid-email') {
        setError("Format e-mel tidak sah.");
      } else {
        setError("Gagal menghantar e-mel. Sila cuba lagi.");
      }
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    // Main Background: Dark Blue base
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      
      {/* Subtle Background Glows - TUDM Colors */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        {/* Light Blue Glow Top Left */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[120px]"></div>
        {/* Yellow Glow Bottom Right */}
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-yellow-500/5 rounded-full blur-[120px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 bg-white rounded-[2rem] shadow-2xl flex w-full max-w-[1200px] overflow-hidden min-h-[700px]"
      >
        
        {/* LEFT SIDE - Form */}
        <div className="w-full lg:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center relative">
          
          {/* Logo Header */}
          <div className="absolute top-8 left-8 md:left-12 flex items-center gap-3">
             <div className="w-10 h-10 bg-sky-50 rounded-full flex items-center justify-center shadow-sm border border-sky-100">
                <img src="/assets/tudm.png" alt="Logo" className="w-6 h-auto" />
             </div>
             <span className="font-bold text-xl text-slate-800">MilLeave.</span>
          </div>

          <div className="mt-12 max-w-md w-full mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">Portal Pentadbir</h1>
              {/* TUDM Accent Line Gradient */}
              <div className="h-1 w-24 bg-gradient-to-r from-yellow-400 to-sky-500 rounded-full mb-4"></div>
              <p className="text-slate-500">Sila log masuk untuk mengakses sistem pengurusan.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              <AnimatePresence>
                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-red-50 border border-red-100 text-red-600 text-sm p-4 rounded-xl flex items-center gap-3 shadow-sm"
                  >
                    <AlertCircle size={20} className="flex-shrink-0 text-red-500" />
                    <span className="font-medium">{error}</span>
                  </motion.div>
                )}

                {/* Success Message (Password Reset) */}
                {resetSent && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-green-50 border border-green-100 text-green-700 text-sm p-4 rounded-xl flex items-center gap-3 shadow-sm"
                  >
                    <CheckCircle size={20} className="flex-shrink-0 text-green-600" />
                    <span className="font-medium">Pautan set semula kata laluan telah dihantar ke e-mel anda.</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div animate={shake ? { x: [-5, 5, -5, 5, 0] } : {}}>
                <div className="space-y-4">
                    {/* Input E-mel */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1 ml-1">E-mel Tentera</label>
                        <input
                        type="email"
                        placeholder="nama@mil.my"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full px-6 py-4 rounded-xl bg-slate-50 border text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent transition-all duration-200 placeholder:text-slate-400 ${error ? "border-red-300 ring-red-100" : "border-slate-200"}`}
                        />
                    </div>

                    {/* Input Kata Laluan */}
                      <div className="relative">
                        <label className="block text-sm font-medium text-slate-700 mb-1 ml-1">Kata Laluan</label>
                        <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full px-6 py-4 rounded-xl bg-slate-50 border text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent transition-all duration-200 placeholder:text-slate-400 ${error ? "border-red-300 ring-red-100" : "border-slate-200"}`}
                        />
                        <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-5 top-[3.2rem] -translate-y-1/2 text-slate-400 hover:text-sky-700 transition-colors"
                        >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                </div>

                <div className="flex justify-end mt-3">
                    <button 
                        type="button"
                        onClick={handleResetPassword}
                        className="text-sm font-medium text-sky-700 hover:text-sky-800 transition-colors hover:underline"
                    >
                        Lupa kata laluan?
                    </button>
                </div>

                {/* Butang Log Masuk */}
                <button
                    type="submit"
                    className="w-full mt-8 py-4 bg-[#1e3a8a] hover:bg-[#2745a3] text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                    Log Masuk Sistem
                </button>
              </motion.div>
            </form>

            {/* REMOVED: "Hubungi IT Markas" section */}
          </div>
        </div>

        {/* RIGHT SIDE - Visuals */}
        <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#182d5f] relative flex-col justify-center items-center text-white p-12 overflow-hidden">
            
            {/* Graphic Lines (Yellow & Light Blue) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Yellow Line */}
                <div className="absolute top-[25%] -left-[20%] w-[150%] h-[2px] bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent rotate-[25deg] blur-[1px]"></div>
                {/* Light Blue Line */}
                <div className="absolute top-[35%] -left-[20%] w-[150%] h-[3px] bg-gradient-to-r from-transparent via-sky-400/60 to-transparent rotate-[25deg] blur-[0.5px]"></div>
                 {/* Fainter Yellow Line */}
                 <div className="absolute bottom-[30%] -left-[20%] w-[150%] h-[1px] bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent rotate-[25deg]"></div>
            </div>

            {/* Subtle Tactical Pattern Overlay */}
            <div className="absolute inset-0 opacity-10" style={{ 
                backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
                backgroundSize: '60px 60px' 
            }}></div>

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-md">
                
                {/* Notification Cards */}
                <div className="mb-10 relative">
                    {/* Card 1 */}
                    <motion.div 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="bg-[#1e3a8a]/50 backdrop-blur-md border-l-4 border-l-yellow-400 border-t border-r border-b border-white/10 p-6 rounded-r-2xl rounded-l-md shadow-xl mb-4"
                    >
                       <div className="flex items-center gap-3 mb-3">
                         <div className="p-2 bg-yellow-400/20 rounded-lg text-yellow-300"><Bell size={20} /></div>
                         <span className="text-xs font-bold tracking-wider uppercase text-yellow-300">Notis Penting</span>
                       </div>
                       <h3 className="font-bold text-lg mb-1">Arahan Pentadbiran Bil 2/2025</h3>
                       <p className="text-sm text-slate-300">Semua Pegawai Memerintah dikehendaki mengemaskini status kesiapsiagaan anggota.</p>
                    </motion.div>

                    {/* Card 2 */}
                    <motion.div 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="bg-[#1e3a8a]/30 backdrop-blur-sm border-l-4 border-l-sky-400 border-t border-r border-b border-white/5 p-5 rounded-r-2xl rounded-l-md shadow-lg transform scale-95 opacity-80"
                    >
                       <div className="flex items-center gap-3 mb-2">
                         <div className="p-2 bg-sky-400/20 rounded-lg text-sky-300"><ShieldCheck size={18} /></div>
                         <span className="text-xs font-bold tracking-wider uppercase text-sky-300">Keselamatan Sistem</span>
                       </div>
                       <p className="text-sm text-slate-400">Penyelenggaraan berkala pelayan pangkalan data akan dijalankan pada Sabtu ini.</p>
                    </motion.div>
                </div>

                <div className="text-center mt-8">
                  <h2 className="text-2xl font-bold mb-3 tracking-tight">
                      Sistem Pengurusan & Info Markas
                  </h2>
                  <div className="h-0.5 w-16 bg-sky-500/50 mx-auto mb-4 rounded-full"></div>
                  <p className="text-slate-300 text-base leading-relaxed">
                      Platform berpusat untuk pentadbir menguruskan kelulusan cuti dan memantau pergerakan anggota.
                  </p>
                </div>

                {/* Status Indicators */}
                <div className="mt-10 flex justify-center gap-6 text-xs text-slate-400 font-mono">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse relative">
                            <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75"></span>
                        </span>
                        Pelayan: ONLINE
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-sky-400 rounded-full"></span>
                        Pangkalan Data: STABIL
                    </div>
                </div>

            </div>
        </div>

      </motion.div>
    </div>
  );
}