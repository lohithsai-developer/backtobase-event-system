import React, { useState } from 'react';
import { Outlet, Navigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { BottomNav } from '../components/BottomNav';
import { Menu, QrCode } from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const { eventId } = useParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <div className="flex flex-col md:flex-row min-h-screen bg-[#08090c] text-white">
      {/* Top Mobile Bar */}
      <div className="md:hidden sticky top-0 z-40 bg-[#11141c]/95 backdrop-blur-md border-b border-[#272d3f] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-xl bg-[#171b26] border border-[#272d3f] text-slate-300 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
          <img src="/backtobase-logo.png" alt="BacktoBase" className="h-9 w-auto object-contain" />
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/volunteer/scanner"
            className="p-2 rounded-xl bg-[#00e5ff]/15 text-[#00e5ff] border border-[#00e5ff]/30"
            title="Open Scanner"
          >
            <QrCode className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <Sidebar
        currentEventId={eventId}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-8">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
};
