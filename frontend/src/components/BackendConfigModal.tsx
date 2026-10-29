import React, { useState } from 'react';
import { getApiBase, setCustomApiBase } from '../services/api';
import { Server, Check, X, Globe, AlertTriangle } from 'lucide-react';

interface BackendConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const BackendConfigModal: React.FC<BackendConfigModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [url, setUrl] = useState(getApiBase());
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomApiBase(url);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
      if (onSaved) onSaved();
      window.location.reload();
    }, 800);
  };

  const handleResetToDefault = () => {
    setCustomApiBase('');
    setUrl('/api');
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
      window.location.reload();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#11141c] border border-[#272d3f] rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-[#00e5ff]/10 border border-[#00e5ff]/30 rounded-xl text-[#00e5ff]">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Backend Server Connection</h3>
            <p className="text-xs text-slate-400">
              Connect this device (mobile or desktop) to your cloud database &amp; backend
            </p>
          </div>
        </div>

        <div className="bg-[#171b26] border border-[#272d3f] rounded-xl p-3.5 mb-5 text-xs text-slate-300 space-y-1.5">
          <div className="flex items-center gap-2 text-[#e6be6d] font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Why is data not showing on mobile?</span>
          </div>
          <p>
            If events were created on <strong>localhost</strong> on your laptop, that data is stored in your laptop's local disk only.
          </p>
          <p>
            To sync across mobile &amp; laptop, enter your <strong>Render Cloud Backend URL</strong> below. Both devices will share the exact same MongoDB Atlas database.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Render Backend API URL
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Globe className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-service.onrender.com/api"
                className="w-full pl-9 pr-3 py-2.5 bg-[#0e1017] border border-[#272d3f] rounded-xl text-white text-xs font-mono focus:outline-none focus:border-[#00e5ff]"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Example: <code className="text-[#00e5ff]">https://backtobase-backend.onrender.com/api</code>
            </p>
          </div>

          {success && (
            <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Backend URL saved! Reloading connection...</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="text-xs text-slate-400 hover:text-white underline"
            >
              Reset to /api
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#171b26] hover:bg-[#202534] text-white text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#00e5ff] hover:bg-[#00c8e6] text-black text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-[#00e5ff]/20"
              >
                <Check className="w-4 h-4" />
                <span>Save &amp; Connect</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
