import React from 'react';
import { Shield, KeyRound, Server, Mail, CheckCircle2, AlertTriangle } from 'lucide-react';

export const Settings: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl animate-fadeIn">
      <div className="pb-6 border-b border-[#272d3f]">
        <span className="text-xs font-bold uppercase tracking-wider text-[#e6be6d]">
          System Configuration
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
          Platform Architecture &amp; Credentials
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Role-based security settings, transactional email delivery integration, and audit configuration.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Administrator Role Info */}
        <div className="bg-[#11141c] border border-[#272d3f] rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-[#e6be6d]/10 text-[#e6be6d]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Administrator Role</h3>
              <p className="text-xs text-slate-400">Full System Governance</p>
            </div>
          </div>
          <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <p>
              • Exclusive permissions to create, edit, activate, deactivate, or delete events.
            </p>
            <p>
              • Authority to add participants, trigger bulk CSV imports, dispatch QR email tickets, and export official attendance reports.
            </p>
            <p>
              • Admin credentials configured via backend environment variables (<code>ADMIN_USERNAME</code> and <code>ADMIN_PASSWORD</code>) and securely hashed with bcrypt.
            </p>
          </div>
        </div>

        {/* Gate Scanner Access (Frictionless / No Volunteer Login Required) */}
        <div className="bg-[#11141c] border border-[#272d3f] rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-[#00e5ff]/10 text-[#00e5ff]">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Gate Scanner Operations</h3>
              <p className="text-xs text-slate-400">Direct Staff Entry (No Login Required)</p>
            </div>
          </div>
          <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <p>
              • Dedicated entrance scanner at <code>/volunteer/scanner</code> or <code>/scanner</code> is accessible directly by staff without requiring credentials.
            </p>
            <p className="text-[#00e5ff] bg-[#00e5ff]/10 border border-[#00e5ff]/20 p-2.5 rounded-xl">
              <strong>Streamlined Access:</strong> Only the administrator requires credentials (<code>-admin</code> / <code>-admin@backtobase</code>). Volunteers can open the scanner directly on their mobile phones to validate passes instantly for the active event.
            </p>
            <p>
              • Staff can validate attendees with race-condition-safe check-in, while administrative features remain strictly locked.
            </p>
          </div>
        </div>

        {/* Transactional Email System */}
        <div className="bg-[#11141c] border border-[#272d3f] rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Email Dispatch Service</h3>
              <p className="text-xs text-slate-400">Resend API Integration</p>
            </div>
          </div>
          <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <p>
              • Delivers high-definition HTML emails with BacktoBase official branding and embedded QR ticket.
            </p>
            <p>
              • Uses backend <code>RESEND_API_KEY</code> and <code>EMAIL_FROM</code>.
            </p>
            <p>
              • If the API key is not configured during local development or testing, the system runs in safe simulation mode without crashing.
            </p>
          </div>
        </div>

        {/* Database & Concurrency */}
        <div className="bg-[#11141c] border border-[#272d3f] rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Database &amp; Integrity</h3>
              <p className="text-xs text-slate-400">MongoDB Atlas + Mongoose</p>
            </div>
          </div>
          <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <p>
              • <strong>Single Active Event:</strong> Concurrency-safe atomic updates ensure strictly one event is active globally.
            </p>
            <p>
              • <strong>Atomic Attendance:</strong> Conditional updates prevent race conditions and duplicate scans by multiple volunteers simultaneously.
            </p>
            <p>
              • <strong>Event Isolation:</strong> Switching active events never deletes or modifies historical records.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
