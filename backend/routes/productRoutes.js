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

// GET all products
router.get('/', getAllProducts);

// GET a single product by ID
router.get('/:id', getProductById);
router.post('/', userAuth, adminAuth, createProduct);
router.put('/:id', userAuth, adminAuth, updateProduct);

// DELETE product by ID
router.delete('/:id', userAuth, adminAuth, deleteProduct);

export default router;
