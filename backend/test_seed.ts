import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding fake 6-month-old CV data...');
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 200);

    const sourcingState = await prisma.cv_states.findUnique({ where: { state_code: 'Sourcing' } });

    const newCandidate = await prisma.candidates.create({
        data: {
            name: 'Cron Test User',
            email: 'cron_test@example.com',
            phone: '0999999991',
            current_state_id: sourcingState!.id,
            cv_file_path: 'fake-path.pdf',
            cv_original_name: 'fake-path.pdf',
            cv_file_size: 1024,
            created_at: sixMonthsAgo,
            updated_at: sixMonthsAgo,
        }
    });

    console.log('Created fake old candidate with ID:', newCandidate.id, 'and updated_at:', newCandidate.updated_at);
}

main().catch(e => {
    console.error(e);
}).finally(async () => {
    await prisma.$disconnect();
});
