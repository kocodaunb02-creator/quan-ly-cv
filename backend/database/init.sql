-- Khởi tạo Database Schema cho QuanLyCV (Recruitment Lifecycle) v2.3
-- Rule-Coding: Sử dụng SERIAL (INT) thay cho UUID. Đổi tên cột code thành rolecode / statecode.

CREATE TYPE cv_status_enum AS ENUM ('Sourcing', 'HR_Screening', 'Manager_Review', 'Interviewing', 'Offering', 'Onboarding', 'Rejected');

-- 1. Bảng Teams (Nhóm dự án)
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    team_code VARCHAR(50) NOT NULL UNIQUE, -- UNIQUE: Mã code của Team (VD: TEAM_A)
    name VARCHAR(255) NOT NULL UNIQUE, -- UNIQUE: Tên hiển thị của Team
    description TEXT, -- Mô tả chi tiết về Team
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP -- Soft Delete: Thời gian xóa mềm
);

-- 2. Bảng Roles (Định nghĩa quyền hệ thống: HR, Manager...)
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    role_code VARCHAR(50) NOT NULL UNIQUE, -- UNIQUE: Mã nhóm quyền (VD: HR, MANAGER)
    name VARCHAR(255) NOT NULL, -- Tên hiển thị của nhóm quyền
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP -- Soft Delete
);

-- Bảng Permissions (Chi tiết từng quyền cụ thể: VIEW_SALARY, CHANGE_STATE...)
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    permission_code VARCHAR(50) NOT NULL UNIQUE, -- UNIQUE: Mã quyền chi tiết (VD: VIEW_SALARY)
    name VARCHAR(255) NOT NULL, -- Tên hiển thị của quyền
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP -- Soft Delete
);

-- Bảng mapping Roles - Permissions (1 Role có nhiều Permission)
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INT NOT NULL REFERENCES roles (id) ON DELETE CASCADE, -- FK: Liên kết tới bảng roles
    permission_id INT NOT NULL REFERENCES permissions (id) ON DELETE CASCADE, -- FK: Liên kết tới bảng permissions
    PRIMARY KEY (role_id, permission_id)
);

-- 3. Bảng Users (HR & Managers)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE, -- UNIQUE: Tên đăng nhập
    password_hash VARCHAR(255) NOT NULL, -- Mật khẩu đã được mã hóa
    full_name VARCHAR(255) NOT NULL, -- Họ và tên đầy đủ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP -- Soft Delete
);

-- Bảng mapping User - Roles - Teams (Xác định Role của User thuộc Team nào)
-- Đã thêm username, role_code, team_code để tiện truy vấn nhanh (Denormalization)
CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users (id) ON DELETE CASCADE, -- FK: Liên kết tới bảng users
    username VARCHAR(100) NOT NULL, -- Denormalized: Tên đăng nhập
    role_id INT NOT NULL REFERENCES roles (id) ON DELETE CASCADE, -- FK: Liên kết tới bảng roles
    role_code VARCHAR(50) NOT NULL, -- Denormalized: Mã quyền (VD: HR, MANAGER)
    team_id INT REFERENCES teams (id) ON DELETE CASCADE, -- FK: Nullable - Liên kết tới bảng teams
    team_code VARCHAR(50), -- Denormalized - Nullable: Mã Team
    UNIQUE (user_id, role_id, team_id)
);

-- 4. Bảng Candidate Roles (Vị trí chuyên môn: Artist, Dev...)
CREATE TABLE IF NOT EXISTS candidate_roles (
    id SERIAL PRIMARY KEY,
    role_code VARCHAR(50) NOT NULL UNIQUE, -- UNIQUE: Mã vị trí (VD: ARTIST, DEV)
    name VARCHAR(255) NOT NULL, -- Tên vị trí tuyển dụng
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP -- Soft Delete
);

-- 5. Bảng CV States (Trạng thái quy trình tuyển dụng)
CREATE TABLE IF NOT EXISTS cv_states (
    id SERIAL PRIMARY KEY,
    state_code cv_status_enum NOT NULL UNIQUE, -- ENUM/UNIQUE: Mã trạng thái (VD: Sourcing)
    name VARCHAR(255) NOT NULL, -- Tên hiển thị của trạng thái
    display_order INT DEFAULT 0, -- Thứ tự hiển thị UI Progress Flow
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP -- Soft Delete
);

-- Bảng Schools (Trường học / Đơn vị đào tạo)
CREATE TABLE IF NOT EXISTS schools (
    id SERIAL PRIMARY KEY,
    school_code VARCHAR(50) NOT NULL UNIQUE, -- UNIQUE: Tên viết tắt trường (VD: HUST)
    name VARCHAR(255) NOT NULL, -- Tên đầy đủ của trường
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP -- Soft Delete
);

