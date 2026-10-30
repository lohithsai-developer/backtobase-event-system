import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Download, Smartphone } from 'lucide-react';

export const InstallPrompt: React.FC = () => {
  const location = useLocation();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if current page is an attendee ticket or pass view
  const isParticipantPass =
    location.pathname.startsWith('/ticket') ||
    location.pathname.startsWith('/pass');

  useEffect(() => {
    // If attendee is viewing their personal ticket pass, NEVER prompt to install
    if (isParticipantPass) {
      setIsVisible(false);
      return;
    }

    // If already running in standalone PWA mode, don't show prompt
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone
    ) {
      return;
    }

    const handler = (e: Event) => {
      // Guard against participant pass routes
      if (
        window.location.pathname.startsWith('/ticket') ||
        window.location.pathname.startsWith('/pass')
      ) {
        e.preventDefault();
        return;
      }

      e.preventDefault();
      setDeferredPrompt(e);
      if (!sessionStorage.getItem('btb_install_dismissed')) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [isParticipantPass, location.pathname]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    sessionStorage.setItem('btb_install_dismissed', 'true');
  };

  if (isParticipantPass || !isVisible || isDismissed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm z-50 animate-slideUp">
      <div className="bg-[#11141c] border-2 border-[#00e5ff] rounded-2xl p-3.5 shadow-2xl shadow-[#00e5ff]/25 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src="/icon-192.png"
            alt="BacktoBase App Icon"
            className="w-11 h-11 rounded-xl object-contain bg-[#08090c] border border-[#272d3f] p-1 shrink-0"
          />
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate">Install BacktoBase App</div>
            <div className="text-[11px] text-slate-400 truncate">Fast 1-tap mobile access</div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-[#00e5ff] hover:bg-[#33ebff] text-black shadow-md shadow-[#00e5ff]/20 transition-all"
          >
            Install
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
