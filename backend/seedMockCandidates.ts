import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const states = [
    'Sourcing',
    'HR_Screening',
    'Manager_Review',
    'Interviewing',
    'Offering',
    'Onboarding',
    'Rejected'
];

async function main() {
    try {
        const stateMapping = await prisma.cv_states.findMany();
        const stateIdMap: Record<string, number> = {};
        for (const s of stateMapping) {
            stateIdMap[s.state_code] = s.id;
        }

        const roles = await prisma.candidate_roles.findMany();
        const roleId = roles.length > 0 ? roles[0].id : null;

        console.log('Generating 20 mock candidates...');

        for (let i = 1; i <= 20; i++) {
            // Pick a state round-robin
            const stateCode = states[i % states.length];
            const currentStateId = stateIdMap[stateCode];

            await prisma.candidates.create({
                data: {
                    name: `Mock Candidate ${i}`,
                    email: `candidate${i}@mock.test`,
                    phone: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
                    cv_file_path: '/uploads/dummy_cv.pdf',
                    cv_original_name: `CV_Mock_${i}.pdf`,
                    cv_file_size: 1024567,
                    cv_source: 'LinkedIn',
                    demo_link: `https://github.com/mock${i}`,
                    note: `Generated for testing state: ${stateCode}`,
                    level: ['Junior', 'Middle', 'Senior'][i % 3],
                    role_id: roleId,
                    current_state_id: currentStateId,
                    salary_offer: i % 2 === 0 ? 15000000 : null
                }
            });
        }

        console.log('Successfully generated 20 candidates across all states.');
    } catch (err) {
        console.error('Error seeding candidates:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
