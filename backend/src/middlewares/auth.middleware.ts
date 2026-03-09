import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';

export interface AuthRequest extends Request {
    user?: {
        userId: number;
        username: string;
        roles: string[];
        permissions: string[];
        teamId?: number | null;
    };
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction): void => {
    let token = '';
    const authHeader = req.headers.authorization;

    if (authHeader) {
        token = authHeader.split(' ')[1]; // Bearer <token>
    } else if (req.query.token) {
        token = req.query.token as string;
    }

    if (token) {

        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                res.status(403).json({ message: 'Lỗi xác thực Token. Vui lòng đăng nhập lại.' });
                return;
            }
            req.user = user as AuthRequest['user'];
            next();
        });
    } else {
        res.status(401).json({ message: 'Truy cập bị từ chối. Vui lòng cung cấp Token.' });
    }
};

export const requireRole = (requiredRoles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ message: 'Chưa đăng nhập.' });
            return;
        }

        const hasRole = req.user.roles.some((r) => requiredRoles.includes(r));
        if (!hasRole) {
            res.status(403).json({ message: 'Bạn không có quyền truy cập chức năng này.' });
            return;
        }

        next();
    };
};
