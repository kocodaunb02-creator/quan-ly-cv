import { Router } from 'express';
import { uploadCV } from '../middlewares/upload.middleware.js';
import { authenticateJWT, requireRole } from '../middlewares/auth.middleware.js';
import { uploadCandidateCV, getCandidates, getCandidateById, getCandidateCV, proxyHistoricalCV, updateCandidateById, deleteCandidateById } from '../controllers/candidate.controller.js';

const router = Router();

// Endpoint: POST /api/candidates/upload
// Only HR can upload CVs directly
router.post(
    '/upload',
    authenticateJWT,
    requireRole(['HR', 'ADMIN']),
    uploadCV.single('cvFile'), // 'cvFile' is the field name for the uploaded file
    uploadCandidateCV as any
);

// Endpoint: GET /api/candidates
// Both HR and MANAGER can view candidates (logic inside controller handles filtering)
router.get(
    '/',
    authenticateJWT,
    requireRole(['HR', 'MANAGER', 'ADMIN']),
    getCandidates as any
);

// Endpoint: GET /api/candidates/:id
// View detailed info of a candidate
router.get(
    '/:id',
    authenticateJWT,
    requireRole(['HR', 'MANAGER', 'ADMIN']),
    getCandidateById as any
);

// Endpoint: GET /api/candidates/proxy/cv
// Proxy view historical or any valid CV natively by file path
router.get(
    '/proxy/cv',
    authenticateJWT,
    requireRole(['HR', 'MANAGER', 'ADMIN']),
    proxyHistoricalCV as any
);

// Endpoint: GET /api/candidates/:id/cv
// Proxy view detailed CV natively
router.get(
    '/:id/cv',
    authenticateJWT,
    requireRole(['HR', 'MANAGER', 'ADMIN']),
    getCandidateCV as any
);

// Endpoint: PUT /api/candidates/:id
// Update info of a candidate
router.put(
    '/:id',
    authenticateJWT,
    requireRole(['HR', 'MANAGER', 'ADMIN']),
    uploadCV.single('cvFile'),
    updateCandidateById as any
);

// Endpoint: DELETE /api/candidates/:id
// Soft delete a candidate
router.delete(
    '/:id',
    authenticateJWT,
    requireRole(['HR', 'MANAGER', 'ADMIN']),
    deleteCandidateById as any
);

export default router;
