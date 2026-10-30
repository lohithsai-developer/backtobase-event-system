import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiRequest } from '../../services/api';
import { CheckCircle2, AlertTriangle, Calendar, Download, Sparkles, ShieldCheck } from 'lucide-react';
import { Badge } from '../../components/Badge';

export const TicketView: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTicket = async () => {
      if (!token) return;
      try {
        const data = await apiRequest(`/tickets/public/${token}`);
        if (data.success && data.ticket) {
          setTicket(data.ticket);
        } else {
          setError(data.message || 'Pass could not be loaded.');
        }
      } catch (err: any) {
        setError(err.message || 'Ticket pass could not be loaded or has expired.');
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [token]);

  const handleDownloadQr = () => {
    if (!ticket?.qrCodeDataUrl) return;
    try {
      const parts = ticket.qrCodeDataUrl.split(',');
      const byteString = atob(parts[1]);
      const mimeString = parts[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `BacktoBase_Pass_${(ticket.participantName || 'attendee').replace(/\s+/g, '_')}.png`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        a.remove();
        window.URL.revokeObjectURL(blobUrl);
      }, 500);
    } catch (err) {
      const a = document.createElement('a');
      a.href = ticket.qrCodeDataUrl;
      a.download = `BacktoBase_Pass_${(ticket.participantName || 'attendee').replace(/\s+/g, '_')}.png`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => a.remove(), 500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08090c] text-white flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#00e5ff] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400 font-semibold text-sm">Loading your official digital pass...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-[#08090c] text-white flex items-center justify-center p-4">
        <div className="bg-[#11141c] border border-rose-500/30 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-white">Invalid or Expired Pass</h2>
          <p className="text-slate-400 text-xs leading-relaxed">
            {error || 'This digital ticket pass could not be verified. Please check with the event organizers.'}
          </p>
          <div className="pt-2 text-[11px] text-slate-500 font-mono">
            BacktoBase Mega Event Management
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08090c] text-white flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      {/* Participant Digital Pass Card */}
      <div className="w-full max-w-md bg-[#11141c] border border-[#272d3f] rounded-3xl overflow-hidden shadow-2xl relative">
        {/* Pass Top Branding */}
        <div className="bg-gradient-to-b from-[#171b26] to-[#11141c] pt-7 pb-5 px-6 text-center border-b border-[#272d3f]">
          <img
            src="/backtobase-logo.png"
            alt="BacktoBase Logo"
            className="h-16 w-auto mx-auto object-contain mb-2 drop-shadow-md"
          />
          <div className="text-[10px] font-black tracking-widest uppercase text-[#00e5ff] flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>OFFICIAL PARTICIPANT PASS</span>
          </div>
        </div>

        {/* Pass ID & Admission Status */}
        <div className="px-6 pt-5 pb-2 flex items-center justify-between border-b border-[#272d3f]/40">
          <span className="text-[11px] font-mono font-bold text-slate-400 tracking-wider">
            PASS ID: {ticket.registrationId}
          </span>
          {ticket.isCheckedIn ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>CHECKED IN</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#00e5ff]/15 border border-[#00e5ff]/30 text-[#00e5ff] text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-[#00e5ff] animate-ping" />
              <span>ACTIVE PASS</span>
            </span>
          )}
        </div>

        {/* Participant Name & Event Header */}
        <div className="px-6 pt-5 pb-3 text-center">
          <div className="text-[11px] uppercase tracking-widest text-[#e6be6d] font-extrabold mb-1">
            PARTICIPANT
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            {ticket.participantName}
          </h1>
          <div className="text-sm font-bold text-[#00e5ff] mt-1.5">
            {ticket.eventName}
          </div>
        </div>

        {/* High-Contrast Centered QR Code */}
        <div className="px-6 py-4 flex flex-col items-center">
          <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-2xl max-w-[270px] w-full border-4 border-[#00e5ff]/30 transition-transform hover:scale-[1.02]">
            <img
              src={ticket.qrCodeDataUrl}
              alt={`QR Code Pass for ${ticket.participantName}`}
              className="w-full h-auto rounded-xl select-none"
            />
          </div>
          <p className="text-[11px] font-semibold text-slate-400 text-center mt-3 uppercase tracking-wider">
            Present this QR code at the check-in gate
          </p>
        </div>

        {/* Event Schedule & Entry Info */}
        <div className="px-6 pb-6 space-y-3">
          <div className="bg-[#171b26] border border-[#272d3f] rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <Calendar className="w-4 h-4 text-[#e6be6d] shrink-0" />
              <span className="font-bold text-white">
                {new Date(ticket.eventDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            {ticket.eventDescription && (
              <p className="text-xs text-slate-400 leading-relaxed border-t border-[#272d3f]/60 pt-2">
                {ticket.eventDescription}
              </p>
            )}
          </div>

          {/* Admission Confirmation Box if Checked In */}
          {ticket.isCheckedIn && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3.5 flex items-center gap-3 text-emerald-400 text-xs">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div>
                <span className="font-bold">Gate Entry Recorded:</span> Admitted at{' '}
                {ticket.checkedInAt ? new Date(ticket.checkedInAt).toLocaleTimeString() : 'the entrance gate'}.
              </div>
            </div>
          )}

          {/* Download Pass Button */}
          <button
            type="button"
            onClick={handleDownloadQr}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-[#1f2433] hover:bg-[#272d3f] text-[#00e5ff] border border-[#272d3f] hover:border-[#00e5ff]/40 transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Save / Download Pass Image</span>
          </button>
        </div>

        {/* Clean Pass Footer */}
        <div className="bg-[#0e1017] py-3.5 px-6 text-center border-t border-[#272d3f] text-[11px] text-slate-500">
          BacktoBase Mega Event Management &bull; LEGENDS UPGRADE
        </div>
      </div>

      <div className="mt-4 text-center text-xs text-slate-500 max-w-xs">
        Keep this pass handy on your mobile phone for swift gate check-in.
      </div>
    </div>
  );
};
