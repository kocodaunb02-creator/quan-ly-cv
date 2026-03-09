import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const unusedStates = ['HR_Screening', 'Onboarding'];

        console.log(`Soft deleting unused states: ${unusedStates.join(', ')}`);

        // Check if there are any candidates currently in these states before soft deleting
        const candidatesInUnusedStates = await prisma.candidates.findMany({
            where: {
                cv_states: {
                    state_code: {
                        in: unusedStates as any
                    }
                }
            },
            include: { cv_states: true }
        });

        if (candidatesInUnusedStates.length > 0) {
            console.log(`Warning: Found ${candidatesInUnusedStates.length} candidates in unused states. Moving them to 'Sourcing' before deleting states...`);

            const sourcingState = await prisma.cv_states.findUnique({
                where: { state_code: 'Sourcing' }
            });

            if (sourcingState) {
                await prisma.candidates.updateMany({
                    where: {
                        cv_states: {
                            state_code: {
                                in: unusedStates as any
                            }
                        }
                    },
                    data: {
                        current_state_id: sourcingState.id
                    }
                });
                console.log('Successfully moved candidates to Sourcing.');
            }
        }

        const res = await prisma.cv_states.updateMany({
            where: {
                state_code: {
                    in: unusedStates as any
                }
            },
            data: {
                deleted_at: new Date()
            }
        });

        console.log(`Successfully soft-deleted ${res.count} states.`);
    } catch (error) {
        console.error('Error soft-deleting states:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
