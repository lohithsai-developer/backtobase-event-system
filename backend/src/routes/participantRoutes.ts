import { Router } from 'express';
import multer from 'multer';
import {
  addParticipant,
  previewImport,
  importParticipants,
  getEventParticipants,
  deleteRegistration,
} from '../controllers/participantController';
import { requireAdmin } from '../middleware/authMiddleware';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

const router = Router();

router.use(requireAdmin);

// Participant operations within an event
router.post('/event/:eventId', addParticipant);
router.post('/event/:eventId/import-preview', upload.single('file'), previewImport);
router.post('/event/:eventId/import', upload.single('file'), importParticipants);
router.get('/event/:eventId', getEventParticipants);
router.delete('/registration/:registrationId', deleteRegistration);

export default router;
