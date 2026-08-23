import express from 'express';
import userAuth from '../middleware/userAuth.js';
import { saveUserCart, getUserCart } from '../controllers/cartController.js';

const router = express.Router();

router.get('/', userAuth, getUserCart);
router.post('/', userAuth, saveUserCart);

export default router;
