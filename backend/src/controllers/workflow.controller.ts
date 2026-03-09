import { Response } from 'express';
import prisma from '../config/database.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { hasCandidateActionPermission } from '../utils/permission.util.js';

export const assignTeam = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { candidateId } = req.params;
        const { team_code, view_timestamp } = req.body; // Hoặc lấy từ token của user nếu là Manager tự pick
        const user = req.user!;

        // Xử lý xác định Team
        let targetTeamId = null;

        // Fetch the fresh team_id from the database to prevent stale JWT team logic
        const dbUserRole = await prisma.user_roles.findFirst({
            where: { user_id: user.userId }
        });
        const currentTeamId = dbUserRole?.team_id || user.teamId;

        if (team_code) {
            // Giữ logic HR có thể assign cho team khác thông qua team_code
            const team = await prisma.teams.findUnique({ where: { team_code } });
            if (team) targetTeamId = team.id;
        } else {
            // Tự động nhận / Pick hồ sơ về team của chính mình
            targetTeamId = currentTeamId;
        }

        if (!targetTeamId) {
            res.status(400).json({ message: 'Không xác định được Team để assign. Tài khoản của bạn có thể chưa được cấu hình Team.' });
            return;
        }

        const candidate = await prisma.candidates.findUnique({
            where: { id: parseInt(candidateId as string) },
            include: { cv_states: true }
        });

        if (!candidate) {
            res.status(404).json({ message: 'Không tìm thấy ứng viên.' });
            return;
        }

        // Role Authorization Check
        if (!hasCandidateActionPermission(user, candidate)) {
            res.status(403).json({ message: 'Bạn không có quyền thao tác do hồ sơ đang được thụ lý bởi phòng ban khác!' });
            return;
        }

        // Optimistic Concurrency Control (OCC) Check
        if (view_timestamp && candidate.updated_at) {
            const dbTime = new Date(candidate.updated_at).getTime();
            const viewTime = new Date(view_timestamp).getTime();
            if (dbTime !== viewTime) {
                res.status(409).json({ message: 'Hồ sơ này vừa có sự thay đổi thông tin hoặc trạng thái từ người dùng khác. Vui lòng xem xét lại trước khi thực hiện tiếp.' });
                return;
            }
        }

        // Cập nhật Database
        await prisma.candidates.update({
            where: { id: candidate.id },
            data: { assigned_team_id: targetTeamId }
        });

        // Chỉ lưu History cho Audit log
        await prisma.cv_history.create({
            data: {
                candidate_id: candidate.id,
                changed_by_user_id: user.userId,
                previous_state_id: candidate.current_state_id,
                new_state_id: candidate.current_state_id,
                action_type: 'ASSIGN_TEAM',
                changes_payload: {
                    assigned_team_id: targetTeamId,
                    message: `Assigned CV to Team ID ${targetTeamId}`
                }
            }
        });

        res.json({ message: 'Assign Team thành công.' });
    } catch (error: any) {
        res.status(500).json({ message: 'Lỗi Assign Team', error: error.message });
    }
};

export const changeCandidateState = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { candidateId } = req.params;
        const { new_state_code, note, view_timestamp } = req.body;
        const user = req.user!;

        const newState = await prisma.cv_states.findUnique({ where: { state_code: new_state_code } });
        if (!newState) {
            res.status(400).json({ message: 'State_code không hợp lệ.' });
            return;
        }

        const candidate = await prisma.candidates.findUnique({ where: { id: parseInt(candidateId as string) } });
        if (!candidate) {
            res.status(404).json({ message: 'Không tìm thấy ứng viên.' });
            return;
        }

        // Role Authorization Check
        if (!hasCandidateActionPermission(user, candidate)) {
            res.status(403).json({ message: 'Bạn không có quyền thao tác do hồ sơ đang được thụ lý bởi phòng ban khác!' });
            return;
        }

        // Optimistic Concurrency Control (OCC) Check
        if (view_timestamp && candidate.updated_at) {
            const dbTime = new Date(candidate.updated_at).getTime();
            const viewTime = new Date(view_timestamp).getTime();
            if (dbTime !== viewTime) {
                res.status(409).json({ message: 'Hồ sơ này vừa có sự thay đổi thông tin hoặc trạng thái từ người dùng khác. Vui lòng xem xét lại trước khi thực hiện tiếp.' });
                return;
            }
        }

        // Cập nhật State
        await prisma.candidates.update({
            where: { id: candidate.id },
            data: { current_state_id: newState.id }
        });

        // Lưu History
        await prisma.cv_history.create({
            data: {
                candidate_id: candidate.id,
                changed_by_user_id: user.userId,
                previous_state_id: candidate.current_state_id,
                new_state_id: newState.id,
                action_type: 'CHANGE_STATE',
                change_reason: note || null,
                changes_payload: {
                    message: `Trạng thái chuyển sang ${new_state_code}`
                }
            }
        });

        res.json({ message: 'Đổi trạng thái CV thành công.' });
    } catch (error: any) {
        res.status(500).json({ message: 'Lỗi chuyển trạng thái CV', error: error.message });
    }
};
