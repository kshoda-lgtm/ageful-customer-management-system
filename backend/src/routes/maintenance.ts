import { Router } from 'express';
import { getMaintenanceLogs, getAllMaintenanceLogs, createMaintenanceLog, updateMaintenanceLog } from '../controllers/maintenanceController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Get all maintenance logs (for listing page)
router.get('/all', authenticateToken, getAllMaintenanceLogs);

// Route for generic maintenance ops
router.post('/', authenticateToken, createMaintenanceLog);
router.put('/:id', authenticateToken, updateMaintenanceLog);

// Note: Get logs by project is often handled as sub-resource in projects route
// But can be here too: GET /api/maintenance?project_id=1
router.get('/', authenticateToken, getMaintenanceLogs);

export default router;
