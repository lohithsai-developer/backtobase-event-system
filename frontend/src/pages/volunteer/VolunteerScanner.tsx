import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
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
  Volume2,
  Square,
  Crosshair,
  Undo2,
  Sun,
  Moon,
} from 'lucide-react';
import { Badge } from '../../components/Badge';
import { BackendConfigModal } from '../../components/BackendConfigModal';
import { BottomNav } from '../../components/BottomNav';

export const VolunteerScanner: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
  const [detectedCode, setDetectedCode] = useState<string | null>(null);
  const [isCaptureArmed, setIsCaptureArmed] = useState<boolean>(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isScanningLockedRef = useRef<boolean>(false);
  const detectedTokenRef = useRef<string | null>(null);
  const lastProcessedTokenRef = useRef<string | null>(null);
  const isCaptureArmedRef = useRef<boolean>(false);
  const scannerContainerId = 'reader-container';

  // Sound feedback on scan
  const playAudioFeedback = (isSuccess: boolean) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (isSuccess) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.setValueAtTime(180, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      }
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (_) {}
  };

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
    const interval = setInterval(fetchActiveEvent, 3500);
    return () => clearInterval(interval);
  }, []);

  // Directly open camera scanner on page load without requiring the user to click any button
  useEffect(() => {
    if (viewMode === 'camera' && !scannerStarted) {
      const timer = setTimeout(() => {
        startScanner();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [viewMode, scannerStarted]);

  // Volunteer manual check-in toggle from roster
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
  const handleProcessToken = async (rawCode: string) => {
    if (isScanningLockedRef.current) return;
    isScanningLockedRef.current = true;

    // Immediately pause scanner so no further frames are analyzed
    if (html5QrCodeRef.current) {
      try {
        html5QrCodeRef.current.pause(true);
      } catch (_) {}
    }

    // Extract token if attendee presents full URL (e.g. /ticket/<token> or /pass/<token>)
    let cleanedToken = rawCode.trim();
    if (cleanedToken.includes('/ticket/')) {
      const parts = cleanedToken.split('/ticket/');
      cleanedToken = parts[parts.length - 1].split('?')[0];
    } else if (cleanedToken.includes('/pass/')) {
      const parts = cleanedToken.split('/pass/');
      cleanedToken = parts[parts.length - 1].split('?')[0];
    }

    lastProcessedTokenRef.current = cleanedToken;
    setScanStatus('processing');

    try {
      const response = await apiRequest('/attendance/scan', {
        method: 'POST',
        body: JSON.stringify({ token: cleanedToken }),
      });

      if (response.success && response.status === 'SUCCESS') {
        playAudioFeedback(true);
        setScanStatus('success');
        setScanResult(response);
      } else if (response.status === 'ALREADY_CHECKED_IN') {
        // If check-in was registered within the last 10 seconds, confirm check-in
        const checkInTime = response.checkedInAt ? new Date(response.checkedInAt).getTime() : 0;
        const diffSeconds = (Date.now() - checkInTime) / 1000;
        if (diffSeconds >= 0 && diffSeconds < 10) {
          playAudioFeedback(true);
          setScanStatus('success');
          setScanResult({
            ...response,
            success: true,
            status: 'SUCCESS',
            message: 'Access Granted - Checked In Just Now',
          });
        } else {
          playAudioFeedback(false);
          setScanStatus('already_checked');
          setScanResult(response);
        }
      } else if (response.status === 'WRONG_EVENT') {
        playAudioFeedback(false);
        setScanStatus('wrong_event');
        setScanResult(response);
      } else {
        playAudioFeedback(false);
        setScanStatus('invalid');
        setScanResult(response);
      }
    } catch (err: any) {
      playAudioFeedback(false);
      setScanStatus('invalid');
      setScanResult({
        message: err.message || 'Invalid or revoked QR ticket.',
      });
    } finally {
      fetchActiveEvent();
    }
  };

  // Called on each decoded frame from Html5Qrcode
  const onQrDecoded = (decodedText: string) => {
    const raw = decodedText ? decodedText.trim() : '';
    if (!raw) return;

    let token = raw;
    if (token.includes('/ticket/')) {
      const parts = token.split('/ticket/');
      token = parts[parts.length - 1].split('?')[0];
    } else if (token.includes('/pass/')) {
      const parts = token.split('/pass/');
      token = parts[parts.length - 1].split('?')[0];
    }

    detectedTokenRef.current = token;
    setDetectedCode(token);

    // Controlled Tap-to-Scan: only if volunteer has armed capture do we proceed automatically
    if (isCaptureArmedRef.current) {
      isCaptureArmedRef.current = false;
      setIsCaptureArmed(false);
      handleProcessToken(token);
    }
  };

  // User taps "Scan QR Now" in manual mode
  const handleManualCaptureClick = () => {
    if (detectedTokenRef.current) {
      handleProcessToken(detectedTokenRef.current);
    } else {
      // Arm capture window for 5 seconds waiting for QR to align
      isCaptureArmedRef.current = true;
      setIsCaptureArmed(true);
      setTimeout(() => {
        isCaptureArmedRef.current = false;
        setIsCaptureArmed(false);
      }, 5000);
    }
  };

  // Undo check-in directly from scan result card
  const handleUndoCheckIn = async () => {
    const regId = scanResult?.registrationId;
    if (!regId) return;
    try {
      setTogglingId(regId);
      const res = await apiRequest(`/attendance/toggle/${regId}`, {
        method: 'POST',
      });
      if (res.success) {
        setScanStatus('idle');
        setScanResult(null);
        setErrorMessage(`Check-in was undone for ${scanResult.participantName}.`);
        fetchActiveEvent();
        resetForNextScan();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to undo check-in');
    } finally {
      setTogglingId(null);
    }
  };

  const startScanner = async () => {
    setErrorMessage(null);
    setScanStatus('scanning');
    setScanResult(null);
    setDetectedCode(null);
    detectedTokenRef.current = null;
    isCaptureArmedRef.current = false;
    setIsCaptureArmed(false);

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
          (decodedText) => onQrDecoded(decodedText),
          () => {}
        );
        started = true;
      } catch (e1) {
        try {
          await html5QrCodeRef.current.start(
            { facingMode: 'user' },
            config,
            (decodedText) => onQrDecoded(decodedText),
            () => {}
          );
          started = true;
        } catch (e2) {
          const cameras = await Html5Qrcode.getCameras();
          if (cameras && cameras.length > 0) {
            await html5QrCodeRef.current.start(
              cameras[0].id,
              config,
              (decodedText) => onQrDecoded(decodedText),
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
        handleProcessToken(decodedText);
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
          handleProcessToken(qrRes.qr.token);
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
    setDetectedCode(null);
    detectedTokenRef.current = null;
    isCaptureArmedRef.current = false;
    setIsCaptureArmed(false);

    // 400ms delay before accepting new scan
    setTimeout(() => {
      isScanningLockedRef.current = false;
    }, 400);

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
          {/* Light / Dark Theme Button */}
          <button
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
            className="p-1.5 rounded-lg bg-[#171b26] border border-[#272d3f] text-slate-300 hover:text-white transition-all active:scale-95"
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? (
              <Moon className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
            )}
          </button>
          <Link
            to="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 bg-[#171b26] border border-[#272d3f] hover:text-[#00e5ff] hover:border-[#00e5ff] transition-all"
          >
            <span>Home</span>
          </Link>
          {isAuthenticated && (
            <>
              <Link
                to="/admin/dashboard"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#e6be6d] bg-[#e6be6d]/10 border border-[#e6be6d]/30 hover:bg-[#e6be6d]/20 transition-all"
              >
                <span>Admin</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 transition-all"
                title="Logout of Admin"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </>
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
                    (p.email && p.email.toLowerCase().includes(rosterSearch.toLowerCase()))
                )
                .map((p: any) => (
                  <div key={p.id} className="py-3 px-1 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-extrabold text-white text-sm truncate">{p.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {p.isCheckedIn ? (
                          <span className="text-[11px] font-bold text-emerald-400">
                            Attended &bull; {p.checkedInAt ? new Date(p.checkedInAt).toLocaleTimeString() : 'Checked In'}
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-400">
                            Not Attended
                          </span>
                        )}
                      </div>
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
                          <span>Attended (Undo)</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Mark Attended</span>
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
            <div className="flex-1">
              <div className="font-bold text-rose-200">Camera / Scan Notice</div>
              <div className="mt-1 leading-relaxed">{errorMessage}</div>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-white text-xs font-bold"
            >
              Dismiss
            </button>
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
                <p className="text-2xl font-extrabold text-white mt-2">
                  {scanResult.participantName}
                </p>
                <div className="mt-4 pt-3 border-t border-emerald-500/30 text-xs font-semibold text-emerald-300">
                  Event Checked In: Admitted at {new Date(scanResult.checkedInAt).toLocaleTimeString()}
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
                <p className="text-2xl font-extrabold text-white mt-2">
                  {scanResult.participantName}
                </p>
                <div className="mt-4 pt-3 border-t border-amber-500/30 text-xs text-amber-300">
                  Event Checked In: Already admitted at{' '}
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

            {/* Action Buttons: Next Scan & Undo Check-In */}
            <div className="mt-4 space-y-2">
              <button
                onClick={resetForNextScan}
                className="w-full py-4 rounded-2xl font-black text-base bg-[#00e5ff] hover:bg-[#33ebff] text-black shadow-xl shadow-[#00e5ff]/25 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Scan Next Participant</span>
              </button>

              {scanResult.registrationId && (
                <button
                  type="button"
                  onClick={handleUndoCheckIn}
                  disabled={togglingId === scanResult.registrationId}
                  className="w-full py-2.5 rounded-xl font-semibold text-xs bg-[#171b26] hover:bg-rose-500/15 text-slate-400 hover:text-rose-400 border border-[#272d3f] hover:border-rose-500/30 transition-all flex items-center justify-center gap-2"
                >
                  <Undo2 className="w-4 h-4" />
                  <span>Undo Check-In for this Attendee</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Viewfinder Video Container (Always stays mounted in DOM when in camera mode) */}
        {viewMode === 'camera' && (
          <div
            className={`bg-[#11141c] border border-[#272d3f] rounded-3xl p-4 shadow-2xl flex flex-col items-center ${
              scanResult ? 'hidden' : 'block'
            }`}
          >
            {/* Video Viewfinder Box */}
            <div
              id={scannerContainerId}
              className={`w-full max-w-[320px] aspect-square rounded-2xl overflow-hidden bg-black relative transition-all ${
                detectedCode
                  ? 'border-4 border-emerald-400 shadow-lg shadow-emerald-500/30'
                  : 'border-2 border-[#00e5ff]/40'
              }`}
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
              <div className="w-full mt-4 space-y-2">
                <button
                  type="button"
                  onClick={handleManualCaptureClick}
                  className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all ${
                    detectedCode
                      ? 'bg-emerald-400 hover:bg-emerald-300 text-black shadow-lg shadow-emerald-500/30 animate-pulse'
                      : isCaptureArmed
                      ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/30'
                      : 'bg-[#00e5ff] hover:bg-[#33ebff] text-black shadow-lg shadow-[#00e5ff]/20'
                  }`}
                >
                  <Crosshair className="w-5 h-5" />
                  <span>
                    {detectedCode
                      ? '📸 QR Detected — Tap to Check In!'
                      : isCaptureArmed
                      ? 'Align QR Pass Inside Box...'
                      : '📸 Tap to Scan QR Pass'}
                  </span>
                </button>

                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>Align pass in camera and tap button</span>
                  <button
                    type="button"
                    onClick={stopScanner}
                    className="text-rose-400 hover:text-rose-300 font-bold"
                  >
                    Stop Camera
                  </button>
                </div>
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
                  handleProcessToken(manualToken.trim());
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
