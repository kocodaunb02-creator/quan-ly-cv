import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Permissions...');

    // 1. Create permissions
    const permAll = await prisma.permissions.upsert({
        where: { permission_code: 'MANAGE_ALL_CANDIDATES' },
        update: { name: 'Manage All Candidates (HR/Admin)' },
        create: {
            permission_code: 'MANAGE_ALL_CANDIDATES',
            name: 'Manage All Candidates (HR/Admin)'
        }
    });

    const permTeam = await prisma.permissions.upsert({
        where: { permission_code: 'MANAGE_TEAM_CANDIDATES' },
        update: { name: 'Manage Team Candidates (Manager)' },
        create: {
            permission_code: 'MANAGE_TEAM_CANDIDATES',
            name: 'Manage Team Candidates (Manager)'
        }
    });

    console.log('Created Permissions:', permAll.permission_code, permTeam.permission_code);

    // 2. Fetch Roles
    const roles = await prisma.roles.findMany();

    // Admin & HR -> MANAGE_ALL_CANDIDATES
    const adminRole = roles.find(r => r.role_code === 'ADMIN');
    const hrRole = roles.find(r => r.role_code === 'HR');

    if (adminRole) {
        await prisma.role_permissions.upsert({
            where: { role_id_permission_id: { role_id: adminRole.id, permission_id: permAll.id } },
            update: {},
            create: { role_id: adminRole.id, permission_id: permAll.id }
        });
        console.log(`Assigned ${permAll.permission_code} to ADMIN`);
    }

    if (hrRole) {
        await prisma.role_permissions.upsert({
            where: { role_id_permission_id: { role_id: hrRole.id, permission_id: permAll.id } },
            update: {},
            create: { role_id: hrRole.id, permission_id: permAll.id }
        });
        console.log(`Assigned ${permAll.permission_code} to HR`);
    }

    // Manager -> MANAGE_TEAM_CANDIDATES
    const managerRole = roles.find(r => r.role_code === 'MANAGER');
    if (managerRole) {
        await prisma.role_permissions.upsert({
            where: { role_id_permission_id: { role_id: managerRole.id, permission_id: permTeam.id } },
            update: {},
            create: { role_id: managerRole.id, permission_id: permTeam.id }
        });
        console.log(`Assigned ${permTeam.permission_code} to MANAGER`);
    }

    console.log('Seeding Permissions finished successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
