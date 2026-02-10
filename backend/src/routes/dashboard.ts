import { Router } from 'express';
import { getBillingSummary } from '../controllers/dashboardController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/billing-summary', authenticateToken, getBillingSummary);

export default router;
