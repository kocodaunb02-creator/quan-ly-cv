import { Request, Response } from 'express';
import prisma from '../config/database.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import fs from 'fs';
import path from 'path';
import { hasCandidateActionPermission } from '../utils/permission.util.js';

export const uploadCandidateCV = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, email, phone, role_code, level, school_code, demo_link, cv_source, note } = req.body;
        const file = req.file;

        if (!file) {
            res.status(400).json({ message: 'Vui lòng đính kèm file CV.' });
            return;
        }

        if (!name) {
            res.status(400).json({ message: 'Tên ứng viên là bắt buộc.' });
            return;
        }

        // Process foreign keys if they exist in request
        let roleId = null;
        if (role_code) {
            const role = await prisma.candidate_roles.findUnique({ where: { role_code } });
            if (role) roleId = role.id;
        }

        let schoolId = null;
        if (school_code) {
            const school = await prisma.schools.findUnique({ where: { school_code } });
            if (school) schoolId = school.id;
        }

        // Default status is 'Sourcing'
        const sourcingState = await prisma.cv_states.findUnique({ where: { state_code: 'Sourcing' } });

        if (!sourcingState) {
            res.status(500).json({ message: 'Chưa cấu hình State "Sourcing" trong hệ thống.' });
            return;
        }

        // Create Candidate Record
        const relativePath = path.relative(path.join(process.cwd(), 'uploads'), file.path).replace(/\\/g, '/');

        const newCandidate = await prisma.candidates.create({
            data: {
                name,
                email,
                phone,
                cv_file_path: relativePath,
                cv_original_name: file.originalname,
                cv_file_size: file.size,
                demo_link,
                level,
                role_id: roleId,
                school_id: schoolId,
                current_state_id: sourcingState.id,
                cv_source,
                note,
            }
        });

        // Create History Log
        await prisma.cv_history.create({
            data: {
                candidate_id: newCandidate.id,
                changed_by_user_id: req.user!.userId,
                new_state_id: sourcingState.id,
                action_type: 'UPLOAD_CV',
                changes_payload: {
                    cv_file: file.originalname,
                    message: 'Đã upload CV ban đầu.'
                }
            }
        });

        res.status(201).json({
            message: 'Upload CV thành công.',
            candidate: newCandidate
        });

    } catch (error: any) {
        console.error('Error uploading CV:', error);
        res.status(500).json({ message: 'Lỗi server nội bộ', error: error.message });
    }
};

export const getCandidates = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userRole = req.user!.roles;
        const teamId = req.user!.teamId;

        // Extract Query params
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;
        const stateFilter = req.query.state as string;
        const levelFilter = req.query.level as string;
        const roleFilter = req.query.role as string;

        const skip = (page - 1) * limit;

        let whereClause: any = { AND: [{ deleted_at: null }] };

        // Role-based visibility logic
        if (!userRole.includes('HR') && userRole.includes('MANAGER')) {
            whereClause.AND.push({
                OR: [
                    { cv_states: { state_code: { in: ['Sourcing', 'Rejected'] } } },
                    { assigned_team_id: teamId }
                ]
            });
        }

        // Search Filter
        if (search) {
            // Unaccented string filter logic. Since Prisma doesn't natively support ignoring accents in all DBs out of the box easily,
            // we will search simply on the fields using 'contains' and 'mode: insensitive'.
            whereClause.AND.push({
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search, mode: 'insensitive' } },
                ]
            });
        }

        // Selection Filters (Support comma-separated multiple values)
        if (stateFilter) {
            whereClause.AND.push({ cv_states: { state_code: { in: stateFilter.split(',') } } });
        }

        if (levelFilter) {
            whereClause.AND.push({ level: { in: levelFilter.split(',') } });
        }

        if (roleFilter) {
            whereClause.AND.push({ candidate_roles: { code: { in: roleFilter.split(',') } } });
        }

        // If AND array only has deleted_at, we can just leave it or it's fine
        if (whereClause.AND.length === 0) {
            whereClause = { deleted_at: null };
        }

        // Get total count
        const total = await prisma.candidates.count({ where: whereClause });

        const candidatesList = await prisma.candidates.findMany({
            where: whereClause,
            skip,
            take: limit,
            include: {
                candidate_roles: true,
                cv_states: true,
                teams: true,
                schools: true,
            },
            orderBy: { created_at: 'desc' }
        });

        // Mask salary for those without VIEW_SALARY permission
        const userPermissions = req.user!.permissions || [];
        if (!userPermissions.includes('VIEW_SALARY')) {
            candidatesList.forEach((c: any) => {
                c.salary_offer = null;
            });
        }

        res.json({
            data: candidatesList,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error: any) {
        res.status(500).json({ message: 'Lỗi truy xuất danh sách CV', error: error.message });
    }
};

