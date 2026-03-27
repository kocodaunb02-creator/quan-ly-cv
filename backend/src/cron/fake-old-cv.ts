import prisma from '../config/database.js';

async function fakeOldCV() {
    console.log('🚀 [Fake Data] Bắt đầu tìm ngẫu nhiên 1 CV và lùi ngày cập nhật (updated_at) về 7 tháng trước...');
    try {
        // Lấy CV mới nhất chưa bị xóa
        const candidate = await prisma.candidates.findFirst({
            where: { deleted_at: null },
            orderBy: { id: 'desc' },
            select: { id: true, name: true, phone: true }
        });

        if (!candidate) {
            console.log('❌ Không tìm thấy CV nào trong hệ thống để fake dữ liệu. Vui lòng tạo 1 CV trước trên Giao diện!');
            await prisma.$disconnect();
            return;
        }

        const sevenMonthsAgo = new Date();
        sevenMonthsAgo.setDate(sevenMonthsAgo.getDate() - 210); // Lùi lại khoảng 7 tháng

        await prisma.candidates.update({
            where: { id: candidate.id },
            data: { updated_at: sevenMonthsAgo }
        });

        console.log(`✅ Đã lùi ngày hồ sơ của ứng viên [${candidate.name} - ID: ${candidate.id}] về Date: ${sevenMonthsAgo.toISOString()}`);
        console.log(`👉 Bây giờ bạn có thể thử chạy job dọn dẹp để xem hệ thống có xóa mềm hồ sơ tuổi thọ ${sevenMonthsAgo.toISOString()} này không nhé!`);

        await prisma.$disconnect();
    } catch (error) {
        console.error('❌ Lỗi:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

fakeOldCV();
