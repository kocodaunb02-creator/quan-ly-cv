import { AuthRequest } from '../middlewares/auth.middleware.js';

/**
 * Kiểm tra xem user hiện tại có quyền thao tác (Edit/Assign/ChangeState) trên hồ sơ này hay không.
 * @param user Thông tin user từ JWT (req.user)
 * @param candidate Thông tin candidate từ DB (phải include cv_states)
 * @returns boolean true nếu được phép, false nếu bị chặn
 */
export const hasCandidateActionPermission = (user: AuthRequest['user'], candidate: any): boolean => {
    if (!user) return false;

    const userPermissions = user.permissions || [];

    // 1. MANAGE_ALL_CANDIDATES: Full Access
    if (userPermissions.includes('MANAGE_ALL_CANDIDATES')) {
        return true;
    }

    // 2. MANAGE_TEAM_CANDIDATES: Filter by Team and State
    if (userPermissions.includes('MANAGE_TEAM_CANDIDATES')) {
        const isUnassigned = candidate.assigned_team_id === null;
        const isAssignedToMyTeam = candidate.assigned_team_id === user.teamId;
        const isSourcingOrRejected = ['Sourcing', 'Rejected'].includes(candidate.cv_states?.state_code || '');

        if (isUnassigned || isSourcingOrRejected || isAssignedToMyTeam) {
            return true;
        }
    }

    // Nếu là roles khác (bình thường), mặc định không cho phép thao tác sửa
    // Trừ khi có các permission cụ thể khác (hiện chưa define)
    return false;
};
