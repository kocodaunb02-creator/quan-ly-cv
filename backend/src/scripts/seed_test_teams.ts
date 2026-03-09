import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding test users and teams...');

    // Create Teams
    const team1 = await prisma.teams.upsert({
        where: { team_code: 'TEAM1' },
        update: { name: 'Team1' },
        create: {
            team_code: 'TEAM1',
            name: 'Team1',
            description: 'Test Team 1'
        }
    });

    const team2 = await prisma.teams.upsert({
        where: { team_code: 'TEAM2' },
        update: { name: 'Team2' },
        create: {
            team_code: 'TEAM2',
            name: 'Team2',
            description: 'Test Team 2'
        }
    });

    // Ensure role MANAGER exists
    let managerRole = await prisma.roles.findUnique({
        where: { role_code: 'MANAGER' }
    });

    if (!managerRole) {
        managerRole = await prisma.roles.create({
            data: {
                role_code: 'MANAGER',
                name: 'Manager Role'
            }
        });
    }

    // Create Users
    const passwordHash1 = await bcrypt.hash('team1', 10);
    const user1 = await prisma.users.upsert({
        where: { username: 'team1' },
        update: { password_hash: passwordHash1, full_name: 'User Team 1' },
        create: {
            username: 'team1',
            password_hash: passwordHash1,
            full_name: 'User Team 1'
        }
    });

    const passwordHash2 = await bcrypt.hash('team2', 10);
    const user2 = await prisma.users.upsert({
        where: { username: 'team2' },
        update: { password_hash: passwordHash2, full_name: 'User Team 2' },
        create: {
            username: 'team2',
            password_hash: passwordHash2,
            full_name: 'User Team 2'
        }
    });

    // Assign user roles and teams
    await prisma.user_roles.upsert({
        where: {
            user_id_role_id_team_id: {
                user_id: user1.id,
                role_id: managerRole.id,
                team_id: team1.id
            }
        },
        update: {},
        create: {
            user_id: user1.id,
            username: user1.username,
            role_id: managerRole.id,
            role_code: managerRole.role_code,
            team_id: team1.id,
            team_code: team1.team_code
        }
    });

    await prisma.user_roles.upsert({
        where: {
            user_id_role_id_team_id: {
                user_id: user2.id,
                role_id: managerRole.id,
                team_id: team2.id
            }
        },
        update: {},
        create: {
            user_id: user2.id,
            username: user2.username,
            role_id: managerRole.id,
            role_code: managerRole.role_code,
            team_id: team2.id,
            team_code: team2.team_code
        }
    });

    console.log('Seeding finished successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
