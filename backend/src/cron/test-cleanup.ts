import prisma from '../config/database.js';

async function runManualCleanup() {
    console.log('🚀 [Manual Test] Bắt đầu chạy logic quét dọn (soft-delete) các hồ sơ CV cũ quá 6 tháng...');
    try {
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

        console.log(`✅ [Manual Test] Chạy thành công. Hệ thống đã tìm thấy và xóa mềm (Soft-Delete) ${result.count} hồ sơ.`);
        
        // Disconnect Prisma
        await prisma.$disconnect();
    } catch (error) {
        console.error('❌ [Manual Test] Lỗi trong quá trình dọn dẹp:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

runManualCleanup();
