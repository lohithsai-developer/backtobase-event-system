import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../../services/api';
import {
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  Ticket,
  ClipboardCheck,
  History,
  Power,
  ArrowLeft,
  Mail,
  UserPlus,
  TrendingUp,
  Edit3,
} from 'lucide-react';
import { StatCard } from '../../components/StatCard';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';

export const EventDetails: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);

  // Edit details modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const navigate = useNavigate();

  const loadEvent = async () => {
    try {
      const data = await apiRequest(`/events/${eventId}`);
      if (data.success) {
        setEvent(data.event);
      }
    } catch (err) {
      console.error('Error fetching event details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const handleToggleStatus = async () => {
    if (!event) return;
    setStatusLoading(true);
    try {
      const targetStatus = event.status === 'active' ? 'inactive' : 'active';
      const res = await apiRequest(`/events/${event.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ targetStatus }),
      });
      if (res.success) {
        await loadEvent();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to toggle event status');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleOpenEdit = () => {
    if (!event) return;
    setEditName(event.name || '');
    setEditDescription(event.description || '');
    const d = new Date(event.date);
    const dateStr = !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : '';
    setEditDate(dateStr);
    setEditError(null);
    setEditModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editDescription.trim() || !editDate) {
      setEditError('Please fill in all fields (name, description, and date).');
      return;
    }
    setEditSaving(true);
    setEditError(null);
    try {
      const res = await apiRequest(`/events/${event.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim(),
          date: editDate,
        }),
      });
      if (res.success) {
        setEvent((prev: any) => ({
          ...prev,
          name: editName.trim(),
          description: editDescription.trim(),
          date: editDate,
        }));
        setEditModalOpen(false);
      } else {
        setEditError(res.message || 'Failed to update event.');
      }
    } catch (err: any) {
      setEditError(err.message || 'Failed to update event details.');
    } finally {
      setEditSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="w-10 h-10 border-4 border-[#00e5ff] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="font-semibold text-sm">Loading event details...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="py-12 text-center text-slate-400">
        <p className="font-bold">Event not found.</p>
        <Link to="/admin/events" className="text-[#00e5ff] text-xs underline mt-2 inline-block">
          Return to Events
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Back button */}
      <div>
        <Link
          to="/admin/events"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-[#00e5ff] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Events</span>
        </Link>
      </div>

      {/* Main Event Header Card */}
      <div className="bg-[#11141c] border border-[#272d3f] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#272d3f]">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#e6be6d]">
                Event Management Console
              </span>
              {event.status === 'active' ? (
                <Badge variant="active">LIVE GLOBALLY</Badge>
              ) : (
                <Badge variant="inactive">INACTIVE</Badge>
              )}
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">{event.name}</h1>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">{event.description}</p>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#00e5ff] pt-1">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date(event.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Controls: Edit Details & Activation */}
          <div className="shrink-0 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleOpenEdit}
              className="flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#171b26] hover:bg-[#202636] text-white border border-[#272d3f] hover:border-[#00e5ff] hover:text-[#00e5ff] transition-all shadow-md active:scale-95"
              title="Edit event name, description, and date"
            >
              <Edit3 className="w-4 h-4 text-[#00e5ff]" />
              <span>Edit Details</span>
            </button>

            <button
              onClick={handleToggleStatus}
              disabled={statusLoading}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg ${
                event.status === 'active'
                  ? 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/30 shadow-amber-500/10'
                  : 'bg-[#00e5ff] hover:bg-[#33ebff] text-black shadow-[#00e5ff]/20'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{event.status === 'active' ? 'Deactivate Live Status' : 'Activate Live Event'}</span>
            </button>
          </div>
        </div>

        {/* Automatic Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <StatCard
            label="Total Registrations"
            value={event.totalParticipants}
            subtext="Enrolled passes"
            icon={<Users className="w-5 h-5" />}
            accentColor="turquoise"
          />
          <StatCard
            label="Total Attended"
            value={event.totalAttended}
            subtext="Confirmed check-ins"
            icon={<CheckCircle2 className="w-5 h-5" />}
            accentColor="green"
          />
          <StatCard
            label="Remaining Passes"
            value={event.remainingParticipants}
            subtext="Pending gate arrival"
            icon={<Clock className="w-5 h-5" />}
            accentColor="amber"
          />
          <StatCard
            label="Turnout Rate"
            value={`${event.attendancePercentage}%`}
            subtext="Automatic attendance ratio"
            icon={<TrendingUp className="w-5 h-5" />}
            accentColor="gold"
          />
        </div>
      </div>

      {/* Feature Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Participants Management */}
        <Link
          to={`/admin/events/${event.id}/participants`}
          className="bg-[#11141c] border border-[#272d3f] hover:border-[#00e5ff] rounded-2xl p-6 shadow-xl transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-[#00e5ff]/10 text-[#00e5ff] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Participants Registry</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Add individual attendees, import bulk CSV/Excel registrations with validation, preview, and rejected row reporting.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#00e5ff]">
            <span>Manage Registrations ({event.totalParticipants})</span>
            <span>&rarr;</span>
          </div>
        </Link>

        {/* QR Tickets & Email */}
        <Link
          to={`/admin/events/${event.id}/tickets`}
          className="bg-[#11141c] border border-[#272d3f] hover:border-[#e6be6d] rounded-2xl p-6 shadow-xl transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-[#e6be6d]/10 text-[#e6be6d] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Tickets &amp; Email Dispatch</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Send high-fidelity branded QR email passes, dispatch bulk batches, track delivery statuses, and reissue tickets with token revocation.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#e6be6d]">
            <span>Dispatch &amp; Reissue QR Passes</span>
            <span>&rarr;</span>
          </div>
        </Link>

        {/* Attendance (3-Column Specification) */}
        <Link
          to={`/admin/events/${event.id}/attendance`}
          className="bg-[#11141c] border border-[#272d3f] hover:border-emerald-500 rounded-2xl p-6 shadow-xl transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Attendance Verification</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Review the official 3-column attendance table (Name, Email, Checked In), live search and filters, and export to CSV or Excel.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
            <span>View &amp; Export Attendance</span>
            <span>&rarr;</span>
          </div>
        </Link>
      </div>

      {/* Edit Event Details Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Event Details"
      >
        <form onSubmit={handleSaveEvent} className="space-y-4">
          {editError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs">
              {editError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Event Name
            </label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full bg-[#11141c] border border-[#272d3f] focus:border-[#00e5ff] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
              placeholder="e.g. BacktoBase Legends Upgrade 2026"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Event Description
            </label>
            <textarea
              required
              rows={4}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full bg-[#11141c] border border-[#272d3f] focus:border-[#00e5ff] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors resize-none"
              placeholder="Provide a detailed description of the event..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Event Date
            </label>
            <input
              type="date"
              required
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              className="w-full bg-[#11141c] border border-[#272d3f] focus:border-[#00e5ff] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#272d3f]">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-[#1f2433] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-black bg-[#00e5ff] hover:bg-[#33ebff] transition-all shadow-md shadow-[#00e5ff]/20 disabled:opacity-50"
            >
              {editSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
