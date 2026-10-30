import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, QrCode, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const BottomNav: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-[#0e1118]/95 backdrop-blur-lg border-t border-[#222838] px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-2xl">
      <div className="flex items-center justify-around max-w-md mx-auto">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              isActive
                ? 'text-[#00e5ff] scale-105 font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Portal</span>
        </NavLink>

        <NavLink
          to="/volunteer/scanner"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              isActive
                ? 'text-[#00e5ff] bg-[#00e5ff]/10 border border-[#00e5ff]/30 shadow-md shadow-[#00e5ff]/20 scale-105 font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <QrCode className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Scanner</span>
        </NavLink>

        {isAuthenticated ? (
          <>
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                  isActive
                    ? 'text-[#e6be6d] scale-105 font-extrabold'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Shield className="w-5 h-5" />
              <span className="text-[10px] tracking-tight">Admin</span>
            </NavLink>

            <button
              type="button"
              onClick={handleLogout}
              className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-rose-400/80 hover:text-rose-400 active:scale-95 transition-all"
              title="Logout of Admin"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-[10px] font-bold tracking-tight">Logout</span>
            </button>
          </>
        ) : (
          <NavLink
            to="/admin/login"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-[#e6be6d] scale-105 font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <Shield className="w-5 h-5" />
            <span className="text-[10px] font-bold tracking-tight">Admin Login</span>
          </NavLink>
        )}
      </div>
    </nav>
  );
};
