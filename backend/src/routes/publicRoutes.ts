import { Router } from 'express';
import { getPublicActiveEvent } from '../controllers/publicController';

const router = Router();

router.get('/active-event', getPublicActiveEvent);

export default router;
