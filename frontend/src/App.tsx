import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PublicLayout } from './layouts/PublicLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Public Pages
import { PublicDashboard } from './pages/public/PublicDashboard';
import { TicketView } from './pages/public/TicketView';

// Admin Pages
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { EventsList } from './pages/admin/EventsList';
import { CreateEvent } from './pages/admin/CreateEvent';
import { EventDetails } from './pages/admin/EventDetails';
import { ParticipantsManagement } from './pages/admin/ParticipantsManagement';
import { TicketsManagement } from './pages/admin/TicketsManagement';
import { AttendanceTable } from './pages/admin/AttendanceTable';
import { ScanHistory } from './pages/admin/ScanHistory';
import { Settings } from './pages/admin/Settings';

// Volunteer / Staff Pages
import { VolunteerScanner } from './pages/volunteer/VolunteerScanner';
import { InstallPrompt } from './components/InstallPrompt';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Portal Route */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<PublicDashboard />} />
          </Route>

          {/* Standalone Participant Digital Pass (Zero Admin/Volunteer UI) */}
          <Route path="/ticket/:token" element={<TicketView />} />

          {/* Authentication Routes - Only Admin Login */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/volunteer/login" element={<Navigate to="/volunteer/scanner" replace />} />

          {/* Gate Entry Scanner (No login required) */}
          <Route path="/volunteer/scanner" element={<VolunteerScanner />} />
          <Route path="/scanner" element={<VolunteerScanner />} />

          {/* Protected Admin Console Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="events" element={<EventsList />} />
            <Route path="events/new" element={<CreateEvent />} />
            <Route path="events/:eventId" element={<EventDetails />} />
            <Route path="events/:eventId/participants" element={<ParticipantsManagement />} />
            <Route path="events/:eventId/tickets" element={<TicketsManagement />} />
            <Route path="events/:eventId/attendance" element={<AttendanceTable />} />
            <Route path="events/:eventId/history" element={<ScanHistory />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <InstallPrompt />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
