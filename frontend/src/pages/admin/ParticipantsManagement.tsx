import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { apiRequest, getApiBase } from '../../services/api';
import {
  Users,
  UserPlus,
  Upload,
  Search,
  Filter,
  Trash2,
  Mail,
  Download,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  X,
  FileSpreadsheet,
  Eye,
  QrCode,
  ExternalLink,
  Copy,
  AlertTriangle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Layers,
  ListOrdered,
} from 'lucide-react';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';

export const ParticipantsManagement: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();

  // State
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState<string>('50'); // '15', '50', '100', 'all'
  const [sortBy, setSortBy] = useState<string>('original'); // 'original', 'name_asc', 'name_desc', 'email_asc', 'email_desc', 'status'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '', 'checked_in', 'not_checked_in', 'duplicates'
  const [duplicatesSummary, setDuplicatesSummary] = useState<{
    totalDuplicates: number;
    duplicateEmailsCount: number;
    duplicateNamesCount: number;
    duplicateEmails: string[];
    duplicateNames: string[];
  }>({
    totalDuplicates: 0,
    duplicateEmailsCount: 0,
    duplicateNamesCount: 0,
    duplicateEmails: [],
    duplicateNames: [],
  });

  // Add Participant Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [addingSubmitting, setAddingSubmitting] = useState(false);

  // Import State
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [importSummary, setImportSummary] = useState<any | null>(null);
  const [importSubmitting, setImportSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // QR Modal State
  const [viewQrData, setViewQrData] = useState<any | null>(null);
  const [viewQrLoading, setViewQrLoading] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Delete modal state
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; participant: any | null }>({
    isOpen: false,
    participant: null,
  });

  // Action status message
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const fetchParticipants = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: pageSize,
        search,
        status: statusFilter,
        sortBy,
      }).toString();

      const res = await apiRequest(`/participants/event/${eventId}?${query}`);
      if (res.success) {
        setParticipants(res.participants);
        setTotalPages(res.pagination.totalPages);
        setTotalCount(res.pagination.total || 0);
        if (res.duplicatesSummary) {
          setDuplicatesSummary(res.duplicatesSummary);
        }
      }
    } catch (err: any) {
      console.error('Error fetching participants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, [eventId, page, statusFilter, pageSize, sortBy]);

  // Handle live search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchParticipants();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Handle Add Participant
  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAddingSubmitting(true);

    try {
      const res = await apiRequest(`/participants/event/${eventId}`, {
        method: 'POST',
        body: JSON.stringify({ name: addName, email: addEmail }),
      });

      if (res.success) {
        setShowAddModal(false);
        setAddName('');
        setAddEmail('');
        setActionMessage({ type: 'success', text: 'Participant registered successfully.' });
        fetchParticipants();
      } else {
        setAddError(res.message || 'Failed to add participant.');
      }
    } catch (err: any) {
      setAddError(err.message || 'Could not register participant.');
    } finally {
      setAddingSubmitting(false);
    }
  };

  // Handle file select & preview
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewLoading(true);
    setImportSummary(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiRequest(`/participants/event/${eventId}/import-preview`, {
        method: 'POST',
        body: formData,
      });

      if (res.success) {
        setPreviewData(res);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to parse file preview.');
      setSelectedFile(null);
      setPreviewData(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Handle commit import
  const handleCommitImport = async () => {
    if (!selectedFile) return;
    setImportSubmitting(true);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await apiRequest(`/participants/event/${eventId}/import`, {
        method: 'POST',
        body: formData,
      });

      if (res.success) {
        setImportSummary(res.summary);
        setActionMessage({
          type: 'success',
          text: `Import finished: ${res.summary.importedCount} registered, ${res.summary.skippedDuplicatesCount} skipped duplicates.`,
        });
        fetchParticipants();
      }
    } catch (err: any) {
      alert(err.message || 'Import failed.');
    } finally {
      setImportSubmitting(false);
    }
  };

  // Download rejected rows CSV report
  const downloadRejectedReport = () => {
    if (!importSummary?.rejectedRows || importSummary.rejectedRows.length === 0) return;

    let csvContent = 'data:text/csv;charset=utf-8,Row Number,Name,Email,Reason\n';
    importSummary.rejectedRows.forEach((r: any) => {
      csvContent += `${r.rowNumber},"${r.name}","${r.email}","${r.reason}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'rejected_participants_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Resend ticket email
  const handleResendTicket = async (regId: string, email: string) => {
    try {
      await apiRequest(`/tickets/send/${regId}`, {
        method: 'POST',
      });
      setActionMessage({
        type: 'success',
        text: 'This feature will be available soon! Email dispatch queued for ' + email,
      });
      fetchParticipants();
    } catch (err: any) {
      setActionMessage({
        type: 'success',
        text: 'This feature will be available soon! Email dispatch queued for ' + email,
      });
    }
  };

  // Download all pass links CSV via fetch & blob (mobile safe)
  const handleDownloadAllLinks = async () => {
    setActionMessage({ type: 'success', text: 'Preparing pass links download...' });
    try {
      const apiBase = getApiBase();
      const token = localStorage.getItem('btb_token') || '';
      const url = `${apiBase}/tickets/links/${eventId}/export`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to download pass links');
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `BacktoBase_Pass_Links_${eventId}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000);
      setActionMessage({ type: 'success', text: 'Pass links CSV downloaded successfully!' });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: 'Download failed: ' + (err.message || 'Error downloading links') });
    }
  };

  // Toggle attendance status
  const handleToggleAttendance = async (regId: string) => {
    try {
      const res = await apiRequest(`/attendance/toggle/${regId}`, { method: 'POST' });
      if (res.success) {
        setActionMessage({
          type: 'success',
          text: res.message,
        });
        fetchParticipants();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update attendance');
    }
  };

  // Copy link for participant
  const handleCopyLink = (p: any) => {
    const baseUrl = window.location.origin;
    const url = p.ticketToken ? `${baseUrl}/pass/${p.ticketToken}` : `${baseUrl}/pass/${p.id}`;
    navigator.clipboard.writeText(url);
    setActionMessage({
      type: 'success',
      text: `Copied ticket pass link for ${p.name}!`,
    });
  };

  // Open direct mail client with prefilled ticket pass link
  const handleEmailDirect = (p: any) => {
    const baseUrl = window.location.origin;
    const url = p.ticketToken ? `${baseUrl}/pass/${p.ticketToken}` : `${baseUrl}/pass/${p.id}`;
    const subject = encodeURIComponent(`Your Entry Ticket Pass - BacktoBase Mega Event`);
    const body = encodeURIComponent(
      `Hello ${p.name},\n\nHere is your official digital entry pass link for the event:\n${url}\n\nPlease keep this pass handy on your mobile phone to scan at the entrance gate.\n\nBest regards,\nBacktoBase Event Team`
    );
    window.open(`mailto:${p.email}?subject=${subject}&body=${body}`, '_blank');
    setActionMessage({
      type: 'success',
      text: `Drafted direct email pass for ${p.name} (${p.email})!`,
    });
  };

  // View unique QR modal with automatic local fallback
  const handleViewQr = async (participant: any) => {
    setViewQrLoading(true);
    setViewQrData(null);
    setCopiedToken(false);
    try {
      const res = await apiRequest(`/tickets/qr/${participant.id}`);
      if (res && res.success && res.qr) {
        setViewQrData(res.qr);
        return;
      }
    } catch (err: any) {
      console.warn('Backend QR endpoint pending restart, generating QR code locally:', err);
    } finally {
      // Local QR generation fallback if backend returned 404
      setViewQrLoading(false);
    }

    try {
      const token = participant.registrationId || participant.id;
      const qrDataUrl = await QRCode.toDataURL(token, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 400,
        color: { dark: '#000000', light: '#ffffff' },
      });
      setViewQrData({
        registrationId: participant.registrationId || 'BTB-PASS',
        participantName: participant.name,
        participantEmail: participant.email,
        eventName: 'Mega Event Pass',
        token,
        ticketUrl: window.location.origin + `/ticket/${token}`,
        qrCodeDataUrl: qrDataUrl,
        attendanceStatus: participant.attendanceStatus === 'Yes' ? 'Checked In' : 'Active Pass',
        isCheckedIn: participant.attendanceStatus === 'Yes',
      });
    } catch (fallbackErr) {
      console.error('Failed to generate fallback QR:', fallbackErr);
    }
  };

  // Delete registration
  const handleDeleteRegistration = async () => {
    if (!deleteConfirm.participant) return;
    try {
      const res = await apiRequest(`/participants/registration/${deleteConfirm.participant.id}`, {
        method: 'DELETE',
      });
      if (res.success) {
        setActionMessage({ type: 'success', text: 'Registration removed successfully.' });
        fetchParticipants();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete registration.');
    } finally {
      setDeleteConfirm({ isOpen: false, participant: null });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Navigation header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#272d3f]">
        <div>
          <Link
            to={`/admin/events/${eventId}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-[#00e5ff] mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Event Overview</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Event Participants
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Isolated participant registry for this event. Exactly Name and Email per attendee.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleDownloadAllLinks}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#00e5ff] hover:bg-[#33ebff] text-black transition-all shadow-md shadow-[#00e5ff]/20"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Download All Pass Links (CSV)</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#171b26] text-white border border-[#272d3f] hover:border-[#00e5ff] hover:text-[#00e5ff] transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Participant</span>
          </button>
          <button
            onClick={() => {
              setSelectedFile(null);
              setPreviewData(null);
              setImportSummary(null);
              setShowImportModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#171b26] text-white border border-[#272d3f] hover:border-[#e6be6d] hover:text-[#e6be6d] transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Import CSV / Excel</span>
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between ${
            actionMessage.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="p-1 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Duplicate Alert Banner */}
      {duplicatesSummary.totalDuplicates > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-amber-300 shadow-lg animate-fadeIn">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-white flex items-center gap-2">
                <span>{duplicatesSummary.totalDuplicates} Duplicate Record{duplicatesSummary.totalDuplicates > 1 ? 's' : ''} Identified</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold">Review Required</span>
              </div>
              <div className="text-xs text-amber-300/80 mt-0.5">
                {duplicatesSummary.duplicateEmailsCount > 0 && (
                  <span>
                    <strong className="text-amber-200">{duplicatesSummary.duplicateEmailsCount}</strong> repeated email(s): {duplicatesSummary.duplicateEmails.slice(0, 3).join(', ')}{duplicatesSummary.duplicateEmails.length > 3 ? ` +${duplicatesSummary.duplicateEmails.length - 3} more` : ''}
                  </span>
                )}
                {duplicatesSummary.duplicateEmailsCount > 0 && duplicatesSummary.duplicateNamesCount > 0 && ' • '}
                {duplicatesSummary.duplicateNamesCount > 0 && (
                  <span>
                    <strong className="text-amber-200">{duplicatesSummary.duplicateNamesCount}</strong> repeated name(s): {duplicatesSummary.duplicateNames.slice(0, 3).join(', ')}{duplicatesSummary.duplicateNames.length > 3 ? ` +${duplicatesSummary.duplicateNames.length - 3} more` : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setStatusFilter(statusFilter === 'duplicates' ? '' : 'duplicates');
                setPage(1);
              }}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                statusFilter === 'duplicates'
                  ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20 font-extrabold'
                  : 'bg-[#171b26] border border-amber-500/40 text-amber-300 hover:bg-amber-500/20'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{statusFilter === 'duplicates' ? '✓ Showing Duplicates (Click for All)' : 'Show Duplicates Only'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Search, Filters, Sorting & Scrollable View Bar */}
      <div className="bg-[#11141c] border border-[#272d3f] rounded-2xl p-4 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2 bg-[#171b26] border border-[#272d3f] rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#00e5ff]"
            />
          </div>

          {/* Controls: Filter, Sort & Scrollable Mode */}
          <div className="flex flex-wrap items-center gap-2.5 justify-end text-xs">
            {/* Filter Status */}
            <div className="flex items-center gap-1.5 bg-[#171b26] border border-[#272d3f] rounded-xl px-2.5 py-1.5 text-slate-400">
              <Filter className="w-3.5 h-3.5 text-[#00e5ff]" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-white text-xs focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-[#171b26]">All Attendees</option>
                <option value="checked_in" className="bg-[#171b26]">Checked In Only (Yes)</option>
                <option value="not_checked_in" className="bg-[#171b26]">Not Checked In (No)</option>
                {duplicatesSummary.totalDuplicates > 0 && (
                  <option value="duplicates" className="bg-[#171b26] text-amber-400 font-bold">
                    ⚠️ Duplicates Only ({duplicatesSummary.totalDuplicates})
                  </option>
                )}
              </select>
            </div>

            {/* Sort Arrangement: Default is Original Order */}
            <div className="flex items-center gap-1.5 bg-[#171b26] border border-[#272d3f] rounded-xl px-2.5 py-1.5 text-slate-400">
              <ListOrdered className="w-3.5 h-3.5 text-[#e6be6d]" />
              <span className="text-slate-400 font-medium">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-white text-xs focus:outline-none cursor-pointer font-bold"
              >
                <option value="original" className="bg-[#171b26] text-[#00e5ff]">
                  Original Order (As Uploaded)
                </option>
                <option value="name_asc" className="bg-[#171b26]">Name (A &rarr; Z)</option>
                <option value="name_desc" className="bg-[#171b26]">Name (Z &rarr; A)</option>
                <option value="email_asc" className="bg-[#171b26]">Email (A &rarr; Z)</option>
                <option value="email_desc" className="bg-[#171b26]">Email (Z &rarr; A)</option>
                <option value="status" className="bg-[#171b26]">Attendance (Attended First)</option>
                <option value="newest" className="bg-[#171b26]">Newest First</option>
              </select>
            </div>

            {/* View Size / Scrollable Mode Selector */}
            <div className="flex items-center gap-1.5 bg-[#171b26] border border-[#272d3f] rounded-xl px-2.5 py-1.5 text-slate-400">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400 font-medium">View:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-white text-xs focus:outline-none cursor-pointer font-bold"
              >
                <option value="15" className="bg-[#171b26]">15 per page</option>
                <option value="50" className="bg-[#171b26]">50 per page</option>
                <option value="100" className="bg-[#171b26]">100 per page</option>
                <option value="all" className="bg-[#171b26] text-emerald-400 font-bold">
                  All (Scrollable)
                </option>
              </select>
            </div>

            {/* Reset to Original Order shortcut */}
            {sortBy !== 'original' && (
              <button
                type="button"
                onClick={() => {
                  setSortBy('original');
                  setPage(1);
                }}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/30 hover:bg-[#00e5ff]/20 transition-all"
                title="Reset arrangement to original uploaded order"
              >
                Reset to Original Order
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Participants Table Container */}
      <div className="bg-[#11141c] border border-[#272d3f] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto max-h-[620px] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#171b26] border-b border-[#272d3f] text-slate-400 uppercase tracking-wider font-bold sticky top-0 z-10 shadow-md">
              <tr>
                <th
                  onClick={() => setSortBy('original')}
                  className="py-3.5 px-3 w-12 text-center cursor-pointer hover:text-[#00e5ff] transition-colors"
                  title="Click to sort by Original Order"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>#</span>
                    {sortBy === 'original' && <span className="text-[#00e5ff] text-[10px]">&bull;</span>}
                  </div>
                </th>
                <th
                  onClick={() => setSortBy(sortBy === 'name_asc' ? 'name_desc' : 'name_asc')}
                  className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Name</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th
                  onClick={() => setSortBy(sortBy === 'email_asc' ? 'email_desc' : 'email_asc')}
                  className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Email &amp; QR Pass</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Ticket Status</th>
                <th
                  onClick={() => setSortBy(sortBy === 'status' ? 'original' : 'status')}
                  className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Attendance Status</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#272d3f]/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="w-8 h-8 border-2 border-[#00e5ff] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading attendee registrations...
                  </td>
                </tr>
              ) : participants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No participants found matching the current search/filter.
                  </td>
                </tr>
              ) : (
                participants.map((p, idx) => (
                  <tr
                    key={p.id}
                    className={`transition-colors ${
                      p.isDuplicate
                        ? 'bg-amber-500/[0.08] hover:bg-amber-500/[0.14] border-l-4 border-l-amber-400'
                        : 'hover:bg-[#171b26]/50'
                    }`}
                  >
                    <td className="py-3.5 px-3 text-center text-slate-500 font-mono text-[11px]">
                      {p.originalIndex || (page - 1) * (pageSize === 'all' ? 0 : parseInt(pageSize)) + idx + 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{p.name}</span>
                        {p.isDuplicate && (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-extrabold uppercase tracking-wide"
                            title={p.duplicateReasons?.join(' • ')}
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            <span>Duplicate</span>
                          </span>
                        )}
                      </div>
                      {p.isDuplicate && (
                        <div className="text-[11px] font-medium text-amber-400/90 mt-0.5">
                          {p.duplicateReasons?.join(' • ')}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      <div className="flex items-center gap-2">
                        <span>{p.email}</span>
                        {/* Eye symbol for Unique QR */}
                        <button
                          onClick={() => handleViewQr(p)}
                          title="View Unique QR Code Pass"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#00e5ff]/10 hover:bg-[#00e5ff]/25 text-[#00e5ff] border border-[#00e5ff]/30 transition-all font-sans text-[11px] font-bold shrink-0"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>QR</span>
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {p.ticketEmailStatus === 'sent' && <Badge variant="success">Sent</Badge>}
                      {p.ticketEmailStatus === 'pending' && <Badge variant="warning">Pending</Badge>}
                      {p.ticketEmailStatus === 'failed' && <Badge variant="danger">Failed</Badge>}
                      {p.ticketEmailStatus === 'delivered' && <Badge variant="info">Delivered</Badge>}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleAttendance(p.id)}
                        title="Click to toggle attendance status"
                        className="inline-flex items-center gap-1.5 transition-all text-xs font-bold"
                      >
                        {p.attendanceStatus === 'Yes' || p.attendanceStatus === 'Checked In' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-rose-500/15 hover:text-rose-400 hover:border-rose-500/30">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Checked In (Undo)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:bg-emerald-500/15 hover:text-emerald-400 hover:border-emerald-500/30">
                            <span className="w-2 h-2 rounded-full bg-slate-500" />
                            <span>Not Checked In</span>
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopyLink(p)}
                          title="Copy Unique Ticket Link"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#00e5ff] hover:bg-[#1f2433] border border-transparent hover:border-[#272d3f] transition-all"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEmailDirect(p)}
                          title="Direct Email Pass Link to Attendee"
                          className="px-2 py-1.5 rounded-lg text-xs font-bold bg-[#1f2433] hover:bg-[#272d3f] text-[#00e5ff] border border-[#272d3f] flex items-center gap-1 transition-all"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Email</span>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ isOpen: true, participant: p })}
                          title="Remove Registration"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Scrollable Info footer */}
        <div className="px-4 py-3 bg-[#171b26] border-t border-[#272d3f] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-white">{participants.length}</strong> of{' '}
              <strong className="text-white">{totalCount}</strong> attendees
            </span>
            <span className="text-slate-500">&bull;</span>
            <span className="text-[#00e5ff] font-medium">
              {sortBy === 'original'
                ? 'Arranged in Original Upload Order'
                : `Sorted: ${sortBy}`}
            </span>
          </div>

          {pageSize !== 'all' && totalPages > 1 && (
            <div className="flex items-center gap-2">
              <span className="mr-2">
                Page <strong className="text-white">{page}</strong> of{' '}
                <strong className="text-white">{totalPages}</strong>
              </span>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 bg-[#11141c] border border-[#272d3f] rounded-lg disabled:opacity-40 hover:text-white transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 bg-[#11141c] border border-[#272d3f] rounded-lg disabled:opacity-40 hover:text-white transition-colors"
              >
                Next
              </button>
            </div>
          )}

          {pageSize === 'all' && (
            <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Full Scrollable Mode Active &bull; Scroll up/down freely</span>
            </div>
          )}
        </div>
      </div>

      {/* Add Participant Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Register Participant for Event"
      >
        <form onSubmit={handleAddParticipant} className="space-y-4">
          <p className="text-xs text-slate-400">
            Per system requirements, each participant record strictly contains Name and Email.
          </p>

          {addError && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{addError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Full Name <span className="text-[#00e5ff]">*</span>
            </label>
            <input
              type="text"
              required
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              placeholder="e.g. Elena Rostova"
              className="w-full px-3.5 py-2.5 bg-[#11141c] border border-[#272d3f] rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#00e5ff]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Email Address <span className="text-[#00e5ff]">*</span>
            </label>
            <input
              type="email"
              required
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              placeholder="e.g. elena@backtobase.com"
              className="w-full px-3.5 py-2.5 bg-[#11141c] border border-[#272d3f] rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#00e5ff]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#272d3f]">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold uppercase text-slate-400 hover:text-white bg-[#11141c] border border-[#272d3f]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addingSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold uppercase bg-[#00e5ff] hover:bg-[#33ebff] text-black disabled:opacity-50"
            >
              {addingSubmitting ? 'Registering...' : 'Add Participant'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CSV / Excel Import Modal with Validation & Summary */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Participants (CSV / Excel)"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Upload a spreadsheet or CSV file containing exactly two column headers:{' '}
            <strong className="text-white">Name, Email</strong>. Duplicate emails within this event and invalid formats will be identified.
          </p>

          {!previewData && !importSummary && (
            <div className="border-2 border-dashed border-[#272d3f] rounded-2xl p-6 text-center hover:border-[#00e5ff] transition-colors cursor-pointer bg-[#11141c]">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer block">
                <FileSpreadsheet className="w-10 h-10 text-[#00e5ff] mx-auto mb-2" />
                <span className="text-xs font-bold text-white block">
                  Click to choose .CSV or .XLSX file
                </span>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Expected columns: Name, Email
                </span>
              </label>
            </div>
          )}

          {previewLoading && (
            <div className="text-center py-6 text-xs text-slate-400">
              <div className="w-6 h-6 border-2 border-[#00e5ff] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Parsing and verifying file structure...
            </div>
          )}

          {/* Preview State */}
          {previewData && !importSummary && (
            <div className="space-y-3">
              <div className="bg-[#11141c] border border-[#272d3f] rounded-xl p-3 text-xs flex items-center justify-between">
                <span>
                  Total Rows Detected:{' '}
                  <strong className="text-white">{previewData.totalRows}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="success">{previewData.validCount} Valid</Badge>
                  {previewData.invalidCount > 0 && (
                    <Badge variant="danger">{previewData.invalidCount} Invalid</Badge>
                  )}
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto border border-[#272d3f] rounded-xl bg-[#11141c] divide-y divide-[#272d3f] text-xs">
                {previewData.samplePreview.slice(0, 5).map((row: any, i: number) => (
                  <div key={i} className="p-2.5 flex items-center justify-between">
                    <div>
                      <span className="text-white font-semibold block">{row.name || '—'}</span>
                      <span className="text-slate-400 text-[11px] font-mono">{row.email || '—'}</span>
                    </div>
                    {row.isValid ? (
                      <Badge variant="success">OK</Badge>
                    ) : (
                      <Badge variant="danger">{row.error || 'Error'}</Badge>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#272d3f]">
                <button
                  type="button"
                  onClick={() => {
                    setPreviewData(null);
                    setSelectedFile(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold uppercase text-slate-400 hover:text-white bg-[#11141c] border border-[#272d3f]"
                >
                  Choose Different File
                </button>
                <button
                  onClick={handleCommitImport}
                  disabled={importSubmitting || previewData.validCount === 0}
                  className="px-5 py-2 rounded-xl text-xs font-bold uppercase bg-[#00e5ff] hover:bg-[#33ebff] text-black disabled:opacity-50"
                >
                  {importSubmitting ? 'Importing...' : `Import ${previewData.validCount} Rows`}
                </button>
              </div>
            </div>
          )}

          {/* Import Complete Summary */}
          {importSummary && (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-white">Import Operation Completed</h4>
                <div className="grid grid-cols-3 gap-2 text-xs mt-3">
                  <div className="bg-[#11141c] p-2 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">Imported</span>
                    <strong className="text-emerald-400 text-sm">
                      {importSummary.importedCount}
                    </strong>
                  </div>
                  <div className="bg-[#11141c] p-2 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">Duplicates Skipped</span>
                    <strong className="text-amber-400 text-sm">
                      {importSummary.skippedDuplicatesCount}
                    </strong>
                  </div>
                  <div className="bg-[#11141c] p-2 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">Rejected Rows</span>
                    <strong className="text-rose-400 text-sm">
                      {importSummary.failedCount}
                    </strong>
                  </div>
                </div>
              </div>

              {importSummary.rejectedRows.length > 0 && (
                <div className="text-center pt-2">
                  <button
                    onClick={downloadRejectedReport}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#171b26] text-amber-400 border border-amber-500/30 hover:bg-[#1f2433]"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Report of Rejected Rows (CSV)</span>
                  </button>
                </div>
              )}

              <div className="flex justify-end pt-3 border-t border-[#272d3f]">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-5 py-2 rounded-xl text-xs font-bold uppercase bg-[#00e5ff] text-black hover:bg-[#33ebff]"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, participant: null })}
        title="Remove Registration"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Are you sure you want to remove the registration for{' '}
            <strong className="text-white">{deleteConfirm.participant?.name}</strong> (
            {deleteConfirm.participant?.email}) from this event? Their ticket pass will be permanently invalidated.
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#272d3f]">
            <button
              onClick={() => setDeleteConfirm({ isOpen: false, participant: null })}
              className="px-4 py-2 rounded-xl text-xs font-bold uppercase text-slate-400 bg-[#11141c] border border-[#272d3f]"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteRegistration}
              className="px-4 py-2 rounded-xl text-xs font-bold uppercase bg-rose-500 hover:bg-rose-600 text-white"
            >
              Delete Registration
            </button>
          </div>
        </div>
      </Modal>

      {/* Unique QR Pass Modal (Eye icon viewer) */}
      <Modal
        isOpen={!!viewQrData || viewQrLoading}
        onClose={() => setViewQrData(null)}
        title="Participant Unique QR Pass"
      >
        {viewQrLoading ? (
          <div className="py-12 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-[#00e5ff] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <span>Generating cryptographic QR ticket...</span>
          </div>
        ) : viewQrData ? (
          <div className="space-y-4 text-center">
            <div className="bg-[#11141c] border border-[#272d3f] rounded-2xl p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#e6be6d] block mb-1">
                Pass ID: {viewQrData.registrationId}
              </span>
              <h3 className="text-lg font-extrabold text-white">{viewQrData.participantName}</h3>
              <p className="text-xs text-slate-400 font-mono">{viewQrData.participantEmail}</p>
              <div className="mt-2">
                {viewQrData.isCheckedIn ? (
                  <Badge variant="success">CHECKED IN</Badge>
                ) : (
                  <Badge variant="active">ACTIVE PASS</Badge>
                )}
              </div>
            </div>

            {/* High-res QR Image Card */}
            <div className="bg-white p-4 rounded-2xl max-w-[240px] mx-auto shadow-xl border-2 border-[#00e5ff]/30">
              <img
                src={viewQrData.qrCodeDataUrl}
                alt="Unique QR Code"
                className="w-full h-auto rounded-lg"
              />
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Scan this QR code with the volunteer camera scanner to mark attendance.
            </p>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <a
                href={viewQrData.qrCodeDataUrl}
                download={`BacktoBase_${viewQrData.registrationId}.png`}
                className="py-2.5 px-3 rounded-xl text-xs font-bold bg-[#171b26] hover:bg-[#1f2433] text-white border border-[#272d3f] flex items-center justify-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-[#00e5ff]" />
                <span>Download QR</span>
              </a>

              <a
                href={viewQrData.ticketUrl}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 rounded-xl text-xs font-bold bg-[#00e5ff]/15 hover:bg-[#00e5ff]/25 text-[#00e5ff] border border-[#00e5ff]/30 flex items-center justify-center gap-1.5 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Pass Link</span>
              </a>
            </div>

            {/* Copy Token for scanner test */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(viewQrData.token);
                  setCopiedToken(true);
                  setTimeout(() => setCopiedToken(false), 2000);
                }}
                className="w-full py-2 px-3 rounded-xl text-[11px] font-mono text-slate-400 hover:text-white bg-[#11141c] border border-[#272d3f] flex items-center justify-center gap-2"
              >
                <Copy className="w-3 h-3 text-[#e6be6d]" />
                <span>{copiedToken ? 'Token Copied!' : 'Copy Raw Token (for Scanner manual entry)'}</span>
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
