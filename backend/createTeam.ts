import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const admin = await prisma.users.findFirst({ where: { username: 'admin' } });
        console.log('Admin user:', admin);

        if (!admin) {
            console.log('No admin user found!');
            return;
        }

        const role = await prisma.roles.findFirst({ where: { role_code: 'Admin' } });
        console.log('Role:', role);

        let team = await prisma.teams.findFirst({ where: { team_code: 'TeamAdmin' } });
        if (!team) {
            team = await prisma.teams.create({
                data: { team_code: 'TeamAdmin', name: 'Team Admin', description: 'Development Admin Team' }
            });
            console.log('Created team:', team);
        } else {
            console.log('Found existing team:', team);
        }

        const existingUr = await prisma.user_roles.findFirst({ where: { user_id: admin.id } });
        if (existingUr) {
            const updatedUr = await prisma.user_roles.update({
                where: { id: existingUr.id },
                data: { team_id: team.id, team_code: team.team_code }
            });
            console.log('Updated user_roles:', updatedUr);
        } else {
            const newUr = await prisma.user_roles.create({
                data: {
                    user_id: admin.id,
                    username: admin.username,
                    role_id: role ? role.id : 1,
                    role_code: role ? role.role_code : 'Admin',
                    team_id: team.id,
                    team_code: team.team_code
                }
            });
            console.log('Created user_roles:', newUr);
        }
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
