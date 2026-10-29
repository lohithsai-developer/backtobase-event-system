import { Router } from 'express';
import {
  getTicketByToken,
  sendTicket,
  sendBulkTickets,
  reissueTicket,
  getRegistrationQr,
} from '../controllers/ticketController';
import { requireAdmin } from '../middleware/authMiddleware';

const router = Router();

// Public route to view digital ticket
router.get('/public/:token', getTicketByToken);

// Admin-only ticket operations
router.get('/qr/:registrationId', requireAdmin, getRegistrationQr);
router.post('/send/:registrationId', requireAdmin, sendTicket);
router.post('/send-bulk/:eventId', requireAdmin, sendBulkTickets);
router.post('/reissue/:registrationId', requireAdmin, reissueTicket);

export default router;
