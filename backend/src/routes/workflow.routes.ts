import { Router } from 'express';
import { authenticateJWT, requireRole } from '../middlewares/auth.middleware.js';
import { assignTeam, changeCandidateState } from '../controllers/workflow.controller.js';

const router = Router();

// Endpoint: POST /api/workflow/candidates/:candidateId/assign
router.post(
    '/candidates/:candidateId/assign',
    authenticateJWT,
    requireRole(['HR', 'MANAGER', 'ADMIN']),
    assignTeam as any
);

// Endpoint: POST /api/workflow/candidates/:candidateId/state
router.post(
    '/candidates/:candidateId/state',
    authenticateJWT,
    requireRole(['HR', 'MANAGER', 'ADMIN']),
    changeCandidateState as any
);

export default router;
