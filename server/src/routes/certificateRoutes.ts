import { Router } from 'express';
import {
  verifyCertificate,
  getMyCertificates,
  getCertificates,
  issueCertificate,
  revokeCertificate
} from '../controllers/certificateController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public certificate verification route
router.get('/verify/:code', verifyCertificate);

// Protected student certificates portfolio
router.get('/my-certificates', authenticate, getMyCertificates);

// Protected Admin / Mentor Certificate Ledger
router.get('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'MENTOR'), getCertificates);
router.post('/issue', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'MENTOR'), issueCertificate);
router.patch('/:id/revoke', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), revokeCertificate);

export default router;
