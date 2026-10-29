import { Router } from 'express';
import {
  scanTicket,
  getEventAttendance,
  exportAttendance,
  getScanHistory,
} from '../controllers/attendanceController';
import { requireAdmin, optionalAuth } from '../middleware/authMiddleware';

const router = Router();

// Scan ticket: accessible without login by staff / volunteers, or with Admin auth
router.post('/scan', optionalAuth, scanTicket);

// Admin attendance review & export
router.get('/event/:eventId', requireAdmin, getEventAttendance);
router.get('/event/:eventId/export', requireAdmin, exportAttendance);
router.get('/event/:eventId/history', requireAdmin, getScanHistory);

export default router;
