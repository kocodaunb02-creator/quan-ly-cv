import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, password } = req.body;

        // Validate Input
        if (!username || !password) {
            res.status(400).json({ message: 'Vui lòng cung cấp username và password.' });
            return;
        }

        // 1. Check user exists
        const user = await prisma.users.findUnique({
            where: { username },
            include: {
                user_roles: {
                    include: {
                        roles: {
                            include: {
                                role_permissions: {
                                    include: {
                                        permissions: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!user) {
            res.status(401).json({ message: 'Tài khoản không tồn tại.' });
            return;
        }

        // 2. Check password
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            res.status(401).json({ message: 'Mật khẩu không chính xác.' });
            return;
        }

        // 3. Extract Roles, Permissions, and Team Info
        const roles = user.user_roles.map((r: any) => r.role_code);
        const teamId = user.user_roles.find((r: any) => r.role_code === 'MANAGER')?.team_id || null;

        let permissionsSet = new Set<string>();
        user.user_roles.forEach((ur: any) => {
            if (ur.roles && ur.roles.role_permissions) {
                ur.roles.role_permissions.forEach((rp: any) => {
                    if (rp.permissions) {
                        permissionsSet.add(rp.permissions.permission_code);
                    }
                });
            }
        });
        const permissions = Array.from(permissionsSet);

        // 4. Generate JWT Token
        const token = jwt.sign(
            {
                userId: user.id,
                username: user.username,
                roles,
                permissions,
                teamId,
            },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            message: 'Đăng nhập thành công',
            token,
            user: {
                id: user.id,
                username: user.username,
                fullName: user.full_name,
                roles,
                permissions,
                teamId
            }
        });
    } catch (error: any) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Lỗi server nội bộ', error: error.message });
    }
};
