import { Router } from 'express';
import {
  getAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} from '../controllers/announcementController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getAnnouncements);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN', 'MENTOR'), createAnnouncement);

router.get('/:id', getAnnouncement);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'MENTOR'), updateAnnouncement);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'MENTOR'), deleteAnnouncement);

export default router;
