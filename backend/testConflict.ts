import prisma from './src/config/database.js';
import { assignTeam, changeCandidateState } from './src/controllers/workflow.controller.js';
import { Request, Response } from 'express';

// Mock Response class to capture status and json
class MockRes {
    public statusCode: number = 200;
    public body: any;

    status(code: number) {
        this.statusCode = code;
        return this;
    }

    json(data: any) {
        this.body = data;
        return this;
    }
}

async function runTest() {
    console.log("--- BẮT ĐẦU TEST CASE: CÙNG VIEW CV VÀ XUNG ĐỘT UPDATE ---");

    // 1. Setup Data
    const teamA = await prisma.teams.upsert({ where: { team_code: 'TEAM_A' }, update: {}, create: { team_code: 'TEAM_A', name: 'Team Alpha' } });
    const teamB = await prisma.teams.upsert({ where: { team_code: 'TEAM_B' }, update: {}, create: { team_code: 'TEAM_B', name: 'Team Beta' } });

    const managerA = await prisma.users.upsert({ where: { username: 'manager_a' }, update: {}, create: { username: 'manager_a', password_hash: '123', full_name: 'Manager A' } });
    const managerB = await prisma.users.upsert({ where: { username: 'manager_b' }, update: {}, create: { username: 'manager_b', password_hash: '123', full_name: 'Manager B' } });

    const stateReview = await prisma.cv_states.findFirst({ where: { state_code: 'Manager_Review' } }) || await prisma.cv_states.create({ data: { state_code: 'Manager_Review', name: 'Manager Review' } });

    // === SCENARIO 1: Manager A PICK CV -> Manager B BỊ 403 VÌ KHÔNG ĐỦ QUYỀN TRƯỚC CẢ KHI CHECK 409 ===
    console.log("\n================ KỊCH BẢN 1 ===================");
    console.log("Manager A NHẬN (PICK) HỒ SƠ => Đổi quyền sở hữu.");
    const cv1 = await prisma.candidates.create({
        data: { name: 'Ứng viên Kịch bản 1', cv_file_path: '/fake/path.pdf', current_state_id: stateReview.id, assigned_team_id: null }
    });

    let view_timestamp_A = cv1.updated_at?.toISOString();
    let view_timestamp_B = cv1.updated_at?.toISOString();

    const reqAMock1 = {
        params: { candidateId: cv1.id.toString() }, body: { view_timestamp: view_timestamp_A },
        user: { userId: managerA.id, username: 'manager_a', roles: ['MANAGER'], permissions: ['MANAGE_TEAM_CANDIDATES'], teamId: teamA.id }
    };
    const reqBMock1 = {
        params: { candidateId: cv1.id.toString() }, body: { view_timestamp: view_timestamp_B },
        user: { userId: managerB.id, username: 'manager_b', roles: ['MANAGER'], permissions: ['MANAGE_TEAM_CANDIDATES'], teamId: teamB.id }
    };

    const resA1 = new MockRes();
    // @ts-ignore
    await assignTeam(reqAMock1, resA1);
    console.log(`=> Lần 1 (A Pick): [HTTP ${resA1.statusCode}] - ${resA1.body.message}`);

    const resB1Old = new MockRes();
    // @ts-ignore
    await assignTeam(reqBMock1, resB1Old);
    console.log(`=> Lần 2 (B Pick với timestamp cũ): [HTTP ${resB1Old.statusCode}] - ${resB1Old.body.message}`);

    const cvAfterA1 = await prisma.candidates.findUnique({ where: { id: cv1.id } });
    const reqBMock1New = {
        params: { candidateId: cv1.id.toString() }, body: { view_timestamp: cvAfterA1?.updated_at?.toISOString() },
        user: { userId: managerB.id, username: 'manager_b', roles: ['MANAGER'], permissions: ['MANAGE_TEAM_CANDIDATES'], teamId: teamB.id }
    };
    const resB1New = new MockRes();
    // @ts-ignore
    await changeCandidateState(reqBMock1New, resB1New);
    console.log(`=> Lần 3 (B đổi State với timestamp mới): [HTTP ${resB1New.statusCode}] - ${resB1New.body.message}`);


    // === SCENARIO 2: Manager A CHỈ ĐỔI STATE (VẪN LÀ CV CHƯA ASSIGN HOẶC CÙNG TEAM) ===
    console.log("\n================ KỊCH BẢN 2 ===================");
    console.log("Manager A đổi State (Manager B CÓ quyền nhưng bị 409 Conflict => B refresh => B thao tác ok)");
    
    // Assume B has MANAGE_ALL_CANDIDATES to simulate HR, or we just leave CV unassigned but A changes state.
    // Wait, assignTeam sets team_id. changeCandidateState changes state but does NOT set team_id unless A is already team A and B is also in team A or B is HR.
    // Let's make B an HR for scenario 2.
    const hrUser = await prisma.users.upsert({ where: { username: 'hr_1' }, update: {}, create: { username: 'hr_1', password_hash: '123', full_name: 'HR 1' } });

    const cv2 = await prisma.candidates.create({
        data: { name: 'Ứng viên Kịch bản 2', cv_file_path: '/fake/path.pdf', current_state_id: stateReview.id, assigned_team_id: null }
    });

    let vtA2 = cv2.updated_at?.toISOString();
    let vtHR2 = cv2.updated_at?.toISOString();

    const stateInterviewing = await prisma.cv_states.findFirst({ where: { state_code: 'Interviewing' } }) || await prisma.cv_states.create({ data: { state_code: 'Interviewing', name: 'Interviewing' } });

    const reqAMock2 = {
        params: { candidateId: cv2.id.toString() }, body: { view_timestamp: vtA2, new_state_code: stateInterviewing.state_code },
        user: { userId: managerA.id, username: 'manager_a', roles: ['MANAGER'], permissions: ['MANAGE_ALL_CANDIDATES'], teamId: teamA.id } // Give A global access so he can change state without assign
    };
    const resA2 = new MockRes();
    // @ts-ignore
    await changeCandidateState(reqAMock2, resA2);
    console.log(`=> Lần 1 (A đổi State): [HTTP ${resA2.statusCode}] - ${resA2.body.message}`);

    const reqHRMockOld = {
        params: { candidateId: cv2.id.toString() }, body: { view_timestamp: vtHR2, new_state_code: stateReview.state_code },
        user: { userId: hrUser.id, username: 'hr_1', roles: ['HR'], permissions: ['MANAGE_ALL_CANDIDATES'], teamId: null }
    };
    const resHROld = new MockRes();
    // @ts-ignore
    await changeCandidateState(reqHRMockOld, resHROld);
    console.log(`=> Lần 2 (HR đổi State với timestamp cũ): [HTTP ${resHROld.statusCode}] - ${resHROld.body.message}`);

    const cvAfterA2 = await prisma.candidates.findUnique({ where: { id: cv2.id } });
    const reqHRMockNew = {
        params: { candidateId: cv2.id.toString() }, body: { view_timestamp: cvAfterA2?.updated_at?.toISOString(), new_state_code: 'Sourcing' },
        user: { userId: hrUser.id, username: 'hr_1', roles: ['HR'], permissions: ['MANAGE_ALL_CANDIDATES'], teamId: null }
    };
    const resHRNew = new MockRes();
    // @ts-ignore
    await changeCandidateState(reqHRMockNew, resHRNew);
    console.log(`=> Lần 3 (HR đổi State với timestamp mới): [HTTP ${resHRNew.statusCode}] - ${resHRNew.body.message}`);

    console.log("\n--- KẾT THÚC TEST CASE ---");
}

runTest().catch(console.error).finally(() => prisma.$disconnect());
