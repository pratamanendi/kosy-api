import express from 'express';
import { getAll, getById, create, update, deleteActivity } from '../controllers/activity.js';

const router = express.Router();

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', deleteActivity);

const activitesRoutes = router;

export default activitesRoutes;

