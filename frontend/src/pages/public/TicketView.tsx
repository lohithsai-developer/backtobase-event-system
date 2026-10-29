import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiRequest } from '../../services/api';
import { CheckCircle2, AlertTriangle, Calendar, User, ArrowLeft, Download } from 'lucide-react';
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
        if (data.success) {
          setTicket(data.ticket);
        }
      } catch (err: any) {
        setError(err.message || 'Ticket could not be loaded or has been revoked.');
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center text-center p-4">
        <div>
          <div className="w-12 h-12 border-4 border-[#00e5ff] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 font-semibold text-sm">Validating official digital pass...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-[#11141c] border border-rose-500/30 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4 text-rose-400">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Invalid or Revoked Ticket</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            {error || 'This QR ticket is invalid, has been revoked, or does not exist.'}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[#171b26] text-white border border-[#272d3f] hover:border-[#00e5ff] hover:text-[#00e5ff] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to BacktoBase Portal</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      {/* Digital Pass Card */}
      <div className="bg-[#11141c] border border-[#272d3f] rounded-3xl overflow-hidden shadow-2xl">
        {/* Pass Header */}
        <div className="bg-gradient-to-r from-[#12151c] via-[#1a1e2b] to-[#12151c] p-6 text-center border-b-2 border-[#00e5ff]">
          <img
            src="/backtobase-logo.png"
            alt="BacktoBase Official Logo"
            className="h-16 w-auto mx-auto object-contain mb-2"
          />
          <div className="text-[11px] font-extrabold tracking-widest uppercase text-slate-400">
            Official Participant Pass
          </div>
        </div>

        {/* Status Pill */}
        <div className="px-6 pt-6 flex items-center justify-between">
          <span className="text-xs font-mono text-slate-500">ID: {ticket.registrationId}</span>
          {ticket.isCheckedIn ? (
            <Badge variant="success">CHECKED IN</Badge>
          ) : (
            <Badge variant="active">VALID FOR ENTRY</Badge>
          )}
        </div>

        {/* Participant Name & Event */}
        <div className="p-6 text-center space-y-2">
          <div className="text-xs uppercase tracking-widest text-[#e6be6d] font-bold">
            Participant
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {ticket.participantName}
          </h2>
          <p className="text-sm font-semibold text-[#00e5ff] pt-1">{ticket.eventName}</p>
        </div>

        {/* QR Code Container */}
        <div className="px-6 py-2 flex flex-col items-center">
          <div className="bg-white p-4 rounded-2xl shadow-xl max-w-[260px] w-full border-4 border-[#00e5ff]/20">
            <img
              src={ticket.qrCodeDataUrl}
              alt="Participant QR Code"
              className="w-full h-auto rounded-lg"
            />
          </div>
          <p className="text-xs text-slate-500 font-medium mt-3 uppercase tracking-wider">
            Present this QR code at the check-in gate
          </p>
        </div>

        {/* Details Section */}
        <div className="p-6 space-y-4">
          <div className="bg-[#171b26] border border-[#272d3f] rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-[#e6be6d] shrink-0 mt-0.5" />
              <div>
                <div className="text-[11px] uppercase font-bold text-slate-400">Date &amp; Time</div>
                <div className="text-sm font-semibold text-white">
                  {new Date(ticket.eventDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-400 leading-relaxed border-t border-[#272d3f] pt-3">
              {ticket.eventDescription}
            </div>
          </div>

          {ticket.isCheckedIn && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3 text-emerald-400">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div className="text-xs">
                <span className="font-bold">Entry Recorded:</span> Successfully checked in at{' '}
                {ticket.checkedInAt ? new Date(ticket.checkedInAt).toLocaleTimeString() : 'the entrance'}.
              </div>
            </div>
          )}
        </div>

        {/* Card Footer */}
        <div className="bg-[#0d0f15] p-4 text-center border-t border-[#272d3f] text-xs text-slate-500">
          LEGENDS UPGRADE &bull; BacktoBase Mega Event Management
        </div>
      </div>
    </div>
  );
};
