export interface EventItem {
  id: string;
  name: string;
  description: string;
  date: string;
  status: 'active' | 'inactive';
  createdAt?: string;
  totalParticipants: number;
  totalAttended: number;
  remainingParticipants: number;
  attendancePercentage: number;
}

export interface ParticipantItem {
  id: string;
  registrationId: string;
  name: string;
  email: string;
  ticketEmailStatus: 'pending' | 'sent' | 'failed' | 'delivered';
  attendanceStatus: 'Yes' | 'No';
  rawAttendanceStatus: 'checked_in' | 'not_checked_in';
  checkedInAt?: string;
  ticketVersion?: number;
  createdAt?: string;
}

export interface AttendanceRecord {
  name: string;
  email: string;
  checkedIn: 'Yes' | 'No';
}

export interface ScanHistoryItem {
  id: string;
  registrationId: string;
  name: string;
  email: string;
  checkedInAt: string;
  checkedInBy: string;
}

export interface UserAuth {
  id: string;
  username: string;
  role: 'admin' | 'volunteer';
}
