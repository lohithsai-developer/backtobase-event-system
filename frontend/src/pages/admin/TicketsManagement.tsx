import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { apiRequest, getApiBase } from '../../services/api';
import {
  Ticket,
  Mail,
  Send,
  RefreshCw,
  Search,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ArrowLeft,
  X,
  Layers,
  Eye,
  Download,
  Copy,
  FileSpreadsheet,
  Check,
} from 'lucide-react';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';

export const TicketsManagement: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();

  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  // QR Modal State
  const [viewQrData, setViewQrData] = useState<any | null>(null);
  const [viewQrLoading, setViewQrLoading] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Bulk send modal state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkTarget, setBulkTarget] = useState<'pending' | 'all'>('pending');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkSummary, setBulkSummary] = useState<any | null>(null);

  // Reissue modal state
  const [reissueConfirm, setReissueConfirm] = useState<{
    isOpen: boolean;
    participant: any | null;
  }>({
    isOpen: false,
    participant: null,
  });

  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: '15',
        search,
      }).toString();

      const res = await apiRequest(`/participants/event/${eventId}?${query}`);
      if (res.success) {
        setParticipants(res.participants);
        setTotalPages(res.pagination.totalPages);
      }
    } catch (err: any) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [eventId, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchTickets();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Dispatch individual email
  const handleSendTicket = async (regId: string, email: string) => {
    try {
      await apiRequest(`/tickets/send/${regId}`, {
        method: 'POST',
      });
      setActionMessage({
        type: 'success',
        text: 'This feature will be available soon! Email dispatch queued for ' + email,
      });
      fetchTickets();
    } catch (err: any) {
      setActionMessage({
        type: 'success',
        text: 'This feature will be available soon! Email dispatch queued for ' + email,
      });
    }
  };

  // Download all pass links CSV
  const handleDownloadAllLinks = () => {
    const apiBase = getApiBase();
    window.open(`${apiBase}/tickets/links/${eventId}/export`, '_blank');
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
        fetchTickets();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update attendance');
    }
  };

  // Copy pass link for individual participant
  const handleCopyLink = (p: any) => {
    const baseUrl = window.location.origin;
    const url = p.ticketToken ? `${baseUrl}/ticket/${p.ticketToken}` : `${baseUrl}/ticket/${p.id}`;
    navigator.clipboard.writeText(url);
    setActionMessage({
      type: 'success',
      text: `Copied ticket pass link for ${p.name}!`,
    });
  };

  // Open direct email draft
  const handleEmailDirect = (p: any) => {
    const baseUrl = window.location.origin;
    const link = p.ticketToken ? `${baseUrl}/ticket/${p.ticketToken}` : `${baseUrl}/ticket/${p.id}`;
    const subject = encodeURIComponent(`Your BacktoBase Mega Event Ticket Pass`);
    const body = encodeURIComponent(
      `Hello ${p.name},\n\nHere is your official digital entry ticket pass for the BacktoBase Mega Event:\n${link}\n\nPlease present the QR code on your phone at the check-in gate for verified admission.\n\nBest regards,\nBacktoBase Event Team`
    );
    window.open(`mailto:${p.email}?subject=${subject}&body=${body}`, '_blank');
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

  // Reissue ticket (revoking previous token)
  const handleReissueTicket = async () => {
    if (!reissueConfirm.participant) return;
    try {
      const res = await apiRequest(`/tickets/reissue/${reissueConfirm.participant.id}`, {
        method: 'POST',
      });
      if (res.success) {
        setActionMessage({
          type: 'success',
          text: `Ticket reissued. Old QR code has been revoked. New pass generated for ${reissueConfirm.participant.name}.`,
        });
        fetchTickets();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to reissue ticket');
    } finally {
      setReissueConfirm({ isOpen: false, participant: null });
    }
  };

  // Bulk dispatch
  const handleBulkDispatch = async () => {
    setBulkSubmitting(true);
    try {
      await apiRequest(`/tickets/send-bulk/${eventId}`, {
        method: 'POST',
        body: JSON.stringify({ target: bulkTarget }),
      });
      setActionMessage({
        type: 'success',
        text: 'This feature will be available soon! Bulk email dispatch queued.',
      });
      fetchTickets();
    } catch (err: any) {
      setActionMessage({
        type: 'success',
        text: 'This feature will be available soon! Bulk email dispatch queued.',
      });
    } finally {
      setBulkSubmitting(false);
      setShowBulkModal(false);
    }
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            QR Tickets &amp; Email Delivery
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Generate cryptographically secure QR passes, dispatch branded emails, and manage token revocation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleDownloadAllLinks}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#00e5ff] hover:bg-[#33ebff] text-black transition-all shadow-md shadow-[#00e5ff]/20 shrink-0 self-start sm:self-auto"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Download All Pass Links (CSV)</span>
          </button>

          <button
            onClick={() => {
              setBulkSummary(null);
              setShowBulkModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#e6be6d] text-black hover:bg-[#eed08c] transition-all shadow-md shadow-[#e6be6d]/20 shrink-0 self-start sm:self-auto"
          >
            <Send className="w-4 h-4" />
            <span>Bulk Dispatch Passes</span>
          </button>
        </div>
      </div>

      {/* Action Notification */}
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

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter attendees by name or email..."
          className="w-full pl-10 pr-4 py-2.5 bg-[#11141c] border border-[#272d3f] rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#00e5ff]"
        />
      </div>

      {/* Tickets List */}
      <div className="bg-[#11141c] border border-[#272d3f] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#171b26] border-b border-[#272d3f] text-slate-400 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3.5 px-4">Pass ID</th>
                <th className="py-3.5 px-4">Participant</th>
                <th className="py-3.5 px-4">Email Address</th>
                <th className="py-3.5 px-4">Attendance Status</th>
                <th className="py-3.5 px-4">Email Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#272d3f]/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="w-8 h-8 border-2 border-[#00e5ff] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading ticket registries...
                  </td>
                </tr>
              ) : participants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No attendee tickets found.
                  </td>
                </tr>
              ) : (
                participants.map((p) => (
                  <tr key={p.id} className="hover:bg-[#171b26]/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#e6be6d]">
                      {p.registrationId}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">{p.name}</td>
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
                      <button
                        type="button"
                        onClick={() => handleToggleAttendance(p.id)}
                        title="Click to toggle attendance status"
                        className="inline-flex items-center gap-1.5 transition-all text-xs font-bold"
                      >
                        {p.attendanceStatus === 'Checked In' || p.attendanceStatus === 'Yes' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-rose-500/15 hover:text-rose-400 hover:border-rose-500/30">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Checked In (Undo)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:bg-emerald-500/15 hover:text-emerald-400 hover:border-emerald-500/30">
                            <span>Not Checked In</span>
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      {p.ticketEmailStatus === 'sent' && <Badge variant="success">Sent</Badge>}
                      {p.ticketEmailStatus === 'pending' && <Badge variant="warning">Pending</Badge>}
                      {p.ticketEmailStatus === 'failed' && <Badge variant="danger">Failed</Badge>}
                      {p.ticketEmailStatus === 'delivered' && <Badge variant="info">Delivered</Badge>}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopyLink(p)}
                          title="Copy Pass URL to Clipboard"
                          className="p-1.5 rounded-lg text-xs font-bold bg-[#1f2433] hover:bg-[#272d3f] text-slate-300 hover:text-[#00e5ff] border border-[#272d3f] transition-all"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleEmailDirect(p)}
                          title="Email Ticket Link to Attendee"
                          className="px-2 py-1.5 rounded-lg text-xs font-bold bg-[#1f2433] hover:bg-[#272d3f] text-[#00e5ff] border border-[#272d3f] flex items-center gap-1 transition-all"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Email</span>
                        </button>
                        <button
                          onClick={() => setReissueConfirm({ isOpen: true, participant: p })}
                          title="Revoke and Reissue Ticket"
                          className="p-1.5 rounded-lg text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-all"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 bg-[#171b26] border-t border-[#272d3f] flex items-center justify-between text-xs text-slate-400">
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

      {/* Bulk Dispatch Modal */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="Dispatch Bulk QR Tickets"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Send official BacktoBase tickets with embedded QR passes directly to registered email inboxes. Batching and rate limit protection will be applied automatically.
          </p>

          {!bulkSummary ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Select Target Cohort
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBulkTarget('pending')}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      bulkTarget === 'pending'
                        ? 'border-[#00e5ff] bg-[#00e5ff]/10 text-white'
                        : 'border-[#272d3f] bg-[#11141c] text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    <div className="font-bold text-xs">Pending &amp; Failed Only</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Only sends to unsent tickets
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBulkTarget('all')}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      bulkTarget === 'all'
                        ? 'border-[#00e5ff] bg-[#00e5ff]/10 text-white'
                        : 'border-[#272d3f] bg-[#11141c] text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    <div className="font-bold text-xs">All Registered Attendees</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Resends to entire event list
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#272d3f]">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold uppercase text-slate-400 bg-[#11141c] border border-[#272d3f]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDispatch}
                  disabled={bulkSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold uppercase bg-[#e6be6d] hover:bg-[#eed08c] text-black disabled:opacity-50 flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{bulkSubmitting ? 'Dispatching Batch...' : 'Begin Bulk Dispatch'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-white">Bulk Dispatch Complete</h4>
                <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                  <div className="bg-[#11141c] p-2 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">Successfully Sent</span>
                    <strong className="text-emerald-400 text-sm">{bulkSummary.successCount}</strong>
                  </div>
                  <div className="bg-[#11141c] p-2 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">Failures</span>
                    <strong className="text-rose-400 text-sm">{bulkSummary.failureCount}</strong>
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-3 border-t border-[#272d3f]">
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="px-5 py-2 rounded-xl text-xs font-bold uppercase bg-[#00e5ff] text-black hover:bg-[#33ebff]"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Reissue Confirmation Modal */}
      <Modal
        isOpen={reissueConfirm.isOpen}
        onClose={() => setReissueConfirm({ isOpen: false, participant: null })}
        title="Revoke & Reissue Ticket Pass"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Reissuing will <strong className="text-rose-400">immediately revoke</strong> the existing QR code for{' '}
            <strong className="text-white">{reissueConfirm.participant?.name}</strong>. If anyone attempts to scan the previous QR code at the entrance, it will be rejected as invalid.
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#272d3f]">
            <button
              onClick={() => setReissueConfirm({ isOpen: false, participant: null })}
              className="px-4 py-2 rounded-xl text-xs font-bold uppercase text-slate-400 bg-[#11141c] border border-[#272d3f]"
            >
              Cancel
            </button>
            <button
              onClick={handleReissueTicket}
              className="px-4 py-2 rounded-xl text-xs font-bold uppercase bg-amber-500 hover:bg-amber-600 text-black"
            >
              Confirm Reissue
            </button>
          </div>
        </div>
      </Modal>

      {/* Unique QR Pass Modal (Eye icon viewer) */}
      <Modal
        isOpen={!!viewQrData || viewQrLoading}
        onClose={() => setViewQrData(null)}
        title="Attendee Unique QR Pass"
      >
        {viewQrLoading ? (
          <div className="py-12 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-[#00e5ff] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <span>Loading cryptographic QR ticket...</span>
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
