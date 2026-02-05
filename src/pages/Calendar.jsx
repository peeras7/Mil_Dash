import React, { useEffect, useState, useMemo } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Layout from "../components/Layout";
import LeaveCalendar from "../components/LeaveCalendar";
import QuickViewModal from "../components/QuickViewModal"; // Use the new modal
import { logActivity } from "../utils/activityLogger"; // Pastikan fail ini wujud, jika tidak, komenkan
import { differenceInCalendarDays } from "date-fns";

export default function Calendar() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Admin");
  const [allLeaves, setAllLeaves] = useState([]);
  const [selectedLeave, setSelectedLeave] = useState(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Semua'); 

  // Auth Guard
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) navigate("/login");
      else setUserName(u.displayName || (u.email?.split("@")[0] || "Admin"));
    });
    return () => unsub();
  }, [navigate]);

  // Firestore Listener
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "leave_requests"), (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id, ...d.data(),
        startDate: d.data().startDate?.toDate(),
        endDate: d.data().endDate?.toDate(),
        createdAt: d.data().createdAt?.toDate(),
      }));
      setAllLeaves(data);
    });
    return () => unsub();
  }, []);

  // Filter Logic
  const filteredLeaves = useMemo(() => {
    return allLeaves.filter(leave => {
      const filterStatus = activeFilter === 'Semua' ? 'All' :
                           activeFilter === 'Menunggu' ? 'Pending' :
                           activeFilter === 'Diluluskan' ? 'Approved' :
                           activeFilter === 'Ditolak' ? 'Rejected' : 'All';

      const matchesFilter = filterStatus === 'All' || leave.status === filterStatus;
      const matchesSearch = !searchQuery || leave.userName?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [allLeaves, activeFilter, searchQuery]);

  // Status Counts for Filter Tabs
  const statusCounts = useMemo(() => {
    return {
      Pending: allLeaves.filter(l => l.status === 'Pending').length,
      Approved: allLeaves.filter(l => l.status === 'Approved').length,
      Rejected: allLeaves.filter(l => l.status === 'Rejected').length,
    };
  }, [allLeaves]);

  return (
    <Layout userName={userName}>
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
            Kalendar <span className="text-blue-600">Cuti</span>
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400 font-medium">
            Paparan visual jadual pergerakan anggota.
        </p>
      </div>

      <div className="mt-6">
        <LeaveCalendar
          leaves={filteredLeaves}
          onDateClick={(leave) => setSelectedLeave(leave)}
          statusCounts={statusCounts}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {selectedLeave && (
        <QuickViewModal
          request={selectedLeave}
          onClose={() => setSelectedLeave(null)}
        />
      )}
    </Layout>
  );
}