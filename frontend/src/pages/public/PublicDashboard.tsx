import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';
import { Calendar, Users, CheckCircle2, ArrowRight, ShieldCheck, QrCode, Search, Clock, UserCheck, Lock } from 'lucide-react';
import { StatCard } from '../../components/StatCard';
import { Badge } from '../../components/Badge';

export const PublicDashboard: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [activeEvent, setActiveEvent] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'attended' | 'pending'>('all');
  const [search, setSearch] = useState<string>('');

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

  const filteredParticipants = useMemo(() => {
    if (!activeEvent || !activeEvent.participants) return [];
    return activeEvent.participants.filter((p: any) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.email.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;

      if (filter === 'attended') return p.isCheckedIn;
      if (filter === 'pending') return !p.isCheckedIn;
      return true;
    });
  }, [activeEvent, filter, search]);

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

          {/* Live Participants & Attended Roster */}
          <div className="bg-[#11141c] border border-[#272d3f] rounded-2xl p-5 sm:p-7 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[#00e5ff]" />
                  <h3 className="text-lg sm:text-xl font-extrabold text-white">Event Attendance Roster</h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Live verification record for registered attendees and checked-in participants.
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#171b26] border border-[#272d3f] rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    filter === 'all'
                      ? 'bg-[#00e5ff] text-black font-bold shadow-md shadow-[#00e5ff]/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({activeEvent.totalParticipants})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('attended')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    filter === 'attended'
                      ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-emerald-400'
                  }`}
                >
                  Attended ({activeEvent.totalAttended})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    filter === 'pending'
                      ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-amber-400'
                  }`}
                >
                  Pending ({activeEvent.remainingParticipants})
                </button>
              </div>
            </div>

            {!isAuthenticated ? (
              <div className="py-8 px-4 text-center bg-[#0e1017] border border-[#222838] rounded-2xl max-w-md mx-auto space-y-3 my-4">
                <div className="w-12 h-12 rounded-full bg-[#00e5ff]/10 border border-[#00e5ff]/20 flex items-center justify-center mx-auto text-[#00e5ff]">
                  <Lock className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-white">Attendee Roster Restricted</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Participant names, emails, and admission records are protected and only accessible to authorized volunteers and administrators.
                </p>
                <Link
                  to="/admin/login"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs bg-[#171b26] border border-[#272d3f] hover:border-[#00e5ff] text-[#00e5ff] transition-all"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authorized Staff Sign In</span>
                </Link>
              </div>
            ) : (
              <>
                {/* Search Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search attendee by name or email..."
                    className="w-full pl-10 pr-4 py-2.5 bg-[#0e1017] border border-[#272d3f] rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00e5ff]"
                  />
                </div>

                {/* Participant Items */}
                {filteredParticipants.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500 bg-[#0e1017] rounded-xl border border-[#222838]">
                    No attendees match the selected filter or search term.
                  </div>
                ) : (
                  <div className="divide-y divide-[#222838] border border-[#222838] rounded-xl overflow-hidden bg-[#0e1017]">
                    {filteredParticipants.map((p: any) => (
                      <div
                        key={p.id}
                        className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-[#151924] transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-white text-sm sm:text-base truncate">
                            {p.name}
                          </div>
                          <div className="text-slate-400 font-mono text-xs truncate mt-0.5">
                            {p.email}
                          </div>
                        </div>

                        <div className="shrink-0 flex flex-col sm:flex-row items-end sm:items-center gap-1.5 sm:gap-3">
                          {p.isCheckedIn ? (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Attended</span>
                              </span>
                              {p.checkedInAt && (
                                <span className="text-[11px] text-slate-500 hidden sm:inline flex items-center gap-1 font-mono">
                                  <Clock className="w-3 h-3 inline" />
                                  {new Date(p.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-700/30 border border-slate-700 text-slate-400 text-xs font-medium">
                              <span>Pending Check-in</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
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
