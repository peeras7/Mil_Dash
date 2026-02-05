import React, { useEffect, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { UserCircleIcon, EnvelopeIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // === AUTH CHECK & DATA POPULATION ===
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate("/login");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  if (loading) {
    // You can return a loading spinner here if you want
    return <div className="min-h-screen bg-slate-100"></div>;
  }

  const userNameForLayout = user?.displayName || (user?.email ? user.email.split("@")[0] : "Admin");

  return (
    <Layout userName={userNameForLayout}>
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">CO Profile</h1>
        <p className="mt-1 text-slate-600">View and manage your personal information</p>
      </div>

      {/* Main Content Card */}
      <div className="mt-8 max-w-4xl mx-auto">
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200">
          <div className="flex flex-col sm:flex-row items-center sm:items-start sm:space-x-6">
            
            {/* Profile Picture / Avatar */}
            <div className="flex-shrink-0 mb-4 sm:mb-0">
              <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white text-5xl font-bold shadow-md">
                {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
              </div>
            </div>

            {/* Profile Details */}
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold text-slate-900">{user?.displayName || "Commanding Officer"}</h2>
              <p className="text-slate-500">Administrator</p>
              
              <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col sm:flex-row gap-4 text-sm">
                <div className="flex items-center text-slate-600">
                  <EnvelopeIcon className="w-5 h-5 mr-2 text-slate-400" />
                  <span>{user?.email}</span>
                </div>
                <div className="flex items-center text-slate-600">
                  <ShieldCheckIcon className="w-5 h-5 mr-2 text-slate-400" />
                  <span>Email Verified: {user?.emailVerified ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Placeholder for future sections */}
        <div className="mt-6 text-center text-slate-400 text-sm">
            <p>More profile settings and information will be available here in the future.</p>
        </div>
      </div>
    </Layout>
  );
}