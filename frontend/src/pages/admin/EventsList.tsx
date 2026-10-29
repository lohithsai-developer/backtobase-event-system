import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../services/api';
import {
  Calendar,
  PlusCircle,
  Search,
  CheckCircle2,
  Power,
  Edit2,
  Trash2,
  Users,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';

export const EventsList: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Activation confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    event: any | null;
    action: 'activate' | 'deactivate' | 'delete' | null;
  }>({
    isOpen: false,
    event: null,
    action: null,
  });

  const loadEvents = async () => {
    try {
      const data = await apiRequest('/events');
      if (data.success) {
        setEvents(data.events);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleToggleStatus = async (eventId: string, currentStatus: string) => {
    setActionLoading(eventId);
    try {
      const targetStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const res = await apiRequest(`/events/${eventId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ targetStatus }),
      });
      if (res.success) {
        await loadEvents();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to toggle event status');
    } finally {
      setActionLoading(null);
      setConfirmModal({ isOpen: false, event: null, action: null });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    setActionLoading(eventId);
    try {
      const res = await apiRequest(`/events/${eventId}`, {
        method: 'DELETE',
      });
      if (res.success) {
        await loadEvents();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete event');
    } finally {
      setActionLoading(null);
      setConfirmModal({ isOpen: false, event: null, action: null });
    }
  };

  const filteredEvents = events.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#272d3f]">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#e6be6d]">
            Event Directory
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
            Mega Events Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage multi-city events, activate the global live gate, and monitor registrations.
          </p>
        </div>

        <Link
          to="/admin/events/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#00e5ff] text-black hover:bg-[#33ebff] transition-all shadow-md shadow-[#00e5ff]/20 shrink-0 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Event</span>
        </Link>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search events by title or description..."
          className="w-full pl-10 pr-4 py-2.5 bg-[#11141c] border border-[#272d3f] rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#00e5ff]"
        />
      </div>

      {/* Events Grid / Cards */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="w-10 h-10 border-4 border-[#00e5ff] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="font-semibold text-sm">Loading events catalog...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-[#11141c] border border-[#272d3f] rounded-2xl p-12 text-center max-w-xl mx-auto shadow-xl">
          <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No events found</h3>
          <p className="text-xs text-slate-400 mb-6">
            {search ? 'Try refining your search keyword.' : 'Get started by creating your first mega event.'}
          </p>
          <Link
            to="/admin/events/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#00e5ff] text-black hover:bg-[#33ebff] transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create First Event</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className={`bg-[#11141c] border rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all duration-200 hover:shadow-2xl ${
                event.status === 'active'
                  ? 'border-[#00e5ff]/60 ring-1 ring-[#00e5ff]/30'
                  : 'border-[#272d3f] hover:border-slate-600'
              }`}
            >
              <div>
                {/* Status & Date */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-[#e6be6d]" />
                    <span>
                      {new Date(event.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  {event.status === 'active' ? (
                    <Badge variant="active">ACTIVE GLOBALLY</Badge>
                  ) : (
                    <Badge variant="inactive">INACTIVE</Badge>
                  )}
                </div>

                {/* Event Name & Description */}
                <h3 className="text-lg font-bold text-white tracking-tight line-clamp-1 mb-2">
                  {event.name}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-6">
                  {event.description}
                </p>
              </div>

              <div>
                {/* Automatic Stats bar */}
                <div className="bg-[#171b26] border border-[#272d3f] rounded-xl p-3.5 mb-5 grid grid-cols-2 gap-2 text-center">
                  <div className="border-r border-[#272d3f] pr-2">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Participants</div>
                    <div className="text-lg font-extrabold text-white mt-0.5">
                      {event.totalParticipants}
                    </div>
                  </div>
                  <div className="pl-2">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Attended</div>
                    <div className="text-lg font-extrabold text-emerald-400 mt-0.5">
                      {event.totalAttended}{' '}
                      <span className="text-xs font-normal text-slate-400">
                        ({event.attendancePercentage}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/admin/events/${event.id}`}
                      className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-[#1f2433] hover:bg-[#272d3f] text-white flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#00e5ff]" />
                      <span>View Details</span>
                    </Link>

                    <button
                      onClick={() =>
                        setConfirmModal({
                          isOpen: true,
                          event,
                          action: event.status === 'active' ? 'deactivate' : 'activate',
                        })
                      }
                      disabled={actionLoading === event.id}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        event.status === 'active'
                          ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30'
                          : 'bg-[#00e5ff]/15 text-[#00e5ff] hover:bg-[#00e5ff]/25 border border-[#00e5ff]/30'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{event.status === 'active' ? 'Deactivate' : 'Activate Live'}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#272d3f]/60 text-xs">
                    <button
                      onClick={() =>
                        setConfirmModal({
                          isOpen: true,
                          event,
                          action: 'delete',
                        })
                      }
                      className="text-slate-500 hover:text-rose-400 flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, event: null, action: null })}
        title={
          confirmModal.action === 'activate'
            ? 'Activate Mega Event Globally?'
            : confirmModal.action === 'deactivate'
            ? 'Deactivate Event?'
            : 'Delete Event Permanently?'
        }
      >
        <div className="space-y-4">
          {confirmModal.action === 'activate' && (
            <p className="text-xs text-slate-300 leading-relaxed">
              Activating <strong className="text-white">"{confirmModal.event?.name}"</strong> will immediately set it as the sole active event across the public portal and volunteer QR scanner. Any currently active event will become inactive automatically. Previous registrations and attendance will remain safely preserved.
            </p>
          )}

          {confirmModal.action === 'deactivate' && (
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to deactivate <strong className="text-white">"{confirmModal.event?.name}"</strong>? The volunteer scanner and public portal will show "No active event at the moment" until another event is activated.
            </p>
          )}

          {confirmModal.action === 'delete' && (
            <p className="text-xs text-rose-300 leading-relaxed">
              This will permanently delete the event <strong className="text-white">"{confirmModal.event?.name}"</strong> and all its associated registration passes. This action cannot be undone.
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#272d3f]">
            <button
              onClick={() => setConfirmModal({ isOpen: false, event: null, action: null })}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-[#171b26] border border-[#272d3f]"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (confirmModal.action === 'delete') {
                  handleDeleteEvent(confirmModal.event?.id);
                } else {
                  handleToggleStatus(confirmModal.event?.id, confirmModal.event?.status);
                }
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider ${
                confirmModal.action === 'delete'
                  ? 'bg-rose-500 hover:bg-rose-600 text-white'
                  : 'bg-[#00e5ff] hover:bg-[#33ebff] text-black'
              }`}
            >
              Confirm
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
