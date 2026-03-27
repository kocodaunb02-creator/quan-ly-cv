import { Queue, Worker, Job } from 'bullmq';
import prisma from '../config/database.js';

const connection = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
};

// 1. Khởi tạo Queue
export const cleanupQueue = new Queue('CleanupQueue', { connection });

// 2. Khởi tạo Worker để xử lý công việc dọn dẹp
export const cleanupWorker = new Worker('CleanupQueue', async (job: Job) => {
    console.log(`[Worker] Bắt đầu xử lý dọn dẹp (soft-delete) các hồ sơ CV cũ quá 6 tháng (Job ID: ${job.id})...`);
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180);

    const result = await prisma.candidates.updateMany({
        where: {
            updated_at: {
                lt: sixMonthsAgo
            },
            deleted_at: null
        },
        data: {
            deleted_at: new Date()
        }
    });

    console.log(`[Worker] Hoàn thành. Đã xóa mềm ${result.count} hồ sơ.`);
    return result.count;
}, { connection });

// 3. Lắng nghe các sự kiện (Events) của Worker
cleanupWorker.on('completed', (job: Job) => {
    console.log(`[Worker Event] Job ${job.id} đã hoàn thành thành công!`);
});

cleanupWorker.on('failed', (job: Job | undefined, err: Error) => {
    console.error(`[Worker Event] Job ${job?.id} đã thất bại:`, err.message);
});

// 4. Khởi tạo Repeatable Job (Thay thế định kỳ của node-cron)
const addRepeatableJob = async () => {
    // Xóa các job cũ có cùng pattern nhằm tránh duplicate job khi restart server
    const repeatableJobs = await cleanupQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
        await cleanupQueue.removeRepeatableByKey(job.key);
    }

    await cleanupQueue.add('cleanup-job', {}, {
        repeat: {
            pattern: '0 0 * * *' // Chạy vào 00:00 mỗi ngày
        },
        attempts: 3, // Retry tự động 3 lần nếu fail
        backoff: {
            type: 'exponential',
            delay: 5000 // Chờ 5 giây rồi tăng dần 
        },
        removeOnComplete: 100, // Cấu hình dọn bộ nhớ tự động
        removeOnFail: 1000
    });
    console.log('[Queue] Đã đăng ký Job dọn dẹp định kỳ (00:00 mỗi ngày) trên BullMQ.');
};

addRepeatableJob();
