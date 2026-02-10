import { Router } from 'express';
import { getCustomers, getCustomerById, createCustomer, updateCustomer } from '../controllers/customerController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getCustomers);
router.get('/:id', authenticateToken, getCustomerById);
router.post('/', authenticateToken, createCustomer);
router.put('/:id', authenticateToken, updateCustomer);

export default router;
