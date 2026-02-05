import React, { useState, useEffect } from 'react';
import { 
    X, Paperclip, CheckCircle2, XCircle, RefreshCw,
    Phone, Users, Briefcase, MapPin, Calendar, 
    User, FileText, MessageSquare, Download
} from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';
import { db, auth } from '../firebase';
import { doc, updateDoc, serverTimestamp, increment, addDoc, collection } from 'firebase/firestore';
import Swal from 'sweetalert2';

export default function QuickViewModal({ request, onClose }) {
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (request) setRemark(request.remark || '');
  }, [request]);

  const LEAVE_BALANCE_MAP = {
      "Cuti Tahunan": "annualLeaveBalance",
      "Cuti Sakit": "sickLeaveBalance",
      "Cuti Kecemasan": "compassionateLeaveBalance",
      "Cuti Bapa": "paternityLeaveBalance",
      "Cuti Bersalin": "maternityLeaveBalance"
  };

  // --- HELPER: FORMAT DATE ---
  const formatDateSafe = (date, withTime = false) => {
    try { 
        const d = date?.seconds ? date.toDate() : new Date(date);
        return format(d, withTime ? 'dd MMM yyyy, HH:mm' : 'dd MMM yyyy'); 
    } catch (e) { return '-'; }
  };

  // --- SMART FILE DETECTION ---
  const fileUrl = 
      request.attachmentUrl || 
      request.fileUrl || 
      request.documentUrl || 
      request.url || 
      request.imageUrl || 
      request.file || 
      request.lampiran ||
      request.receiptUrl;

  const hasAttachment = !!fileUrl; 

  const handleViewFile = (e) => {
      if (e) e.stopPropagation(); 
      if (fileUrl) {
          window.open(fileUrl, "_blank", "noopener,noreferrer");
      } else {
          Swal.fire("Tiada Fail", "Maaf, tiada pautan fail dijumpai.", "error");
      }
  };

  const handleUpdate = async (newStatus) => {
    // 1. Validation Check
    if (newStatus === 'Rejected' && !remark.trim()) {
      Swal.fire({ 
        title: "Catatan Diperlukan", 
        text: "Sila berikan sebab penolakan.", 
        icon: "warning",
        confirmButtonColor: "#0f172a" 
      });
      return;
    }

    setLoading(true);
    const requestRef = doc(db, 'leave_requests', request.id);
    
    // Get Admin Details safely
    const adminUser = auth.currentUser;
    const adminName = adminUser?.displayName || 'Admin';
    const adminId = adminUser?.uid || 'unknown_admin';

    try {
      // 2. Logic: Deduct Leave Balance if Approved
      if (newStatus === 'Approved' && request.status !== 'Approved') {
          const start = request.startDate.seconds ? request.startDate.toDate() : new Date(request.startDate);
          const end = request.endDate.seconds ? request.endDate.toDate() : new Date(request.endDate);
          const daysToDeduct = differenceInCalendarDays(end, start) + 1;
          const dbField = LEAVE_BALANCE_MAP[request.leaveType];

          if (dbField && request.userId) {
              const userRef = doc(db, 'military_personnel', request.userId);
              await updateDoc(userRef, { [dbField]: increment(-daysToDeduct) });
          }
      }

      // 3. Logic: Update the Leave Request Status
      await updateDoc(requestRef, {
        status: newStatus,
        remark: newStatus === 'Rejected' ? remark.trim() : (remark.trim() || ''),
        resolvedAt: serverTimestamp(),
        resolvedBy: adminName,
      });

      // 4. NEW LOGIC: SAVE TO AUDIT LOGS
      try {
        const actionText = newStatus === 'Approved' ? "Kelulusan Cuti" : "Penolakan Cuti";
        const remarkText = remark.trim() || 'Tiada';
        const actionVerb = newStatus === 'Approved' ? "meluluskan" : "menolak";
        
        const oldStatusMalay = request.status === 'Approved' ? 'Diluluskan' : request.status === 'Rejected' ? 'Ditolak' : 'Menunggu';
        const newStatusMalay = newStatus === 'Approved' ? 'Diluluskan' : 'Ditolak';
        
        const applyDate = formatDateSafe(request.createdAt);

        const detailsText = `Tindakan ${actionVerb} permohonan ${request.leaveType} bagi anggota ${request.userName} (Tarikh Mohon: ${applyDate}). Status permohonan dikemaskini daripada '${oldStatusMalay}' kepada '${newStatusMalay}'. Catatan Admin: ${remarkText}`;

        await addDoc(collection(db, "audit_logs"), { 
          action: actionText, 
          targetId: request.id,        
          targetUser: request.userName, 
          performedBy: adminName,      
          performedById: adminId,      
          timestamp: serverTimestamp(), 
          details: detailsText 
        });
        console.log("Audit log saved successfully.");
      } catch (auditError) {
        console.error("Failed to save audit log:", auditError);
      }

      Swal.fire({
        title: 'Berjaya',
        text: `Status dikemaskini: ${newStatus === 'Approved' ? 'Diluluskan' : 'Ditolak'}`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
      onClose();

    } catch (error) {
      console.error("Error:", error);
      Swal.fire("Ralat Sistem", "Gagal mengemaskini data.", "error");
    } finally {
      setLoading(false);
    }
  };

  let duration = 0;
  if (request.startDate && request.endDate) {
      const s = request.startDate.seconds ? request.startDate.toDate() : new Date(request.startDate);
      const e = request.endDate.seconds ? request.endDate.toDate() : new Date(request.endDate);
      duration = differenceInCalendarDays(e, s) + 1;
  }

  // --- INFO ROW COMPONENT ---
  const InfoRow = ({ icon: Icon, label, value, isClickable = false }) => (
      <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
          <div className="mt-0.5 text-slate-400">
              <Icon size={18} />
          </div>
          <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-0.5">{label}</p>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {value || '-'}
              </div>
          </div>
      </div>
  );

  return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm" onClick={onClose}>
        <div 
          className="relative w-full max-w-4xl bg-white dark:bg-[#0f172a] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]" 
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className="flex justify-between items-center px-6 py-5 bg-white dark:bg-[#0f172a] border-b border-slate-100 dark:border-slate-800">
            <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="text-blue-600" size={20} />
                    Butiran Permohonan
                </h2>
                <p className="text-xs font-mono text-slate-400 mt-1 uppercase tracking-wide">REF: {request.id.slice(0, 12)}...</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors">
              <X size={24} />
            </button>
          </div>

          {/* CONTENT */}
          <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-[#0f172a] custom-scrollbar">
            
            {/* 1. PROFIL PEMOHON */}
            <div className="p-6 bg-white dark:bg-[#1e293b] border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-lg bg-slate-800 text-white flex items-center justify-center text-2xl font-bold shadow-md">
                        {request.userName?.[0]}
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">{request.userName}</h3>
                                <div className="flex items-center gap-3 mt-1 text-sm text-slate-600 dark:text-slate-400">
                                    <span className="font-semibold">{request.userRank || 'Anggota'}</span>
                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                    <span>{request.userPlatoon || "Platun Tidak Ditetapkan"}</span>
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                                request.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                request.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                request.status === 'Cancelled' ? 'bg-slate-50 text-slate-700 border-slate-200' :
                                'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                                {
                                  request.status === 'Pending' ? 'Menunggu' : 
                                  request.status === 'Approved' ? 'Diluluskan' : 
                                  request.status === 'Rejected' ? 'Ditolak' : 
                                  request.status === 'Cancelled' ? 'Dibatalkan' : 
                                  request.status
                                }
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* 2. MAKLUMAT CUTI */}
                <div className="bg-white dark:bg-[#1e293b] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">Maklumat Cuti</h4>
                    <div className="grid grid-cols-2 gap-y-2">
                        <InfoRow icon={Briefcase} label="Jenis" value={request.leaveType} />
                        <InfoRow icon={Briefcase} label="Kategori" value={request.leaveCategory || 'Am'} />
                        <InfoRow icon={Calendar} label="Mula" value={formatDateSafe(request.startDate)} />
                        <InfoRow icon={Calendar} label="Tamat" value={formatDateSafe(request.endDate)} />
                        <InfoRow icon={Calendar} label="Tempoh" value={`${duration} Hari`} />
                        <InfoRow icon={Calendar} label="Mohon Pada" value={formatDateSafe(request.createdAt)} />
                    </div>
                </div>

                {/* 3. LOGISTIK & TUJUAN */}
                <div className="bg-white dark:bg-[#1e293b] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">Logistik & Tujuan</h4>
                    <div className="flex flex-col gap-2">
                        <InfoRow icon={User} label="Pengganti" value={request.replacementOfficer || 'Tiada'} />
                        <InfoRow icon={MapPin} label="Alamat" value={request.leaveAddress} />
                        
                        <InfoRow 
                            icon={MessageSquare} 
                            label="Tujuan" 
                            value={
                                <span>
                                    {request.purpose || '-'}
                                    {hasAttachment && (
                                        <button 
                                            onClick={handleViewFile}
                                            className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors text-[10px] font-bold uppercase tracking-wide cursor-pointer"
                                        >
                                            <Paperclip size={10} />
                                            [Lampiran PDF]
                                        </button>
                                    )}
                                </span>
                            } 
                        />
                    </div>
                </div>

                {/* 4. MAKLUMAT PERIBADI */}
                <div className="bg-white dark:bg-[#1e293b] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">Maklumat Peribadi</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-y-2">
                        <InfoRow icon={Phone} label="No. Telefon" value={request.contactNumber} />
                        <InfoRow icon={User} label="Pasangan" value={request.spouseName || 'Tiada'} />
                        <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent">
                            <div className="mt-0.5 text-slate-400"><Users size={18} /></div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-0.5">Anak</p>
                                {request.childrenNames && request.childrenNames.length > 0 ? (
                                    <ul className="list-disc list-inside text-sm font-semibold text-slate-800 dark:text-slate-200">
                                        {request.childrenNames.map((child, idx) => (
                                            <li key={idx}>{child}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">-</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. REKOD PENGESAHAN (UPDATED LOGIC HERE) */}
                {(request.resolvedBy || request.status !== 'Pending') && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700 lg:col-span-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Rekod Pengesahan</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Tindakan Oleh</span>
                                {/* LOGIC UPDATE: IF Cancelled, show UserName. Else show resolvedBy or Admin */}
                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                    {request.status === 'Cancelled' ? request.userName : (request.resolvedBy || 'Sistem Admin')}
                                </span>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Tarikh Tindakan</span>
                                <span className="text-sm font-mono text-slate-900 dark:text-white">{formatDateSafe(request.resolvedAt, true)}</span>
                            </div>
                            <div className="md:col-span-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Catatan Pegawai</span>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 italic border-l-4 border-slate-300 pl-3 py-1">
                                    "{request.remark || 'Tiada catatan.'}"
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* INPUT SECTION */}
            {/* Hide input section if status is cancelled */}
            {request.status !== 'Cancelled' && (
                <div className="px-6 pb-6">
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                        {request.status === 'Pending' ? 'Catatan Pengesahan (Wajib jika Ditolak)' : 'Kemaskini Catatan'}
                    </label>
                    <textarea 
                        value={remark}
                        onChange={(e) => setRemark(e.target.value)}
                        placeholder="Masukkan sebab kelulusan atau penolakan..."
                        className="w-full p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 text-slate-800 dark:text-white text-sm"
                        rows="2"
                    ></textarea>
                </div>
            )}

          </div>

          {/* FOOTER */}
          <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] flex justify-end gap-3 z-10">
            
            {hasAttachment && (
                <button 
                    onClick={handleViewFile}
                    className="mr-auto px-4 py-2.5 rounded-lg text-sm font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-2"
                >
                    <Download size={18} />
                    <span className="hidden sm:inline">Lihat Dokumen</span>
                </button>
            )}

            <button onClick={onClose} className="px-6 py-2.5 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                TUTUP
            </button>

            {/* Only show Action Buttons if NOT cancelled */}
            {request.status !== 'Cancelled' && (
                request.status === 'Pending' ? (
                    <>
                        <button onClick={() => handleUpdate('Rejected')} disabled={loading} className="px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm flex items-center gap-2">
                            <XCircle size={18} /> TOLAK
                        </button>
                        <button onClick={() => handleUpdate('Approved')} disabled={loading} className="px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-green-600 hover:bg-green-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 shadow-sm flex items-center gap-2">
                            <CheckCircle2 size={18} /> LULUSKAN
                        </button>
                    </>
                ) : (
                    <button 
                        onClick={() => handleUpdate(request.status === 'Approved' ? 'Rejected' : 'Approved')}
                        disabled={loading}
                        className={`px-6 py-2.5 rounded-lg text-sm font-bold text-white shadow-sm flex items-center gap-2 ${request.status === 'Approved' ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
                    >
                        {request.status === 'Approved' ? (
                            <> <XCircle size={18} /> BATAL KELULUSAN </>
                        ) : (
                            <> <RefreshCw size={18} /> LULUSKAN </>
                        )}
                    </button>
                )
            )}
          </div>
        </div>
      </div>
  );
}