import { Router } from 'express';
import { authenticateJWT, requireRole } from '../middlewares/auth.middleware.js';
import { getCandidateHistory } from '../controllers/history.controller.js';

const router = Router();

// Endpoint: GET /api/history/candidates/:candidateId
router.get(
    '/candidates/:candidateId',
    authenticateJWT,
    requireRole(['HR', 'MANAGER', 'ADMIN']),
    getCandidateHistory as any
);

export default router;
