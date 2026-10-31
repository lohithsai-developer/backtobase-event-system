import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ShieldCheck, QrCode, LogOut, LayoutDashboard, Server, Sun, Moon } from 'lucide-react';
import { BackendConfigModal } from './BackendConfigModal';
import { getApiBase } from '../services/api';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const currentApi = getApiBase();
  const isCloudConnected = currentApi.startsWith('http');

  return (
    <header className="bg-[#11141c]/90 backdrop-blur-md border-b border-[#272d3f] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* Brand Logo and Title */}
        <Link to="/" className="flex items-center gap-3 sm:gap-4 group">
          <img
            src="/backtobase-logo.png"
            alt="BacktoBase Mega Event Logo"
            className="h-10 sm:h-14 w-auto object-contain transition-transform group-hover:scale-105 duration-200"
          />
          <div className="hidden sm:block">
            <div className="text-xs font-bold uppercase tracking-widest text-[#e6be6d]">
              Mega Event Management
            </div>
            <div className="text-sm font-extrabold text-[#00e5ff] tracking-tight">
              TICKETING & ATTENDANCE
            </div>
          </div>
        </Link>

        {/* Navigation & Role Access */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setConfigModalOpen(true)}
            title={`Backend Server: ${currentApi}`}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-[#171b26] border border-[#272d3f] hover:border-slate-500 transition-all"
          >
            <span className={`w-2 h-2 rounded-full ${isCloudConnected ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            <Server className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{isCloudConnected ? 'Cloud API' : 'Server Settings'}</span>
          </button>

          {/* Light / Dark Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
            className="flex items-center justify-center p-2 rounded-lg text-slate-300 hover:text-white bg-[#171b26] border border-[#272d3f] hover:border-[#00e5ff] transition-all active:scale-95 shadow-sm"
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
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-bold text-black bg-[#00e5ff] hover:bg-[#33ebff] shadow-md shadow-[#00e5ff]/20 transition-all active:scale-95"
          >
            <QrCode className="w-4 h-4" />
            <span className="hidden sm:inline">Launch Scanner</span>
            <span className="sm:hidden">Scanner</span>
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                to="/admin/dashboard"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-bold text-black bg-[#e6be6d] hover:bg-[#eed08c] transition-all shadow-md shadow-[#e6be6d]/20 active:scale-95"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden xs:inline">Admin Panel</span>
                <span className="xs:hidden">Admin</span>
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                title="Log Out of Admin"
                className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs sm:text-sm font-bold text-rose-400 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 transition-all active:scale-95"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/admin/login"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold text-black bg-[#e6be6d] hover:bg-[#eed08c] transition-all shadow-md shadow-[#e6be6d]/20 active:scale-95"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Login</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      <BackendConfigModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
      />
    </header>
  );
};
