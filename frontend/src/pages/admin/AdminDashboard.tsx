import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../services/api';
import {
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  PlusCircle,
  Upload,
  QrCode,
  ArrowRight,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { StatCard } from '../../components/StatCard';
import { Badge } from '../../components/Badge';

export const AdminDashboard: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [activeEvent, setActiveEvent] = useState<any>(null);
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const eventsData = await apiRequest('/events');
        if (eventsData.success) {
          setEvents(eventsData.events);
          const active = eventsData.events.find((e: any) => e.status === 'active');
          setActiveEvent(active || null);

          // If active event exists, fetch recent check-in scan history
          if (active) {
            const scansData = await apiRequest(`/attendance/event/${active.id}/history`);
            if (scansData.success) {
              setRecentScans(scansData.history.slice(0, 5));
            }
          }
        }
      } catch (err) {
        console.error('Error loading admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="w-10 h-10 border-4 border-[#00e5ff] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="font-semibold text-sm">Loading BacktoBase Management System...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#272d3f]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#e6be6d]">
              Executive Overview
            </span>
            <Sparkles className="w-4 h-4 text-[#e6be6d]" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
            BacktoBase Operations Console
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Multi-event orchestration, QR pass lifecycle, and verified entry tracking.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/admin/events/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#00e5ff] text-black hover:bg-[#33ebff] transition-all shadow-md shadow-[#00e5ff]/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Event</span>
          </Link>
          {activeEvent && (
            <>
              <Link
                to={`/admin/events/${activeEvent.id}/participants`}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#171b26] text-white border border-[#272d3f] hover:border-[#00e5ff] hover:text-[#00e5ff] transition-all"
              >
                <Upload className="w-4 h-4" />
                <span>Import Participants</span>
              </Link>
              <a
                href="/volunteer/scanner"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#e6be6d] text-black hover:bg-[#eed08c] transition-all shadow-md shadow-[#e6be6d]/20"
              >
                <QrCode className="w-4 h-4" />
                <span>Open Scanner</span>
              </a>
            </>
          )}
        </div>
      </div>

      {/* Active Event Showcase */}
      {activeEvent ? (
        <div className="bg-[#11141c] border border-[#272d3f] rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#00e5ff]/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#272d3f]">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#00e5ff]">
                  Currently Active Mega Event
                </span>
                <Badge variant="active">GLOBALLY LIVE</Badge>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">{activeEvent.name}</h2>
              <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
                {activeEvent.description}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to={`/admin/events/${activeEvent.id}`}
                className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#171b26] text-[#00e5ff] border border-[#00e5ff]/40 hover:bg-[#00e5ff]/10 transition-all"
              >
                <span>Manage Active Event</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Active Event Auto Statistics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
            <StatCard
              label="Total Registrations"
              value={activeEvent.totalParticipants}
              subtext="Active database passes"
              icon={<Users className="w-5 h-5" />}
              accentColor="turquoise"
            />
            <StatCard
              label="Total Attended"
              value={activeEvent.totalAttended}
              subtext="Gate entrance confirmed"
              icon={<CheckCircle2 className="w-5 h-5" />}
              accentColor="green"
            />
            <StatCard
              label="Remaining Attendees"
              value={activeEvent.remainingParticipants}
              subtext="Expected at gate"
              icon={<Clock className="w-5 h-5" />}
              accentColor="amber"
            />
            <StatCard
              label="Turnout Percentage"
              value={`${activeEvent.attendancePercentage}%`}
              subtext="Automatic attendance ratio"
              icon={<TrendingUp className="w-5 h-5" />}
              accentColor="gold"
            />
          </div>
        </div>
      ) : (
        <div className="bg-[#11141c] border border-[#272d3f] rounded-2xl p-8 text-center shadow-lg">
          <Calendar className="w-12 h-12 text-[#e6be6d] mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No active event currently set</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Choose an event from your event list and activate it to enable real-time scanner validation and live portal stats.
          </p>
          <Link
            to="/admin/events"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#e6be6d] text-black hover:bg-[#eed08c] transition-all"
          >
            <span>Go to Events List</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Grid: Global Event Registry & Recent Live Check-ins */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* All Events Summary */}
        <div className="lg:col-span-2 bg-[#11141c] border border-[#272d3f] rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-[#272d3f] mb-4">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-[#00e5ff]" />
              <h3 className="text-base font-bold text-white">Events Registry ({events.length})</h3>
            </div>
            <Link
              to="/admin/events"
              className="text-xs font-bold text-[#00e5ff] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {events.slice(0, 4).map((evt) => (
              <div
                key={evt.id}
                className="bg-[#171b26] border border-[#272d3f] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-600 transition-all"
              >
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-white text-sm">{evt.name}</span>
                    {evt.status === 'active' ? (
                      <Badge variant="active">ACTIVE</Badge>
                    ) : (
                      <Badge variant="inactive">INACTIVE</Badge>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    📅{' '}
                    {new Date(evt.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Attendance</div>
                    <div className="text-sm font-bold text-white">
                      {evt.totalAttended} / {evt.totalParticipants} ({evt.attendancePercentage}%)
                    </div>
                  </div>
                  <Link
                    to={`/admin/events/${evt.id}`}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#1f2433] text-slate-300 hover:text-white hover:bg-[#272d3f] transition-all"
                  >
                    Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Check-Ins Activity */}
        <div className="bg-[#11141c] border border-[#272d3f] rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-[#272d3f] mb-4">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Recent Admittances</h3>
            </div>
            {activeEvent && (
              <Link
                to={`/admin/events/${activeEvent.id}/history`}
                className="text-xs font-bold text-slate-400 hover:text-[#00e5ff]"
              >
                Full Log
              </Link>
            )}
          </div>

          {recentScans.length > 0 ? (
            <div className="space-y-3">
              {recentScans.map((scan) => (
                <div
                  key={scan.id}
                  className="bg-[#171b26] border border-[#272d3f] rounded-xl p-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white truncate max-w-[150px]">{scan.name}</span>
                    <span className="text-[10px] text-emerald-400 font-semibold">
                      {new Date(scan.checkedInAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">{scan.email}</div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Audited by: <span className="text-slate-400">{scan.checkedInBy}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-500">
              No recent scans recorded for the active event yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