export const getCandidateById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const candidateId = parseInt(req.params.id as string);
        const userRole = req.user!.roles;
        const teamId = req.user!.teamId;
        const userPermissions = req.user!.permissions || [];

        const candidate = await prisma.candidates.findFirst({
            where: { id: candidateId, deleted_at: null },
            include: {
                candidate_roles: true,
                cv_states: true,
                teams: true,
                schools: true,
            }
        });

        if (!candidate) {
            res.status(404).json({ message: 'Không tìm thấy ứng viên' });
            return;
        }

        // Verification logic
        if (!userRole.includes('HR') && userRole.includes('MANAGER')) {
            const isAssignedToMyTeam = candidate.assigned_team_id === teamId;
            const isSourcingOrRejected = ['Sourcing', 'Rejected'].includes(candidate.cv_states?.state_code || '');

            if (!isAssignedToMyTeam && !isSourcingOrRejected) {
                res.status(403).json({ message: 'Không có quyền truy cập CV này' });
                return;
            }
        }

        // Mask salary
        if (!userPermissions.includes('VIEW_SALARY')) {
            (candidate as any).salary_offer = null;
        }

        res.json({ data: candidate });

    } catch (error: any) {
        console.error('Lỗi khi lấy chi tiết CV:', error);
        res.status(500).json({ message: 'Lỗi server nội bộ', error: error.message });
    }
};

export const getCandidateCV = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const candidateId = parseInt(req.params.id as string);
        const candidate = await prisma.candidates.findUnique({
            where: { id: candidateId, deleted_at: null }
        });

        if (!candidate || !candidate.cv_file_path) {
            res.status(404).json({ message: 'Không tìm thấy file CV của ứng viên này.' });
            return;
        }

        const absoluteFilePath = path.join(process.cwd(), 'uploads', candidate.cv_file_path);

        if (!fs.existsSync(absoluteFilePath)) {
            res.status(404).json({ message: 'File vật lý không tồn tại trên hệ thống.' });
            return;
        }

        // res.sendFile forces inline if possible (PDF, Images), and downloads otherwise (DOC, DOCX)
        res.sendFile(absoluteFilePath);
    } catch (error: any) {
        console.error('Lỗi khi tải file CV proxy:', error);
        res.status(500).json({ message: 'Lỗi server nội bộ', error: error.message });
    }
};

