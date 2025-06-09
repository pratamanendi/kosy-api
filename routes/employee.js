import express from 'express';
import { getAll, getById, create, update, deleteEmployee } from '../controllers/employee.js';

const router = express.Router();

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', deleteEmployee);

const employeeRoutes = router;

export default employeeRoutes;
