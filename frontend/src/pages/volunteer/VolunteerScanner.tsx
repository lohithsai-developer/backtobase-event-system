import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Camera,
  RefreshCw,
  LogOut,
  Calendar,
  KeyRound,
  ShieldAlert,
  Upload,
  Sparkles,
  FileImage,
  Server,
  Users,
  Search,
  UserCheck,
  RotateCcw,
} from 'lucide-react';
import { Badge } from '../../components/Badge';
import { BackendConfigModal } from '../../components/BackendConfigModal';
import { BottomNav } from '../../components/BottomNav';

export const VolunteerScanner: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [activeEvent, setActiveEvent] = useState<any>(null);
  const [loadingEvent, setLoadingEvent] = useState<boolean>(true);
  const [configModalOpen, setConfigModalOpen] = useState(false);

  // Scanner state
  const [viewMode, setViewMode] = useState<'camera' | 'roster'>('camera');
  const [rosterSearch, setRosterSearch] = useState<string>('');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [scannerStarted, setScannerStarted] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanStatus, setScanStatus] = useState<
    'idle' | 'scanning' | 'processing' | 'success' | 'already_checked' | 'wrong_event' | 'invalid'
  >('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState<string>('');

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isScanningLockedRef = useRef<boolean>(false);
  const scannerContainerId = 'reader-container';

  // Fetch active event
  const fetchActiveEvent = async () => {
    try {
      const data = await apiRequest('/public/active-event');
      if (data.success && data.activeEvent) {
        setActiveEvent(data.activeEvent);
      } else {
        setActiveEvent(null);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not verify active event.');
    } finally {
      setLoadingEvent(false);
    }
  };

  useEffect(() => {
    fetchActiveEvent();
  }, []);

  // Volunteer manual check-in toggle
  const handleToggleAttendee = async (regId: string) => {
    if (!regId || togglingId) return;
    setTogglingId(regId);
    try {
      const res = await apiRequest(`/attendance/toggle/${regId}`, {
        method: 'POST',
      });
      if (res.success) {
        fetchActiveEvent();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update attendance');
    } finally {
      setTogglingId(null);
    }
  };

  // Process a scanned raw token or URL
  const handleScanToken = async (rawCode: string) => {
    // Instant synchronous lock to prevent camera multi-frame duplicate trigger
    if (isScanningLockedRef.current) return;
    isScanningLockedRef.current = true;

    // Immediately pause scanner so no further frames are analyzed
    if (html5QrCodeRef.current) {
      try {
        html5QrCodeRef.current.pause(true);
      } catch (_) {}
    }

    // Extract token if attendee presents full URL (e.g. /ticket/<token>)
    let cleanedToken = rawCode.trim();
    if (cleanedToken.includes('/ticket/')) {
      const parts = cleanedToken.split('/ticket/');
      cleanedToken = parts[parts.length - 1].split('?')[0];
    }

    setScanStatus('processing');

    try {
      const response = await apiRequest('/attendance/scan', {
        method: 'POST',
        body: JSON.stringify({ token: cleanedToken }),
      });

      if (response.success && response.status === 'SUCCESS') {
        setScanStatus('success');
        setScanResult(response);
      } else if (response.status === 'ALREADY_CHECKED_IN') {
        // Double check: if check-in was registered within the last 10 seconds, it is THIS scan confirmation!
        const checkInTime = response.checkedInAt ? new Date(response.checkedInAt).getTime() : 0;
        const diffSeconds = (Date.now() - checkInTime) / 1000;
        if (diffSeconds >= 0 && diffSeconds < 10) {
          setScanStatus('success');
          setScanResult({
            ...response,
            success: true,
            status: 'SUCCESS',
            message: 'Access Granted - Checked In Just Now',
          });
        } else {
          setScanStatus('already_checked');
          setScanResult(response);
        }
      } else if (response.status === 'WRONG_EVENT') {
        setScanStatus('wrong_event');
        setScanResult(response);
      } else {
        setScanStatus('invalid');
        setScanResult(response);
      }
    } catch (err: any) {
      setScanStatus('invalid');
      setScanResult({
        message: err.message || 'Invalid or revoked QR ticket.',
      });
    }
  };

  const startScanner = async () => {
    setErrorMessage(null);
    setScanStatus('scanning');
    setScanResult(null);

    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerContainerId);
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      // Auto-fallback: try environment (rear camera), then webcam (user), then any device ID
      let started = false;
      try {
        await html5QrCodeRef.current.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => handleScanToken(decodedText),
          () => {}
        );
        started = true;
      } catch (e1) {
        try {
          await html5QrCodeRef.current.start(
            { facingMode: 'user' },
            config,
            (decodedText) => handleScanToken(decodedText),
            () => {}
          );
          started = true;
        } catch (e2) {
          const cameras = await Html5Qrcode.getCameras();
          if (cameras && cameras.length > 0) {
            await html5QrCodeRef.current.start(
              cameras[0].id,
              config,
              (decodedText) => handleScanToken(decodedText),
              () => {}
            );
            started = true;
          }
        }
      }

      if (started) {
        setScannerStarted(true);
      } else {
        throw new Error('Camera device could not be opened. You can upload a QR image or enter the pass token below.');
      }
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          'Camera access was denied or is not supported on this browser. You can allow camera permission in your browser URL bar, or use "Upload QR Image" or "Manual Entry" below.'
      );
      setScanStatus('idle');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerContainerId);
      }

      const decodedText = await html5QrCodeRef.current.scanFile(file, true);
      if (decodedText) {
        handleScanToken(decodedText);
      }
    } catch (err: any) {
      setErrorMessage('No readable QR code found in the selected image. Please try another image or enter the pass token.');
    }
  };

  const handleTestSampleScan = async () => {
    if (!activeEvent) return;
    try {
      const res = await apiRequest(`/participants/event/${activeEvent.id}?limit=1`);
      if (res.success && res.participants.length > 0) {
        const attendee = res.participants[0];
        const qrRes = await apiRequest(`/tickets/qr/${attendee.id}`);
        if (qrRes.success && qrRes.qr?.token) {
          handleScanToken(qrRes.qr.token);
        }
      } else {
        alert('No participants found in active event. Add a participant in Admin first.');
      }
    } catch (err: any) {
      alert(err.message || 'Could not test scan');
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        setScannerStarted(false);
      } catch (err) {
        console.error('Error stopping QR scanner:', err);
      }
    }
  };

  const resetForNextScan = async () => {
    setScanResult(null);
    setScanStatus('scanning');
    setManualToken('');

    // Unlock scan processing
    setTimeout(() => {
      isScanningLockedRef.current = false;
    }, 300);

    if (html5QrCodeRef.current) {
      try {
        html5QrCodeRef.current.resume();
      } catch {
        startScanner();
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#08090c] text-white flex flex-col">
      {/* Volunteer Header */}
      <header className="bg-[#11141c] border-b border-[#272d3f] px-4 py-3 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/backtobase-logo.png"
            alt="BacktoBase Logo"
            className="h-10 w-auto object-contain"
          />
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#00e5ff]">
              VOLUNTEER CHECK-IN
            </div>
            <div className="text-xs font-bold text-slate-300">Entrance Scanner</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 bg-[#171b26] border border-[#272d3f] hover:text-[#00e5ff] hover:border-[#00e5ff] transition-all"
          >
            <span>Home</span>
          </Link>
          {isAuthenticated && (
            <Link
              to="/admin/dashboard"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#e6be6d] bg-[#e6be6d]/10 border border-[#e6be6d]/30 hover:bg-[#e6be6d]/20 transition-all"
            >
              <span>Admin</span>
            </Link>
          )}
        </div>
      </header>

      {/* Main Scanner Body */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 flex flex-col justify-between pb-24 md:pb-6">
        {/* Active Event Info Bar */}
        <div className="bg-[#11141c] border border-[#272d3f] rounded-2xl p-4 mb-3 shadow-lg">
          {loadingEvent ? (
            <div className="text-center py-2 text-xs text-slate-400">Loading active event...</div>
          ) : activeEvent ? (
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#e6be6d]">
                  Active Event Gate
                </span>
                <h2 className="text-base font-extrabold text-white truncate max-w-[220px]">
                  {activeEvent.name}
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-[#00e5ff]" />
                  <span>
                    {new Date(activeEvent.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
              <Badge variant="active">LIVE</Badge>
            </div>
          ) : (
            <div className="text-center py-2 space-y-2">
              <span className="text-amber-400 font-bold text-sm block">
                No active event found
              </span>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Ensure an event is activated in Admin, or verify your phone is connected to your Render backend API.
              </p>
              <button
                type="button"
                onClick={() => setConfigModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#171b26] border border-[#272d3f] hover:border-[#00e5ff] text-xs font-semibold text-slate-300 hover:text-white transition-all"
              >
                <Server className="w-3.5 h-3.5 text-[#00e5ff]" />
                <span>Configure Cloud API URL</span>
              </button>
            </div>
          )}
        </div>

        {/* View Mode Toggle: Camera Scanner vs Attendee Gate List */}
        {activeEvent && (
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#11141c] border border-[#272d3f] rounded-2xl mb-4">
            <button
              type="button"
              onClick={() => setViewMode('camera')}
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                viewMode === 'camera'
                  ? 'bg-[#00e5ff] text-black shadow-lg shadow-[#00e5ff]/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Camera Scan</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('roster')}
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                viewMode === 'roster'
                  ? 'bg-[#00e5ff] text-black shadow-lg shadow-[#00e5ff]/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Gate List ({activeEvent.participants?.length || 0})</span>
            </button>
          </div>
        )}

        {viewMode === 'roster' && activeEvent && (
          <div className="bg-[#11141c] border border-[#272d3f] rounded-2xl p-4 shadow-xl space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                placeholder="Search attendee to check in..."
                className="w-full pl-9 pr-3 py-2 bg-[#0e1017] border border-[#272d3f] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00e5ff]"
              />
            </div>

            <div className="divide-y divide-[#272d3f]/60 max-h-[380px] overflow-y-auto">
              {(activeEvent.participants || [])
                .filter(
                  (p: any) =>
                    p.name.toLowerCase().includes(rosterSearch.toLowerCase()) ||
                    p.email.toLowerCase().includes(rosterSearch.toLowerCase())
                )
                .map((p: any) => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-white text-xs truncate">{p.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono truncate">{p.email}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleAttendee(p.id)}
                      disabled={togglingId === p.id}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 ${
                        p.isCheckedIn
                          ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-rose-500/15 hover:text-rose-400'
                          : 'bg-[#00e5ff] text-black hover:bg-[#33ebff]'
                      }`}
                    >
                      {p.isCheckedIn ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Checked In (Undo)</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Mark Entry</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Camera Permission / Error banner */}
        {errorMessage && (
          <div className="bg-rose-500/15 border border-rose-500/30 rounded-2xl p-4 mb-4 text-xs text-rose-300 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <div className="font-bold text-rose-200">Camera Access Notice</div>
              <div className="mt-1 leading-relaxed">{errorMessage}</div>
            </div>
          </div>
        )}

        {/* Scan Result Feedback Card */}
        {scanResult && (
          <div className="mb-4 animate-scaleUp">
            {scanStatus === 'success' && (
              <div className="bg-emerald-950/80 border-2 border-emerald-500 rounded-3xl p-6 text-center shadow-2xl shadow-emerald-950/50">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-emerald-400 tracking-tight">
                  ATTENDANCE MARKED!
                </h3>
                <p className="text-xl font-extrabold text-white mt-2">
                  {scanResult.participantName}
                </p>
                <p className="text-xs text-emerald-300/80 mt-0.5">
                  {scanResult.participantEmail}
                </p>
                <div className="mt-4 pt-3 border-t border-emerald-500/30 text-xs font-semibold text-emerald-300">
                  Gate entry recorded at {new Date(scanResult.checkedInAt).toLocaleTimeString()}
                </div>
              </div>
            )}

            {scanStatus === 'already_checked' && (
              <div className="bg-amber-950/80 border-2 border-amber-500 rounded-3xl p-6 text-center shadow-2xl">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-amber-400 tracking-tight">
                  ALREADY CHECKED IN
                </h3>
                <p className="text-xl font-extrabold text-white mt-2">
                  {scanResult.participantName}
                </p>
                <p className="text-xs text-amber-300/80 mt-0.5">
                  {scanResult.participantEmail}
                </p>
                <div className="mt-4 pt-3 border-t border-amber-500/30 text-xs text-amber-300">
                  Already admitted at{' '}
                  <span className="font-bold text-white">
                    {scanResult.checkedInAt
                      ? new Date(scanResult.checkedInAt).toLocaleTimeString()
                      : 'earlier'}
                  </span>
                </div>
              </div>
            )}

            {scanStatus === 'wrong_event' && (
              <div className="bg-rose-950/80 border-2 border-rose-500 rounded-3xl p-6 text-center shadow-2xl">
                <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3">
                  <XCircle className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-black text-rose-400 tracking-tight">
                  WRONG EVENT TICKET
                </h3>
                <p className="text-sm text-slate-300 mt-2">
                  This ticket belongs to a different event:
                </p>
                <p className="text-base font-bold text-white mt-1">
                  "{scanResult.ticketEventName || 'Different Event'}"
                </p>
                <p className="text-xs text-rose-300 mt-2">
                  Cannot be used for {activeEvent?.name}.
                </p>
              </div>
            )}

            {scanStatus === 'invalid' && (
              <div className="bg-rose-950/80 border-2 border-rose-500 rounded-3xl p-6 text-center shadow-2xl">
                <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3">
                  <XCircle className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-black text-rose-400 tracking-tight">
                  INVALID OR REVOKED TICKET
                </h3>
                <p className="text-xs text-rose-300 mt-2">
                  {scanResult.message || 'Ticket not found or has been revoked by admin.'}
                </p>
              </div>
            )}

            {/* Ready Next Button */}
            <button
              onClick={resetForNextScan}
              className="w-full mt-4 py-4 rounded-2xl font-black text-base bg-[#00e5ff] hover:bg-[#33ebff] text-black shadow-xl shadow-[#00e5ff]/25 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Scan Next Participant</span>
            </button>
          </div>
        )}

        {/* Viewfinder Video Container */}
        {viewMode === 'camera' && !scanResult && (
          <div className="bg-[#11141c] border border-[#272d3f] rounded-3xl p-4 shadow-2xl flex flex-col items-center">
            <div
              id={scannerContainerId}
              className="w-full max-w-[320px] aspect-square rounded-2xl overflow-hidden bg-black border-2 border-[#00e5ff]/40 relative"
            ></div>

            {scanStatus === 'processing' && (
              <div className="mt-4 flex items-center gap-2 text-xs font-bold text-[#00e5ff]">
                <div className="w-4 h-4 border-2 border-[#00e5ff] border-t-transparent rounded-full animate-spin"></div>
                <span>Verifying ticket token with server...</span>
              </div>
            )}

            {!scannerStarted && scanStatus !== 'processing' && (
              <div className="w-full space-y-2 mt-4">
                <button
                  onClick={startScanner}
                  disabled={!activeEvent}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-[#00e5ff] to-[#00b4d8] text-black shadow-lg shadow-[#00e5ff]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Camera className="w-5 h-5" />
                  <span>Start Camera Scanner</span>
                </button>

                {/* Upload QR Image file alternative */}
                <div className="flex items-center gap-2">
                  <label className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs bg-[#171b26] hover:bg-[#1f2433] text-slate-300 border border-[#272d3f] hover:border-[#00e5ff] flex items-center justify-center gap-1.5 transition-all cursor-pointer">
                    <FileImage className="w-4 h-4 text-[#00e5ff]" />
                    <span>Upload QR Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>

                  {/* Test Attendee Scan button */}
                  <button
                    type="button"
                    onClick={handleTestSampleScan}
                    disabled={!activeEvent}
                    className="py-2.5 px-3 rounded-xl font-bold text-xs bg-[#e6be6d]/15 hover:bg-[#e6be6d]/25 text-[#e6be6d] border border-[#e6be6d]/30 flex items-center justify-center gap-1.5 transition-all disabled:opacity-40"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Test Active Pass</span>
                  </button>
                </div>
              </div>
            )}

            {scannerStarted && (
              <div className="mt-3 text-center">
                <span className="text-[11px] font-semibold text-slate-400">
                  Point camera steadily at participant's QR code
                </span>
              </div>
            )}
          </div>
        )}

        {/* Manual Token Entry Fallback */}
        {viewMode === 'camera' && (
          <div className="mt-4 pt-4 border-t border-[#272d3f]">
            <div className="text-[11px] uppercase font-bold text-slate-400 mb-2 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#e6be6d]" />
              <span>Manual Entry / Backup</span>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (manualToken.trim()) {
                  handleScanToken(manualToken.trim());
                }
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="Paste token or ticket URL..."
                className="flex-1 bg-[#171b26] border border-[#272d3f] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00e5ff]"
              />
              <button
                type="submit"
                disabled={!manualToken.trim()}
                className="px-4 py-2 bg-[#1f2433] hover:bg-[#272d3f] text-[#00e5ff] font-bold text-xs rounded-xl border border-[#272d3f] disabled:opacity-40"
              >
                Verify
              </button>
            </form>
          </div>
        )}
      </main>

      <BackendConfigModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        onSaved={fetchActiveEvent}
      />

      <BottomNav />
    </div>
  );
};
