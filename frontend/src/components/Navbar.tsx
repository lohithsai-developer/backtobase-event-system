import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, QrCode, LogOut, LayoutDashboard, Server } from 'lucide-react';
import { BackendConfigModal } from './BackendConfigModal';
import { getApiBase } from '../services/api';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const currentApi = getApiBase();
  const isCloudConnected = currentApi.startsWith('http');

  return (
    <header className="bg-[#11141c]/90 backdrop-blur-md border-b border-[#272d3f] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo and Title */}
        <Link to="/" className="flex items-center gap-4 group">
          <img
            src="/backtobase-logo.png"
            alt="BacktoBase Mega Event Logo"
            className="h-14 w-auto object-contain transition-transform group-hover:scale-105 duration-200"
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

          <Link
            to="/volunteer/scanner"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white bg-[#171b26] border border-[#272d3f] hover:border-[#00e5ff] hover:text-[#00e5ff] transition-all"
          >
            <QrCode className="w-4 h-4 text-[#00e5ff]" />
            <span className="hidden sm:inline">Volunteer Scanner</span>
            <span className="sm:hidden">Scanner</span>
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                to="/admin/dashboard"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-black bg-[#00e5ff] hover:bg-[#33ebff] transition-all shadow-md shadow-[#00e5ff]/20"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Admin Panel</span>
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                title="Log Out"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-all"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/admin/login"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-black bg-[#e6be6d] hover:bg-[#eed08c] transition-all shadow-md shadow-[#e6be6d]/20"
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
