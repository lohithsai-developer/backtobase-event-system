import { Router } from 'express';
import { adminLogin, volunteerLogin, getMe } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';
import { loginLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/admin/login', loginLimiter, adminLogin);
router.post('/volunteer/login', loginLimiter, volunteerLogin);
router.get('/me', authenticate, getMe);

export default router;
