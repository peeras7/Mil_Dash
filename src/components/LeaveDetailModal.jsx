import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, CheckCircleIcon, CalendarDaysIcon } from '@heroicons/react/24/solid';
import { format, differenceInCalendarDays } from 'date-fns';

export default function LeaveDetailModal({ leave, onClose, onUpdateStatus }) {
  if (!leave) return null;

  let leaveDuration = 'N/A';
  if (leave.startDate && leave.endDate) {
    const diffDays = differenceInCalendarDays(leave.endDate, leave.startDate) + 1;
    leaveDuration = `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative bg-white w-full max-w-sm rounded-xl shadow-xl p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full hover:bg-slate-100">
            <XMarkIcon className="w-5 h-5 text-slate-500" />
          </button>

          <h2 className="text-lg font-bold text-slate-800">{leave.leaveType}</h2>
          
          <div className="flex items-center space-x-2 mt-1 text-sm text-slate-600">
            <CheckCircleIcon className="w-5 h-5 text-slate-400" />
            <span>Requested by {leave.userName || 'N/A'}</span>
          </div>

          <div className="mt-4 border-t border-slate-200 pt-4 space-y-4 text-sm">
            <div className="flex items-start space-x-3">
                <CalendarDaysIcon className="w-5 h-5 text-slate-400 mt-0.5"/>
                <div>
                    <p className="text-slate-500">Date</p>
                    <p className="font-medium text-slate-800">
                      {leave.startDate ? format(leave.startDate, 'dd MMM') : 'N/A'} - {leave.endDate ? format(leave.endDate, 'dd MMM, yyyy') : 'N/A'}
                    </p>
                </div>
            </div>
             <div className="flex items-start space-x-3">
                <CalendarDaysIcon className="w-5 h-5 text-slate-400 mt-0.5"/>
                <div>
                    <p className="text-slate-500">Duration</p>
                    <p className="font-medium text-slate-800">{leaveDuration}</p>
                </div>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Reason for Leave:</p>
              <p className="text-slate-800">{leave.purpose || 'No purpose provided.'}</p>
            </div>
          </div>
          
           {leave.status === 'Pending' && (
            <div className="mt-6 flex justify-end space-x-3 border-t pt-4">
              <button onClick={() => onUpdateStatus(leave.id, 'Rejected')} className="px-4 py-2 font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700">
                Reject
              </button>
              <button onClick={() => onUpdateStatus(leave.id, 'Approved')} className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                Approve
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}