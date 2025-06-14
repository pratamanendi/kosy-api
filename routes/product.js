import express from 'express';
import { getAll, getById, create, update, deleteProduct, deleteProductMeta } from '../controllers/product.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, getAll);
router.get('/:id', getById);
router.post('/', authMiddleware, create);
router.put('/:id', authMiddleware, update);
router.delete('/:id', authMiddleware, deleteProduct);
router.delete('/:id/:key', authMiddleware, deleteProductMeta);

const productRoutes = router;

export default productRoutes;

