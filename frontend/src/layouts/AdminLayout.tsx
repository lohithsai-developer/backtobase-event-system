import React from 'react';
import { Outlet, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';

export const AdminLayout: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const { eventId } = useParams();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08090c] flex items-center justify-center text-[#00e5ff]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#00e5ff] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold tracking-wide text-slate-400">Authenticating BacktoBase Admin...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-[#08090c] text-white">
      <Sidebar currentEventId={eventId} />
      <main className="flex-1 overflow-y-auto p-6 sm:p-8 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
};
