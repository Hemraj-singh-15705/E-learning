import { Router } from 'express';
import { getBusinessReports } from '../controllers/reportController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'ADMIN'));

router.get('/business', getBusinessReports);

export default router;