export const updateCandidateById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const candidateId = parseInt(req.params.id as string);
        const { name, email, phone, role_code, level, school_code, demo_link, salary_offer, cv_source, note, view_timestamp } = req.body;
        const file = req.file;
        const userRole = req.user!.roles;

        // Currently allow HR or MANAGER to update their own candidates (basic restriction)
        const candidate = await prisma.candidates.findFirst({
            where: { id: candidateId, deleted_at: null },
            include: { schools: true, candidate_roles: true }
        });

        if (!candidate) {
            res.status(404).json({ message: 'Không tìm thấy chi tiết hồ sơ.' });
            return;
        }

        // Role Authorization Check
        if (!hasCandidateActionPermission(req.user, candidate)) {
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

        const updateData: any = {};
        const payloadDiff: any = {};
        let auditAction = 'UPDATE_INFO';

        const addDiff = (key: string, oldVal: any, newVal: any) => {
            if (oldVal !== newVal) {
                payloadDiff[key] = { old: oldVal, new: newVal };
            }
        };

        let roleId = candidate.role_id;
        let newRoleName = candidate.candidate_roles?.name;
        if (role_code !== undefined) {
            if (role_code) {
                const role = await prisma.candidate_roles.findUnique({ where: { role_code } });
                roleId = role?.id || null;
                newRoleName = role?.name;
            } else {
                roleId = null;
                newRoleName = undefined;
            }
        }

        let schoolId = candidate.school_id;
        let newSchoolName = candidate.schools?.name;
        if (school_code !== undefined) {
            if (school_code) {
                const school = await prisma.schools.findUnique({ where: { school_code } });
                schoolId = school?.id || null;
                newSchoolName = school?.name;
            } else {
                schoolId = null;
                newSchoolName = undefined;
            }
        }

        if (name !== undefined) { updateData.name = name; addDiff('name', candidate.name, name); }
        if (email !== undefined) { updateData.email = email; addDiff('email', candidate.email, email); }
        if (phone !== undefined) { updateData.phone = phone; addDiff('phone', candidate.phone, phone); }
        if (level !== undefined) { updateData.level = level; addDiff('level', candidate.level, level); }
        if (demo_link !== undefined) { updateData.demo_link = demo_link; addDiff('demo_link', candidate.demo_link, demo_link); }
        if (cv_source !== undefined) { updateData.cv_source = cv_source; addDiff('cv_source', (candidate as any).cv_source, cv_source); }
        if (note !== undefined) { updateData.note = note; addDiff('note', (candidate as any).note, note); }

        if (file) {
            const relativePath = path.relative(path.join(process.cwd(), 'uploads'), file.path).replace(/\\/g, '/');
            updateData.cv_file_path = relativePath;
            updateData.cv_original_name = file.originalname;
            updateData.cv_file_size = file.size;

            if (candidate.cv_file_path) {
                auditAction = 'UPDATE_CV';
                payloadDiff['old_file_path'] = candidate.cv_file_path;
                payloadDiff['old_file_name'] = candidate.cv_original_name;
                payloadDiff['new_file_path'] = relativePath;
                payloadDiff['new_file_name'] = file.originalname;
            } else {
                auditAction = 'UPLOAD_CV';
                payloadDiff['file_path'] = relativePath;
                payloadDiff['file_name'] = file.originalname;
            }
        } else if (req.body.remove_cv === 'true') {
            updateData.cv_file_path = null;
            updateData.cv_original_name = null;
            updateData.cv_file_size = null;

            auditAction = 'DELETE_CV';
            payloadDiff['message'] = 'Đã xóa CV.';
        }

        if (role_code !== undefined) {
            if (roleId) {
                updateData.candidate_roles = { connect: { id: roleId } };
                if (candidate.role_id !== roleId) {
                    addDiff('role_name', candidate.candidate_roles?.name || null, newRoleName);
                }
            } else if (candidate.role_id !== null) {
                updateData.candidate_roles = { disconnect: true };
                addDiff('role_name', candidate.candidate_roles?.name || null, null);
            }
        }

        if (school_code !== undefined) {
            if (schoolId) {
                updateData.schools = { connect: { id: schoolId } };
                if (candidate.school_id !== schoolId) {
                    addDiff('school_name', candidate.schools?.name || null, newSchoolName);
                }
            } else if (candidate.school_id !== null) {
                updateData.schools = { disconnect: true };
                addDiff('school_name', candidate.schools?.name || null, null);
            }
        }

        // HR specific updates
        if (salary_offer !== undefined && req.user!.permissions.includes('VIEW_SALARY')) {
            updateData.salary_offer = salary_offer;
            addDiff('salary_offer', (candidate as any).salary_offer, salary_offer);
        }

        const updatedCandidate = await prisma.candidates.update({
            where: { id: candidateId },
            data: updateData
        });

        // Only create log if there is any change
        if (Object.keys(payloadDiff).length > 0 || auditAction !== 'UPDATE_INFO') {
            await prisma.cv_history.create({
                data: {
                    candidate_id: candidateId,
                    changed_by_user_id: req.user!.userId,
                    action_type: auditAction,
                    changes_payload: payloadDiff
                }
            });
        }

        res.json({ message: 'Cập nhật thành công', data: updatedCandidate });

    } catch (error: any) {
        console.error('Update Error:', error);
        res.status(500).json({ message: 'Lỗi cập nhật', error: error.message });
    }
};

export const deleteCandidateById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const candidateId = parseInt(req.params.id as string);

        const candidate = await prisma.candidates.findFirst({
            where: { id: candidateId, deleted_at: null }
        });

        if (!candidate) {
            res.status(404).json({ message: 'Hồ sơ không tồn tại hoặc đã bị xóa.' });
            return;
        }

        // Soft Delete
        await prisma.candidates.update({
            where: { id: candidateId },
            data: { deleted_at: new Date() }
        });

        await prisma.cv_history.create({
            data: {
                candidate_id: candidateId,
                changed_by_user_id: req.user!.userId,
                action_type: 'DELETE_CV',
                changes_payload: { message: 'Đã xóa hồ sơ (Soft Delete).' }
            }
        });

        res.json({ message: 'Xóa hồ sơ thành công.' });
    } catch (error: any) {
        console.error('Delete Error:', error);
        res.status(500).json({ message: 'Lỗi xóa hồ sơ', error: error.message });
    }
};

export const proxyHistoricalCV = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const queryPath = req.query.path as string;
        if (!queryPath) {
            res.status(400).json({ message: 'Thiếu tham số path file CV.' });
            return;
        }

        const absoluteFilePath = path.resolve(process.cwd(), 'uploads', queryPath);

        // Prevent directory traversal attacks
        if (!absoluteFilePath.startsWith(path.resolve(process.cwd(), 'uploads'))) {
            res.status(403).json({ message: 'Đường dẫn file không hợp lệ.' });
            return;
        }

        if (!fs.existsSync(absoluteFilePath)) {
            res.status(404).json({ message: 'File vật lý không tồn tại trên hệ thống.' });
            return;
        }

        res.sendFile(absoluteFilePath);
    } catch (error: any) {
        console.error('Lỗi khi tải proxy file CV:', error);
        res.status(500).json({ message: 'Lỗi server nội bộ', error: error.message });
    }
};
