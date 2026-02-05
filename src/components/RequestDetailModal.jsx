import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, PaperClipIcon } from '@heroicons/react/24/solid';
import { format, differenceInCalendarDays } from 'date-fns';
import { db, auth } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import Swal from 'sweetalert2';
import { logActivity } from '../utils/activityLogger'; 

export default function RequestDetailModal({ request, onClose }) {
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (request) setRemark(request.remark || '');
  }, [request]);

  const handleUpdate = async (newStatus) => {
    if (newStatus === 'Rejected' && !remark.trim()) {
      Swal.fire("Catatan Diperlukan", "Sila berikan sebab penolakan cuti.", "warning");
      return;
    }
    setLoading(true);
    const requestRef = doc(db, 'leave_requests', request.id);
    try {
      await updateDoc(requestRef, {
        status: newStatus,
        remark: newStatus === 'Rejected' ? remark.trim() : '',
        resolvedAt: serverTimestamp(),
        resolvedBy: auth.currentUser?.displayName || 'Admin',
      });

      // ✅ LOG ACTIVITY
      const actionText = newStatus === 'Approved' ? 'Meluluskan Cuti' : 'Menolak Cuti';
      await logActivity(actionText, `${request.leaveType} untuk ${request.userName}`, request.id);

      Swal.fire('Status Dikemaskini!', `Cuti telah ditandakan sebagai ${newStatus === 'Approved' ? 'Diluluskan' : 'Ditolak'}.`, 'success');
      onClose();
    } catch (error) {
      console.error("Error:", error);
      Swal.fire("Ralat", "Tidak dapat mengemaskini permohonan.", "error");
    } finally {
      setLoading(false);
    }
  };

  const getStatusPillClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const formatDateSafe = (date, fmt = 'dd MMM yyyy') => {
      try { return date ? format(date, fmt) : 'N/A'; }
      catch (e) { return 'Invalid Date'; }
  }

  let leaveDuration = 'N/A';
  if (request.startDate && request.endDate) {
    try {
        const diffDays = differenceInCalendarDays(request.endDate, request.startDate) + 1;
        leaveDuration = `${diffDays} hari`;
    } catch (e) {}
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
          className="relative bg-white dark:bg-slate-800 w-full max-w-3xl rounded-2xl shadow-xl p-6 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>

          {/* Header */}
          <div className="flex justify-between items-center flex-shrink-0">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Butiran Permohonan Cuti</h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
              <XMarkIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Personnel */}
              <div className="md:col-span-1 space-y-4">
                 <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Anggota</h3>
                 <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 overflow-hidden">
                    {request.profilePictureUrl ? <img src={request.profilePictureUrl} alt={request.userName} className="w-full h-full object-cover" /> : request.userName?.[0] || '?'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{request.userName || 'Unknown'}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{request.userRank || 'No Rank'}</p>
                  </div>
                </div>
                <div><p className="text-xs text-slate-500 dark:text-slate-400">Telefon</p><p className="font-medium text-slate-800 dark:text-slate-200">{request.contactNumber || 'N/A'}</p></div>
                <div><p className="text-xs text-slate-500 dark:text-slate-400">Platun</p><p className="font-medium text-slate-800 dark:text-slate-200">{request.userPlatoon || 'N/A'}</p></div>
              </div>

              {/* Leave Info */}
              <div className="md:col-span-2 grid grid-cols-2 gap-x-6 gap-y-4">
                <div className="col-span-2"><h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Butiran Cuti</h3></div>
                
                <div><p className="text-xs text-slate-500 dark:text-slate-400">Jenis Cuti</p><p className="font-medium text-slate-800 dark:text-slate-200">{request.leaveType}</p></div>
                <div><p className="text-xs text-slate-500 dark:text-slate-400">Kategori</p><p className="font-medium text-slate-800 dark:text-slate-200">{request.leaveCategory}</p></div>
                <div><p className="text-xs text-slate-500 dark:text-slate-400">Mula</p><p className="font-medium text-slate-800 dark:text-slate-200">{formatDateSafe(request.startDate)}</p></div>
                <div><p className="text-xs text-slate-500 dark:text-slate-400">Tamat</p><p className="font-medium text-slate-800 dark:text-slate-200">{formatDateSafe(request.endDate)}</p></div>
                <div className="col-span-2"><p className="text-xs text-slate-500 dark:text-slate-400">Tujuan</p><p className="font-medium text-slate-800 dark:text-slate-200">{request.purpose}</p></div>
                <div className="col-span-2"><p className="text-xs text-slate-500 dark:text-slate-400">Alamat</p><p className="font-medium text-slate-800 dark:text-slate-200">{request.leaveAddress}</p></div>
                <div><p className="text-xs text-slate-500 dark:text-slate-400">Tempoh</p><p className="font-medium text-slate-800 dark:text-slate-200">{leaveDuration}</p></div>
                <div><p className="text-xs text-slate-500 dark:text-slate-400">Status</p><p><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusPillClass(request.status)}`}>{request.status}</span></p></div>

                {/* ✅ Attachment Button */}
                {request.attachmentUrl ? (
                    <div className="col-span-2 mt-2">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Lampiran</p>
                        <a href={request.attachmentUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600">
                            <PaperClipIcon className="w-4 h-4" /> Lihat Dokumen
                        </a>
                    </div>
                ) : (
                    <div className="col-span-2 mt-2">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Lampiran</p>
                        <p className="text-sm text-slate-400 italic">Tiada lampiran.</p>
                    </div>
                )}
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
              <label className="block text-sm font-semibold text-slate-500 dark:text-slate-400">Catatan</label>
              <textarea value={remark} onChange={(e) => setRemark(e.target.value)}
                placeholder="Sebab..."
                className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="2" />
          </div>

          {/* Actions */}
          <div className="mt-4 flex justify-end space-x-3">
            {request.status === 'Pending' && (
              <>
                <button onClick={() => handleUpdate('Rejected')} disabled={loading} className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700">Tolak</button>
                <button onClick={() => handleUpdate('Approved')} disabled={loading} className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">Luluskan</button>
              </>
            )}
            {/* Logic for changing status from Approved/Rejected can be added here similarly */}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}