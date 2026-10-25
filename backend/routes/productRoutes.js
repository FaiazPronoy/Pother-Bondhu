import express from 'express';
import {
    countProducts,
    createProduct,
    deleteProduct,
    getAllProducts,
    getLowStockProducts,
    getMostOrderedProducts,
    getProductById,
    updateProduct,
} from '../controllers/productController.js';
import userAuth from '../middleware/userAuth.js';
import adminAuth from '../middleware/adminAuth.js';

const router = express.Router();

router.get('/count', userAuth, adminAuth, countProducts);
router.get('/low-stock', userAuth, adminAuth, getLowStockProducts);
router.get('/most-ordered', userAuth, adminAuth, getMostOrderedProducts);
router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.post('/', userAuth, adminAuth, createProduct);
router.put('/:id', userAuth, adminAuth, updateProduct);
router.delete('/:id', userAuth, adminAuth, deleteProduct);

export default router;
