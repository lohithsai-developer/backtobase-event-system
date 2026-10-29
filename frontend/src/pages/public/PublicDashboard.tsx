import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../services/api';
import { Calendar, Users, CheckCircle2, ArrowRight, ShieldCheck, QrCode } from 'lucide-react';
import { StatCard } from '../../components/StatCard';
import { Badge } from '../../components/Badge';

export const PublicDashboard: React.FC = () => {
  const [activeEvent, setActiveEvent] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActiveEvent = async () => {
      try {
        const data = await apiRequest('/public/active-event');
        if (data.success) {
          setActiveEvent(data.activeEvent);
        }
      } catch (err: any) {
        setError(err.message || 'Could not load active event.');
      } finally {
        setLoading(false);
      }
    };

    fetchActiveEvent();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      {/* Hero Section */}
      <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#11141c] via-[#171b26] to-[#0d0f15] border border-[#272d3f] p-6 sm:p-10 overflow-hidden shadow-2xl mb-8">
        <div className="absolute top-0 right-0 w-72 sm:w-96 h-72 sm:h-96 bg-[#00e5ff]/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-72 sm:w-96 h-72 sm:h-96 bg-[#e6be6d]/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-left max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00e5ff]/10 border border-[#00e5ff]/20 text-[#00e5ff] text-[11px] sm:text-xs font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff] animate-ping" />
              <span>Official Mega Event Portal</span>
            </div>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              BacktoBase Mega Event
            </h1>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Real-time QR ticket verification, gate access control, and live attendance metrics powered by high-speed cloud sync.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center md:justify-start gap-3 pt-2">
              <Link
                to="/volunteer/scanner"
                className="flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#00e5ff] to-[#00b4d8] text-black hover:opacity-95 shadow-lg shadow-[#00e5ff]/25 active:scale-95 transition-all"
              >
                <QrCode className="w-5 h-5 shrink-0" />
                <span>Launch QR Scanner</span>
              </Link>
              <Link
                to="/admin/login"
                className="flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl font-bold text-sm bg-[#171b26] text-white border border-[#272d3f] hover:border-[#e6be6d] hover:text-[#e6be6d] active:scale-95 transition-all"
              >
                <ShieldCheck className="w-5 h-5 shrink-0 text-[#e6be6d]" />
                <span>Admin Login</span>
              </Link>
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-center p-4 sm:p-6 bg-[#11141c]/90 rounded-2xl border border-[#272d3f] shadow-inner text-center">
            <img
              src="/backtobase-logo.png"
              alt="BacktoBase Mega Event"
              className="w-32 sm:w-44 h-auto object-contain drop-shadow-md"
            />
            <div className="mt-2 text-[10px] font-bold tracking-widest text-[#00e5ff] uppercase">
              LEGENDS UPGRADE
            </div>
          </div>
        </div>
      </div>

      {/* Active Event Display */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <div className="w-10 h-10 border-4 border-[#00e5ff] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="font-semibold text-sm">Synchronizing live event data...</p>
        </div>
      ) : activeEvent ? (
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Active Live Event</h2>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </span>
            </div>
          </div>

          {/* Active Event Card */}
          <div className="bg-[#11141c] border border-[#272d3f] rounded-2xl p-5 sm:p-7 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#272d3f]">
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#e6be6d]">
                  Official Event Program
                </span>
                <h3 className="text-xl sm:text-3xl font-extrabold text-white">{activeEvent.name}</h3>
                <p className="text-slate-400 text-xs sm:text-sm max-w-3xl leading-relaxed">
                  {activeEvent.description}
                </p>
              </div>
              <div className="shrink-0 bg-[#171b26] border border-[#272d3f] rounded-xl px-4 py-3 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#00e5ff]" />
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Event Date
                  </div>
                  <div className="text-sm sm:text-base font-bold text-white">
                    {new Date(activeEvent.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics in Mobile 2x2 Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-5">
              <StatCard
                label="Registered"
                value={activeEvent.totalParticipants}
                subtext="Total passes"
                icon={<Users className="w-4 h-4 sm:w-5 sm:h-5" />}
                accentColor="turquoise"
              />
              <StatCard
                label="Attended"
                value={activeEvent.totalAttended}
                subtext="Checked in"
                icon={<CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />}
                accentColor="green"
              />
              <StatCard
                label="Pending"
                value={activeEvent.remainingParticipants}
                subtext="Gate queue"
                icon={<Users className="w-4 h-4 sm:w-5 sm:h-5" />}
                accentColor="amber"
              />
              <StatCard
                label="Turnout"
                value={`${activeEvent.attendancePercentage}%`}
                subtext="Attendance"
                icon={<CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />}
                accentColor="gold"
              />
            </div>
          </div>
        </div>
      ) : (
        /* Professional Empty State */
        <div className="bg-[#11141c] border border-[#272d3f] rounded-2xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xl">
          <div className="w-14 h-14 rounded-full bg-[#171b26] border border-[#272d3f] flex items-center justify-center mx-auto mb-4 text-[#e6be6d]">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2">No active event at the moment</h3>
          <p className="text-slate-400 text-xs sm:text-sm mb-6 max-w-md mx-auto leading-relaxed">
            Please log into the Admin Console to activate your event. Once activated, it immediately goes live across all mobile phones.
          </p>
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm bg-[#e6be6d] text-black hover:bg-[#eed08c] active:scale-95 transition-all shadow-lg shadow-[#e6be6d]/20"
          >
            <span>Sign In to Admin Console</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
};
