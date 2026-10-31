import React, { useState } from 'react';
import { Outlet, Navigate, useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sidebar } from '../components/Sidebar';
import { BottomNav } from '../components/BottomNav';
import { Menu, QrCode, LogOut, Sun, Moon } from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { eventId } = useParams();
  const navigate = useNavigate();
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
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-xl bg-[#171b26] border border-[#272d3f] text-slate-300 hover:text-white"
            title="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <img src="/backtobase-logo.png" alt="BacktoBase" className="h-8 w-auto object-contain" />
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Light / Dark Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
            className="p-2 rounded-xl bg-[#171b26] border border-[#272d3f] text-slate-300 hover:text-white active:scale-95 transition-all"
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-amber-500 fill-amber-500/20" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400 fill-amber-400/20" />
            )}
          </button>
          <Link
            to="/volunteer/scanner"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#00e5ff]/15 text-[#00e5ff] border border-[#00e5ff]/30 text-xs font-bold"
            title="Open Scanner"
          >
            <QrCode className="w-4 h-4" />
            <span className="hidden xs:inline">Scanner</span>
          </Link>
          <button
            onClick={() => {
              logout();
              navigate('/admin/login');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-bold transition-all active:scale-95"
            title="Log Out of Admin Console"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
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
