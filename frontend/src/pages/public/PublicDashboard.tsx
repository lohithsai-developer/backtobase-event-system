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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#11141c] via-[#171b26] to-[#0d0f15] border border-[#272d3f] p-8 sm:p-12 overflow-hidden shadow-2xl mb-12">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00e5ff]/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#e6be6d]/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 text-center md:text-left max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00e5ff]/10 border border-[#00e5ff]/20 text-[#00e5ff] text-xs font-bold uppercase tracking-widest">
              <span>BacktoBase Live Portal</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Mega Event Ticketing &amp; Attendance Management
            </h1>
            <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
              Official verification portal for BacktoBase events. Experience seamless QR ticket validation, real-time check-ins, and institutional-grade event tracking.
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
              <Link
                to="/volunteer/scanner"
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#00e5ff] to-[#00b4d8] text-black hover:opacity-95 shadow-lg shadow-[#00e5ff]/25 transition-all"
              >
                <QrCode className="w-5 h-5" />
                <span>Launch Volunteer Scanner</span>
              </Link>
              <Link
                to="/admin/login"
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm bg-[#171b26] text-white border border-[#272d3f] hover:border-[#e6be6d] hover:text-[#e6be6d] transition-all"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>Admin Login</span>
              </Link>
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-center p-6 bg-[#11141c]/80 rounded-2xl border border-[#272d3f] shadow-inner text-center">
            <img
              src="/backtobase-logo.png"
              alt="BacktoBase Mega Event"
              className="w-48 h-auto object-contain drop-shadow-md"
            />
            <div className="mt-3 text-xs font-bold tracking-widest text-slate-400 uppercase">
              LEGENDS UPGRADE
            </div>
          </div>
        </div>
      </div>

      {/* Active Event Display */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <div className="w-10 h-10 border-4 border-[#00e5ff] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="font-semibold text-sm">Fetching active mega event information...</p>
        </div>
      ) : activeEvent ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white tracking-tight">Currently Active Mega Event</h2>
              <Badge variant="active">LIVE NOW</Badge>
            </div>
            <div className="text-xs text-slate-400 hidden sm:block">
              Event data synchronized with server
            </div>
          </div>

          {/* Active Event Card */}
          <div className="bg-[#11141c] border border-[#272d3f] rounded-2xl p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#272d3f]">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#e6be6d]">
                  Official Event Program
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">{activeEvent.name}</h3>
                <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
                  {activeEvent.description}
                </p>
              </div>
              <div className="shrink-0 bg-[#171b26] border border-[#272d3f] rounded-xl px-5 py-4 flex items-center gap-3">
                <Calendar className="w-6 h-6 text-[#00e5ff]" />
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Scheduled Date
                  </div>
                  <div className="text-base font-bold text-white">
                    {new Date(activeEvent.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <StatCard
                label="Total Registrations"
                value={activeEvent.totalParticipants}
                subtext="Confirmed passes"
                icon={<Users className="w-5 h-5" />}
                accentColor="turquoise"
              />
              <StatCard
                label="Total Attended"
                value={activeEvent.totalAttended}
                subtext="Verified check-ins"
                icon={<CheckCircle2 className="w-5 h-5" />}
                accentColor="green"
              />
              <StatCard
                label="Remaining In Queue"
                value={activeEvent.remainingParticipants}
                subtext="Pending gate entry"
                icon={<Users className="w-5 h-5" />}
                accentColor="amber"
              />
              <StatCard
                label="Attendance Rate"
                value={`${activeEvent.attendancePercentage}%`}
                subtext="Turnout ratio"
                icon={<CheckCircle2 className="w-5 h-5" />}
                accentColor="gold"
              />
            </div>
          </div>
        </div>
      ) : (
        /* Professional Empty State */
        <div className="bg-[#11141c] border border-[#272d3f] rounded-2xl p-12 text-center max-w-2xl mx-auto shadow-xl">
          <div className="w-16 h-16 rounded-full bg-[#171b26] border border-[#272d3f] flex items-center justify-center mx-auto mb-4 text-slate-500">
            <Calendar className="w-8 h-8 text-[#e6be6d]" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No active event at the moment</h3>
          <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto leading-relaxed">
            The event administrator has not activated a mega event schedule yet. Once an event is activated in the admin console, live stats and scanner verification will activate automatically.
          </p>
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[#e6be6d] text-black hover:bg-[#eed08c] transition-all"
          >
            <span>Open Admin Dashboard to Activate Event</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
};
