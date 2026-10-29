import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiRequest } from '../../services/api';
import { History, ArrowLeft, CheckCircle2, UserCheck, Clock, RefreshCw } from 'lucide-react';

export const ScanHistory: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await apiRequest(`/attendance/event/${eventId}/history`);
      if (res.success) {
        setHistory(res.history);
      }
    } catch (err) {
      console.error('Error fetching scan history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [eventId]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Back button */}
      <div>
        <Link
          to={`/admin/events/${eventId}/attendance`}
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-[#00e5ff] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to 3-Column Attendance Table</span>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#272d3f]">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#e6be6d]">
            Security Audit Trail
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
            Gate Entry Scan History
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete chronological audit log of all admitted participants with server timestamps and volunteer identification.
          </p>
        </div>

        <button
          onClick={fetchHistory}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#171b26] border border-[#272d3f] text-slate-300 hover:text-[#00e5ff] self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Log</span>
        </button>
      </div>

      <div className="bg-[#11141c] border border-[#272d3f] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#171b26] border-b border-[#272d3f] text-slate-400 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3.5 px-4">Pass ID</th>
                <th className="py-3.5 px-4">Participant Name</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Admitted At</th>
                <th className="py-3.5 px-4">Volunteer Auditor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#272d3f]/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <div className="w-8 h-8 border-2 border-[#00e5ff] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading audit trail...
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No verified check-in scans recorded yet for this event.
                  </td>
                </tr>
              ) : (
                history.map((h) => (
                  <tr key={h.id} className="hover:bg-[#171b26]/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#e6be6d]">{h.registrationId}</td>
                    <td className="py-3.5 px-4 font-bold text-white">{h.name}</td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">{h.email}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(h.checkedInAt).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1.5 text-xs text-slate-300 bg-[#171b26] border border-[#272d3f] px-2.5 py-1 rounded-lg">
                        <UserCheck className="w-3.5 h-3.5 text-[#00e5ff]" />
                        <span>{h.checkedInBy || 'Volunteer'}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
