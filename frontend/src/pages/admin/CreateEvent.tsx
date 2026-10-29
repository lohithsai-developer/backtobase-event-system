import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiRequest } from '../../services/api';
import { Calendar, FileText, Type, AlertCircle, ArrowLeft, Save } from 'lucide-react';

export const CreateEvent: React.FC = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    const errList: string[] = [];
    if (!name.trim()) errList.push('Event Name is required.');
    if (!description.trim()) errList.push('Event Description is required.');
    if (!date) errList.push('Event Date is required.');

    if (errList.length > 0) {
      setErrors(errList);
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest('/events', {
        method: 'POST',
        body: JSON.stringify({ name, description, date }),
      });

      if (res.success && res.event) {
        navigate(`/admin/events/${res.event.id}`);
      } else {
        setErrors([res.message || 'Failed to create event.']);
      }
    } catch (err: any) {
      setErrors([err.message || 'Could not save event.']);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      {/* Back button */}
      <div>
        <Link
          to="/admin/events"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-[#00e5ff] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Events</span>
        </Link>
      </div>

      <div className="bg-[#11141c] border border-[#272d3f] rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="border-b border-[#272d3f] pb-6 mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-[#e6be6d]">
            Event Creation Wizard
          </span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            Create BacktoBase Event
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Specify the required event information. Active status is managed globally after creation.
          </p>
        </div>

        {errors.length > 0 && (
          <div className="mb-6 bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-xs text-rose-400 space-y-1">
            <div className="flex items-center gap-2 font-bold mb-1">
              <AlertCircle className="w-4 h-4" />
              <span>Please resolve the following:</span>
            </div>
            {errors.map((err, i) => (
              <div key={i} className="pl-6">• {err}</div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Field 1: Event Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Event Name <span className="text-[#00e5ff]">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Type className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. BacktoBase Bengaluru 2026 Grand Championship"
                className="w-full pl-10 pr-4 py-3 bg-[#171b26] border border-[#272d3f] rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff] transition-all"
              />
            </div>
          </div>

          {/* Field 2: Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Description <span className="text-[#00e5ff]">*</span>
            </label>
            <div className="relative">
              <div className="absolute top-3.5 left-3.5 pointer-events-none text-slate-500">
                <FileText className="w-4 h-4" />
              </div>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide event details, schedule highlights, entrance criteria, etc."
                className="w-full pl-10 pr-4 py-3 bg-[#171b26] border border-[#272d3f] rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff] transition-all"
              ></textarea>
            </div>
          </div>

          {/* Field 3: Date */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Event Date <span className="text-[#00e5ff]">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#171b26] border border-[#272d3f] rounded-xl text-white text-sm focus:outline-none focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff] transition-all"
              />
            </div>
          </div>

          {/* Buttons: Save Event, Cancel */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#272d3f]">
            <button
              type="button"
              onClick={() => navigate('/admin/events')}
              className="px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white bg-[#171b26] border border-[#272d3f] hover:bg-[#1f2433] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#00e5ff] hover:bg-[#33ebff] text-black shadow-lg shadow-[#00e5ff]/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Saving Event...' : 'Save Event'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
