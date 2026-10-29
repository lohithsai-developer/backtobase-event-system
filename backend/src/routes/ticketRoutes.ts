import { Router } from 'express';
import {
  getTicketByToken,
  sendTicket,
  sendBulkTickets,
  reissueTicket,
  getRegistrationQr,
  getAllTicketLinks,
  exportTicketLinks,
} from '../controllers/ticketController';
import { requireAdmin, optionalAuth } from '../middleware/authMiddleware';

const router = Router();

// Public route to view digital ticket
router.get('/public/:token', getTicketByToken);

// Ticket links: retrieve and export all links at once
router.get('/links/:eventId', optionalAuth, getAllTicketLinks);
router.get('/links/:eventId/export', optionalAuth, exportTicketLinks);

// Admin-only ticket operations
router.get('/qr/:registrationId', optionalAuth, getRegistrationQr);
router.post('/send/:registrationId', optionalAuth, sendTicket);
router.post('/send-bulk/:eventId', requireAdmin, sendBulkTickets);
router.post('/reissue/:registrationId', requireAdmin, reissueTicket);

export default router;
