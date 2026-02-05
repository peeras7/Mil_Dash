import React from 'react';
import { format, differenceInCalendarDays } from 'date-fns';
import { db, auth } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import Swal from 'sweetalert2';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/solid';
import { EyeIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function LeaveRequestItem({ request, onActionClick }) {

  const handleUpdate = async (e, newStatus) => {
    e.stopPropagation(); // Prevents the detailed view click
    const requestRef = doc(db, 'leave_requests', request.id);
    try {
      await updateDoc(requestRef, {
        status: newStatus,
        resolvedAt: serverTimestamp(),
        resolvedBy: auth.currentUser?.displayName || 'Admin',
      });
      Swal.fire({
        icon: newStatus === 'Approved' ? 'success' : 'error',
        title: `${newStatus}!`,
        showConfirmButton: false,
        timer: 1500
      });
    } catch (error) {
      Swal.fire("Error", `Could not ${newStatus.toLowerCase()} the request.`, "error");
    }
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case 'Approved': return { icon: <CheckCircleIcon className="w-5 h-5 text-green-500" />, bgColor: 'bg-green-50', borderColor: 'border-green-200' };
      case 'Rejected': return { icon: <XCircleIcon className="w-5 h-5 text-red-500" />, bgColor: 'bg-red-50', borderColor: 'border-red-200' };
      default: return { icon: <ClockIcon className="w-5 h-5 text-yellow-500" />, bgColor: 'bg-white', borderColor: 'border-slate-200' };
    }
  };

  const styles = getStatusStyles(request.status);

  let leaveDuration = null;
  if (request.startDate && request.endDate) {
    // Ensure dates are valid before calculating
    try {
        const diffDays = differenceInCalendarDays(request.endDate, request.startDate) + 1;
        leaveDuration = `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } catch (e) {
        console.error("Error calculating duration in LeaveRequestItem:", e);
        leaveDuration = 'Invalid Dates';
    }
  }

  // Helper for safe date formatting
  const formatDateSafe = (date, fmt = 'dd MMM yyyy') => {
      try {
          return date ? format(date, fmt) : 'N/A';
      } catch (e) {
          console.error("Error formatting date:", e);
          return 'Invalid Date';
      }
  }

  return (
    <div className={`p-4 rounded-lg border ${styles.bgColor} ${styles.borderColor}`}>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">

        <div className="md:col-span-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center font-bold text-slate-600 overflow-hidden">
            {request.profilePictureUrl ? <img src={request.profilePictureUrl} alt={request.userName} className="w-full h-full object-cover" /> : request.userName?.[0] || 'U'}
          </div>
          <div>
            <p className="font-bold text-slate-800">{request.userName || 'Unknown'}</p>
            <p className="text-xs text-slate-500">{request.userRank || 'No Rank'}</p>
          </div>
        </div>

        <div className="md:col-span-4">
          <p className="font-semibold text-slate-700">{request.leaveType}</p>
          <div className="flex items-center space-x-2 mt-1">
            {styles.icon}
            <span className="text-xs text-slate-500">
              {request.status} • {formatDateSafe(request.createdAt)}
            </span>
          </div>
        </div>

        <div className="md:col-span-3 text-sm text-slate-600">
          <p className="font-medium">
            {formatDateSafe(request.startDate, 'dd MMM')} - {formatDateSafe(request.endDate, 'dd MMM yyyy')}
          </p>
          {leaveDuration && <p className="text-xs text-slate-500">{leaveDuration}</p>}
        </div>

        <div className="md:col-span-2 flex justify-end">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onActionClick(request)} // Triggers the modal pop-up
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors duration-200"
              title="View Details"
            >
              <EyeIcon className="w-5 h-5"/>
            </button>

            {/* --- THIS IS THE CRITICAL PART --- */}
            {/* Conditionally render Approve/Reject buttons ONLY if status is Pending */}
            {request.status === 'Pending' && (
              <>
                <button
                  onClick={(e) => handleUpdate(e, 'Rejected')}
                  className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors duration-200"
                  title="Reject"
                >
                  <XMarkIcon className="w-5 h-5"/>
                </button>
                <button
                  onClick={(e) => handleUpdate(e, 'Approved')}
                  className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors duration-200"
                  title="Approve"
                >
                  <CheckIcon className="w-5 h-5"/>
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}