import { Response } from 'express';
import prisma from '../config/database.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

export const getCandidateHistory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { candidateId } = req.params;
        const userRole = req.user!.roles;
        const teamId = req.user!.teamId;

        // Verify Candidate visibility first
        const candidate = await prisma.candidates.findUnique({
            where: { id: parseInt(candidateId as string) },
            include: { cv_states: true }
        });

        if (!candidate) {
            res.status(404).json({ message: 'Không tìm thấy ứng viên.' });
            return;
        }

        // Manager can only view history if CV is Sourcing, Rejected, or Assigned to their Team
        if (!userRole.includes('HR') && userRole.includes('MANAGER')) {
            const isSourcingOrRejected = ['Sourcing', 'Rejected'].includes(candidate.cv_states?.state_code || '');
            const isAssignedToMe = candidate.assigned_team_id === teamId;

            if (!isSourcingOrRejected && !isAssignedToMe) {
                res.status(403).json({ message: 'Bạn không có quyền xem lịch sử của CV này.' });
                return;
            }
        }

        const historyLogs = await prisma.cv_history.findMany({
            where: { candidate_id: candidate.id },
            include: {
                users: {
                    select: { id: true, username: true, full_name: true }
                },
                cv_states_cv_history_previous_state_idTocv_states: true,
                cv_states_cv_history_new_state_idTocv_states: true,
            },
            orderBy: { created_at: 'desc' }
        });

        res.json({ data: historyLogs });

    } catch (error: any) {
        res.status(500).json({ message: 'Lỗi lấy danh sách lịch sử', error: error.message });
    }
};
