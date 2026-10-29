import React from 'react';
import { NavLink, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Ticket,
  ClipboardCheck,
  Settings,
  LogOut,
  History,
  ExternalLink,
  X,
} from 'lucide-react';

interface SidebarProps {
  currentEventId?: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentEventId,
  mobileOpen = false,
  onMobileClose,
}) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Try to detect eventId from URL if not passed explicitly
  const pathParts = location.pathname.split('/');
  const detectedEventId = currentEventId || (pathParts[2] === 'events' && pathParts[3] ? pathParts[3] : null);

  const handleLinkClick = () => {
    if (onMobileClose) onMobileClose();
  };

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
      isActive
        ? 'bg-[#00e5ff]/15 text-[#00e5ff] border border-[#00e5ff]/30 shadow-sm'
        : 'text-slate-400 hover:text-white hover:bg-[#171b26] border border-transparent'
    }`;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#11141c] border-r border-[#272d3f] w-64">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#272d3f] flex items-center justify-between">
        <NavLink to="/admin/dashboard" onClick={handleLinkClick} className="flex flex-col items-center flex-1 group">
          <img
            src="/backtobase-logo.png"
            alt="BacktoBase Logo"
            className="h-14 w-auto object-contain transition-transform group-hover:scale-105 duration-200"
          />
          <div className="mt-1 text-[10px] font-extrabold tracking-widest uppercase text-slate-400">
            Admin Console
          </div>
        </NavLink>
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#171b26]"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Nav Links */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
            Global Management
          </div>
          <nav className="space-y-1">
            <NavLink to="/admin/dashboard" end onClick={handleLinkClick} className={navItemClass}>
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/admin/events" onClick={handleLinkClick} className={navItemClass}>
              <Calendar className="w-4 h-4" />
              <span>All Events</span>
            </NavLink>
          </nav>
        </div>

        {/* Selected Event Context Navigation */}
        {detectedEventId && detectedEventId !== 'new' && (
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#e6be6d] px-3 mb-2 flex items-center justify-between">
              <span>Event Console</span>
              <span className="text-[9px] bg-[#e6be6d]/20 text-[#e6be6d] px-1.5 py-0.5 rounded">Active Focus</span>
            </div>
            <nav className="space-y-1">
              <NavLink to={`/admin/events/${detectedEventId}`} end onClick={handleLinkClick} className={navItemClass}>
                <Calendar className="w-4 h-4" />
                <span>Event Overview</span>
              </NavLink>
              <NavLink to={`/admin/events/${detectedEventId}/participants`} onClick={handleLinkClick} className={navItemClass}>
                <Users className="w-4 h-4" />
                <span>Participants</span>
              </NavLink>
              <NavLink to={`/admin/events/${detectedEventId}/tickets`} onClick={handleLinkClick} className={navItemClass}>
                <Ticket className="w-4 h-4" />
                <span>Tickets &amp; Email</span>
              </NavLink>
              <NavLink to={`/admin/events/${detectedEventId}/attendance`} onClick={handleLinkClick} className={navItemClass}>
                <ClipboardCheck className="w-4 h-4" />
                <span>Attendance (3-Col)</span>
              </NavLink>
              <NavLink to={`/admin/events/${detectedEventId}/history`} onClick={handleLinkClick} className={navItemClass}>
                <History className="w-4 h-4" />
                <span>Scan History</span>
              </NavLink>
            </nav>
          </div>
        )}

        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
            System &amp; Quick Tools
          </div>
          <nav className="space-y-1">
            <NavLink to="/admin/settings" onClick={handleLinkClick} className={navItemClass}>
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </NavLink>
            <NavLink
              to="/volunteer/scanner"
              onClick={handleLinkClick}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-[#00e5ff] hover:bg-[#171b26] border border-transparent transition-all"
            >
              <div className="flex items-center gap-3">
                <Ticket className="w-4 h-4" />
                <span>Open Scanner</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </NavLink>
            <NavLink
              to="/"
              onClick={handleLinkClick}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-[#171b26] border border-transparent transition-all"
            >
              <span>Public Live View</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </NavLink>
          </nav>
        </div>
      </div>

      {/* User Footer and Logout */}
      <div className="p-4 border-t border-[#272d3f] bg-[#0d0f15]">
        <div className="flex items-center justify-between mb-3 px-2">
          <div>
            <div className="text-xs font-bold text-white capitalize">{user?.username || 'Admin'}</div>
            <div className="text-[10px] text-[#00e5ff] font-semibold uppercase tracking-wider">
              {user?.role || 'Administrator'}
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            logout();
            navigate('/admin/login');
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:h-screen md:sticky md:top-0 md:shrink-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-out Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={onMobileClose}
          />
          <div className="relative z-10 flex h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
