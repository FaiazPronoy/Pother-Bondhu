import express from 'express';
import { placeOrder, getAllOrders, deleteOrder, updateOrderStatus } from '../controllers/orderController.js';
import userAuth from '../middleware/userAuth.js';
import adminAuth from '../middleware/adminAuth.js';

const router = express.Router();

router.post('/place', userAuth, placeOrder);
router.get('/all', userAuth, adminAuth, getAllOrders);
router.delete('/:id', userAuth, adminAuth, deleteOrder);
router.put('/:id', userAuth, adminAuth, updateOrderStatus);

export default router;