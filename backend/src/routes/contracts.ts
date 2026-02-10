import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
    getContractsByProject,
    getContract,
    createContract,
    updateContract,
    deleteContract,
    getInvoicesByContract,
    getAllInvoices,
    createInvoice,
    updateInvoice,
    updateInvoiceStatus,
    deleteInvoice
} from '../controllers/contractController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Contract routes
router.get('/project/:projectId', getContractsByProject);
router.get('/:id', getContract);
router.post('/', createContract);
router.put('/:id', updateContract);
router.delete('/:id', deleteContract);

// Invoice routes (nested under contracts)
router.get('/:contractId/invoices', getInvoicesByContract);
router.post('/invoices', createInvoice);
router.put('/invoices/:id', updateInvoice);
router.patch('/invoices/:id/status', updateInvoiceStatus);
router.delete('/invoices/:id', deleteInvoice);

// Standalone invoice list (for dashboard)
router.get('/invoices/all', getAllInvoices);

export default router;
