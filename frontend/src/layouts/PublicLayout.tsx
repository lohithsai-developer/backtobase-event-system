import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#08090c] text-white flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-[#272d3f] bg-[#0d0f15] py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/backtobase-logo.png" alt="BacktoBase" className="h-8 w-auto object-contain" />
            <span className="text-[#e6be6d] font-bold">BacktoBase Mega Event Management</span>
          </div>
          <div>
            &copy; {new Date().getFullYear()} BacktoBase. All rights reserved. <span className="text-[#00e5ff] font-semibold">LEGENDS UPGRADE</span>.
          </div>
        </div>
      </footer>
    </div>
  );
};