-- 6. Bảng Candidates (Hồ sơ ứng viên)
CREATE TABLE IF NOT EXISTS candidates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL, -- Họ và tên ứng viên
    email VARCHAR(255), -- Địa chỉ Email
    phone VARCHAR(50), -- Số điện thoại liên hệ
    cv_file_path TEXT NOT NULL, -- Đường dẫn lưu trữ file CV trên server/cloud
    cv_original_name VARCHAR(255), -- Tên file CV gốc lúc upload
    cv_file_size INT, -- Dung lượng file CV (bytes)
    school_id INT REFERENCES schools (id) ON DELETE SET NULL, -- FK: Liên kết tới bảng schools
    demo_link TEXT, -- Nullable: Link Portfolio hoặc Demo sản phẩm
    role_id INT REFERENCES candidate_roles (id), -- FK: Liên kết tới bảng candidate_roles
    current_state_id INT REFERENCES cv_states (id), -- FK: Liên kết tới bảng cv_states
    salary_offer DECIMAL(15, 2), -- Mức lương đề xuất (Chỉ HR được xem)
    assigned_team_id INT REFERENCES teams (id) ON DELETE SET NULL, -- FK: Liên kết tới bảng teams
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP -- Soft Delete
);

-- 7. Bảng CV History (Lịch sử luân chuyển & Audit Log)
CREATE TABLE IF NOT EXISTS cv_history (
    id SERIAL PRIMARY KEY,
    candidate_id INT NOT NULL REFERENCES candidates (id) ON DELETE CASCADE, -- FK: Liên kết tới bảng candidates
    changed_by_user_id INT NOT NULL REFERENCES users (id), -- FK: Liên kết tới bảng users
    previous_state_id INT REFERENCES cv_states (id), -- FK: Nullable - Trạng thái trước (Dùng cho Funnel)
    new_state_id INT REFERENCES cv_states (id), -- FK: Nullable - Trạng thái mới (Dùng cho Funnel)
    action_type VARCHAR(50) NOT NULL, -- Loại hành động (VD: CHANGE_STATE, UPDATE_INFO, ASSIGN_TEAM)
    changes_payload JSONB, -- JSONB: Lưu toàn bộ sự thay đổi (Generic Audit)
    change_reason TEXT, -- Lý do thay đổi (VD: Lý do reject)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hàm Trigger tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Áp dụng trigger cho các bảng
CREATE TRIGGER update_teams_modtime BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_roles_modtime BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_permissions_modtime BEFORE UPDATE ON permissions FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_candidate_roles_modtime BEFORE UPDATE ON candidate_roles FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_cv_states_modtime BEFORE UPDATE ON cv_states FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_schools_modtime BEFORE UPDATE ON schools FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_candidates_modtime BEFORE UPDATE ON candidates FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ==========================================
-- SEED DATA (Dữ liệu Khởi tạo mẫu)
-- ==========================================

-- 1. Seed Roles
INSERT INTO
    roles (role_code, name)
VALUES ('HR', 'Human Resources'),
    ('MANAGER', 'Team Manager')
ON CONFLICT DO NOTHING;

-- 2. Seed Permissions
INSERT INTO
    permissions (permission_code, name)
VALUES (
        'VIEW_ALL_CVS',
        'Xem toàn bộ CV trên hệ thống'
    ),
    (
        'VIEW_TEAM_CVS',
        'Nhìn thấy các CV đang được Pick về Team của mình'
    ),
    (
        'VIEW_PUBLIC_CVS',
        'Nhìn thấy các CV đang ở trạng thái Sourcing hoặc Rejected'
    ),
    (
        'VIEW_SALARY',
        'Được phép nhìn thấy trường dữ liệu Lương (salary_offer)'
    ),
    (
        'EDIT_SALARY',
        'Được phép cập nhật/thỏa thuận mức lương cho CV'
    )
ON CONFLICT DO NOTHING;

-- 3. Seed Role_Permissions Map
-- HR có quyền: VIEW_ALL_CVS, VIEW_SALARY, EDIT_SALARY
INSERT INTO
    role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE
    r.role_code = 'HR'
    AND p.permission_code IN (
        'VIEW_ALL_CVS',
        'VIEW_SALARY',
        'EDIT_SALARY'
    )
ON CONFLICT DO NOTHING;

-- MANAGER có quyền: VIEW_TEAM_CVS, VIEW_PUBLIC_CVS
INSERT INTO
    role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE
    r.role_code = 'MANAGER'
    AND p.permission_code IN (
        'VIEW_TEAM_CVS',
        'VIEW_PUBLIC_CVS'
    )
ON CONFLICT DO NOTHING;