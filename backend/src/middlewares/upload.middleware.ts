import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Ensure uploads directory exists
const baseUploadDir = path.join(process.cwd(), 'uploads', 'candidates');
if (!fs.existsSync(baseUploadDir)) {
    fs.mkdirSync(baseUploadDir, { recursive: true });
}

// Set up storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadId = crypto.randomUUID();
        const uploadDir = path.join(baseUploadDir, uploadId);
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        // Decode multer's default latin1 to utf8
        file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
        // Sanctuary filename but keep unicode letters (Vietnamese characters)
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_\p{L}]/gu, '_');
        cb(null, `${timestamp}_${safeName}`);
    }
});

// File filter for CVs (PDF, DOC, DOCX)
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ cho phép file PDF, DOC hoặc DOCX!'));
    }
};

export const uploadCV = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10 MB limit
    }
});
