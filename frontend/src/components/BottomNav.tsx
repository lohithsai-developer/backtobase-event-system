import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, QrCode, Shield, Calendar, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const BottomNav: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-[#0e1118]/95 backdrop-blur-lg border-t border-[#222838] px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-2xl">
      <div className="flex items-center justify-around max-w-md mx-auto">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              isActive
                ? 'text-[#00e5ff] scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-tight">Portal</span>
        </NavLink>

        <NavLink
          to="/volunteer/scanner"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
              isActive
                ? 'text-[#00e5ff] bg-[#00e5ff]/10 border border-[#00e5ff]/30 shadow-lg shadow-[#00e5ff]/20 scale-105'
                : 'text-slate-300 hover:text-white'
            }`
          }
        >
          <div className="relative">
            <QrCode className="w-5 h-5 text-[#00e5ff]" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#00e5ff] animate-ping" />
          </div>
          <span className="text-[10px] font-extrabold text-[#00e5ff] tracking-tight">Scanner</span>
        </NavLink>

        {isAuthenticated ? (
          <>
            <NavLink
              to="/admin/events"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                  isActive
                    ? 'text-[#e6be6d] scale-105'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Calendar className="w-5 h-5" />
              <span className="text-[10px] font-bold tracking-tight">Events</span>
            </NavLink>

            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                  isActive
                    ? 'text-[#e6be6d] scale-105'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Shield className="w-5 h-5" />
              <span className="text-[10px] font-bold tracking-tight">Admin</span>
            </NavLink>
          </>
        ) : (
          <NavLink
            to="/admin/login"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-[#e6be6d] scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <Shield className="w-5 h-5" />
            <span className="text-[10px] font-bold tracking-tight">Admin</span>
          </NavLink>
        )}
      </div>
    </nav>
  );
};
