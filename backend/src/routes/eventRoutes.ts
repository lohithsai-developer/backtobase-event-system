import { Router } from 'express';
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  toggleEventStatus,
  deleteEvent,
} from '../controllers/eventController';
import { requireAdmin } from '../middleware/authMiddleware';

const router = Router();

// All event management routes are admin protected
router.use(requireAdmin);

router.post('/', createEvent);
router.get('/', getEvents);
router.get('/:eventId', getEventById);
router.put('/:eventId', updateEvent);
router.patch('/:eventId/status', toggleEventStatus);
router.delete('/:eventId', deleteEvent);

export default router;
