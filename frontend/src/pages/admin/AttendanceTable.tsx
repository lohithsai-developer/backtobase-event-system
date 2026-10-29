import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiRequest } from '../../services/api';
import {
  ClipboardCheck,
  Search,
  Filter,
  Download,
  ArrowLeft,
  RefreshCw,
  History,
} from 'lucide-react';

export const AttendanceTable: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();

  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '', 'Yes', 'No'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  const fetchAttendance = async () => {
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: '25',
        search,
        status: statusFilter,
      }).toString();

      const res = await apiRequest(`/attendance/event/${eventId}?${query}`);
      if (res.success) {
        setRecords(res.records);
        setTotalPages(res.pagination.totalPages);
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
    // 10s polling interval to keep attendance live
    const interval = setInterval(fetchAttendance, 10000);
    return () => clearInterval(interval);
  }, [eventId, page, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchAttendance();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Export CSV
  const handleExport = (format: 'csv' | 'xlsx') => {
    setIsExporting(true);
    const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
    const token = localStorage.getItem('btb_token') || '';
    const url = `${apiBase}/attendance/event/${eventId}/export?format=${format}`;

    // Download via fetch with Auth header
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `BacktoBase_Attendance.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch((err) => alert('Export failed: ' + err.message))
      .finally(() => setIsExporting(false));
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#272d3f]">
        <div>
          <Link
            to={`/admin/events/${eventId}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-[#00e5ff] mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Event Overview</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Event Attendance
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
              Live Polling Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Official 3-column verification view: Name, Email, Checked In (Yes/No).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to={`/admin/events/${eventId}/history`}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#171b26] text-slate-300 border border-[#272d3f] hover:text-white hover:border-[#00e5ff] transition-all"
          >
            <History className="w-4 h-4 text-[#00e5ff]" />
            <span>Audit Trail &amp; Timestamps</span>
          </Link>
          <button
            onClick={() => handleExport('csv')}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-emerald-500 hover:bg-emerald-600 text-black transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => handleExport('xlsx')}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#171b26] text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#11141c] border border-[#272d3f] rounded-2xl p-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 bg-[#171b26] border border-[#272d3f] rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#00e5ff]"
          />
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-[#171b26] border border-[#272d3f] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00e5ff]"
          >
            <option value="">All Registrations</option>
            <option value="Yes">Checked In (Yes)</option>
            <option value="No">Not Checked In (No)</option>
          </select>

          <button
            onClick={() => fetchAttendance()}
            title="Refresh Table"
            className="p-2 rounded-xl bg-[#171b26] border border-[#272d3f] text-slate-400 hover:text-[#00e5ff] transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Attendance Table (EXACTLY 3 VISIBLE COLUMNS: Name, Email, Checked In) */}
      <div className="bg-[#11141c] border border-[#272d3f] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#171b26] border-b border-[#272d3f] text-slate-400 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-4 px-6 w-1/3">Name</th>
                <th className="py-4 px-6 w-1/3">Email</th>
                <th className="py-4 px-6 w-1/3">Checked In</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#272d3f]/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-slate-500">
                    <div className="w-8 h-8 border-2 border-[#00e5ff] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading attendance entries...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-slate-500">
                    No matching attendance records found.
                  </td>
                </tr>
              ) : (
                records.map((r, i) => (
                  <tr key={i} className="hover:bg-[#171b26]/50 transition-colors">
                    <td className="py-4 px-6 font-bold text-white text-sm">{r.name}</td>
                    <td className="py-4 px-6 text-slate-400 font-mono text-xs">{r.email}</td>
                    <td className="py-4 px-6">
                      {r.checkedIn === 'Yes' ? (
                        <span className="inline-flex items-center gap-1.5 font-black text-emerald-400 text-sm">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span>Yes</span>
                        </span>
                      ) : (
                        <span className="font-semibold text-slate-500 text-sm">No</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-[#171b26] border-t border-[#272d3f] flex items-center justify-between text-xs text-slate-400">
          <div>
            Page <span className="text-white font-bold">{page}</span> of{' '}
            <span className="text-white font-bold">{totalPages}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 bg-[#11141c] border border-[#272d3f] rounded-lg disabled:opacity-40 hover:text-white"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 bg-[#11141c] border border-[#272d3f] rounded-lg disabled:opacity-40 hover:text-white"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
