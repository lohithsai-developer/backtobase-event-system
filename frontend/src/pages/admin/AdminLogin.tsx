import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';
import { ShieldCheck, Lock, User, AlertCircle, ArrowLeft } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState('-admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const data = await apiRequest('/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      if (data.success && data.token) {
        login(data.token, data.user);
        navigate('/admin/dashboard');
      } else {
        setError(data.message || 'Login failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid administrator username or password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090c] flex flex-col justify-center items-center px-4 py-12">
      {/* Return link */}
      <div className="w-full max-w-md mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-[#00e5ff] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Main Portal</span>
        </Link>
      </div>

      <div className="w-full max-w-md bg-[#11141c] border border-[#272d3f] rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#e6be6d]/5 rounded-full blur-2xl pointer-events-none"></div>

        {/* Brand Header */}
        <div className="text-center mb-8">
          <img
            src="/backtobase-logo.png"
            alt="BacktoBase Logo"
            className="h-20 w-auto mx-auto object-contain mb-4"
          />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e6be6d]/10 border border-[#e6be6d]/30 text-[#e6be6d] text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Administrator Access</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Admin Console Login</h2>
          <p className="text-xs text-slate-400 mt-1">
            Sign in with authorized credentials to manage events, participants &amp; tickets.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-start gap-3 text-rose-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Admin Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin"
                className="w-full pl-10 pr-4 py-3 bg-[#171b26] border border-[#272d3f] rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#e6be6d] focus:ring-1 focus:ring-[#e6be6d] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-3 bg-[#171b26] border border-[#272d3f] rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#e6be6d] focus:ring-1 focus:ring-[#e6be6d] transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-[#e6be6d] hover:bg-[#eed08c] text-black shadow-lg shadow-[#e6be6d]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In to Admin Console</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#272d3f] text-center">
          <p className="text-xs text-slate-500">
            Need to scan attendee tickets?{' '}
            <Link to="/volunteer/scanner" className="text-[#00e5ff] font-bold hover:underline">
              Open Ticket Scanner
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
