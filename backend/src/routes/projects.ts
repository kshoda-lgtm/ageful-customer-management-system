import { Router } from 'express';
import { getProjectById, updateProject, getProjectSpecs, createProject, getProjects } from '../controllers/projectController';
import { getMaintenanceLogs } from '../controllers/maintenanceController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
router.get('/:id/maintenance', authenticateToken, getMaintenanceLogs);

router.get('/', authenticateToken, getProjects);

router.post('/', authenticateToken, createProject);
router.get('/:id', authenticateToken, getProjectById);
router.put('/:id', authenticateToken, updateProject);
router.get('/:id/specs', authenticateToken, getProjectSpecs);

export default router;
