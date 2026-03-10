import axios from 'axios';

// Create an Axios instance
const apiClient = axios.create({
    baseURL: '/api', // Proxied to http://localhost:5002 via Vite
    headers: {
        'Content-Type': 'application/json',
    },
});

// THIẾT LẬP MOCK DATA CHO VERCEL DEMO (Không có Backend)
const isMockMode = true;

if (isMockMode) {
    apiClient.defaults.adapter = async (config) => {
        const { url, method, data, params } = config;

        // Giả lập độ trễ mạng
        await new Promise(resolve => setTimeout(resolve, 600));

        console.log(`[MOCK API] ${method?.toUpperCase()} ${url}`, { params, data: data ? JSON.parse(data) : null });

        // 1. Mock Đăng nhập
        if (url === '/auth/login' && method === 'post') {
            return {
                data: {
                    token: 'mock-jwt-token-vietcv-2026',
                    user: {
                        id: 1,
                        username: 'admin',
                        fullName: 'Admin Demo Vercel',
                        roles: ['HR', 'ADMIN'],
                        permissions: ['MANAGE_ALL_CANDIDATES', 'MANAGE_TEAM_CANDIDATES'],
                        teamId: null
                    }
                },
                status: 200, statusText: 'OK', headers: {}, config, request: {}
            };
        }

        // 2. Mock Danh sách ứng viên (Dashboard)
        if (url?.startsWith('/candidates') && method === 'get' && !url.match(/\/\d+$/)) {
            const page = parseInt(params?.page || 1);
            const limit = parseInt(params?.limit || 10);

            const allCandidates = [
                {
                    id: 1, name: 'Nguyễn Văn A', email: 'vana@gmail.com', phone: '0901234567', total_score: 85,
                    cv_states: { state_code: 'Sourcing', name: 'Tiếp nhận CV' },
                    candidate_roles: { name: 'Thực tập sinh Frontend', role_code: 'INT_FE' },
                    teams: null,
                    assigned_team_id: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                {
                    id: 2, name: 'Trần Thị B', email: 'tranb@gmail.com', phone: '0912345678', total_score: 92,
                    cv_states: { state_code: 'HR_Screening', name: 'Sơ loại HR' },
                    candidate_roles: { name: 'Nhân viên Backend', role_code: 'DEV_BE' },
                    teams: { id: 1, name: 'Phòng Phát triển' },
                    assigned_team_id: 1,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                {
                    id: 3, name: 'Lê Hoàng C', email: 'hoangcle@gmail.com', phone: '0987654321', total_score: 78,
                    cv_states: { state_code: 'Interviewing', name: 'Phỏng vấn' },
                    candidate_roles: { name: 'Business Analyst', role_code: 'BA_MID' },
                    teams: { id: 2, name: 'Phòng Sản phẩm' },
                    assigned_team_id: 2,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ];

            return {
                data: {
                    data: allCandidates.slice((page - 1) * limit, page * limit),
                    meta: { total: allCandidates.length, page, limit }
                },
                status: 200, statusText: 'OK', headers: {}, config, request: {}
            };
        }

        // 3. Mock Chi tiết một ứng viên
        if (url?.match(/^\/candidates\/\d+$/) && method === 'get') {
            const id = parseInt(url.split('/').pop() || '1');
            return {
                data: {
                    data: {
                        id,
                        name: `Ứng viên Mẫu #${id}`,
                        email: `ungvien${id}@test.com`,
                        phone: '0911223344',
                        total_score: Math.floor(Math.random() * 30 + 70),
                        cv_source: 'LinkedIn',
                        cv_original_name: 'CV_UngVien_Fullstack.pdf',
                        demo_link: 'https://github.com/hoangcv',
                        salary_offer: 15000000,
                        cv_states: { state_code: id % 2 === 0 ? 'HR_Screening' : 'Sourcing', name: 'Sơ loại HR' },
                        candidate_roles: { name: 'Chuyên viên Phát triển', role_code: 'DEV_FULL' },
                        teams: id % 2 === 0 ? { id: 1, name: 'Phòng Phát triển' } : null,
                        assigned_team_id: id % 2 === 0 ? 1 : null,
                        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
                        updated_at: new Date().toISOString()
                    }
                },
                status: 200, statusText: 'OK', headers: {}, config, request: {}
            };
        }

        // 4. Mock Lịch sử ứng viên
        if (url?.startsWith('/history/candidates/') && method === 'get') {
            const id = parseInt(url.split('/').pop() || '1');
            const historyData: any[] = [
                {
                    id: 1,
                    action_type: 'CREATE',
                    new_state: { name: 'Tiếp nhận CV', state_code: 'Sourcing' },
                    cv_states_cv_history_new_state_idTocv_states: { name: 'Tiếp nhận CV', state_code: 'Sourcing' },
                    users: { name: 'Admin', email: 'admin@demo.com' },
                    created_at: new Date(Date.now() - 86400000 * 5).toISOString()
                },
                {
                    id: 2,
                    action_type: 'UPDATE_INFO',
                    new_state: { name: 'Tiếp nhận CV', state_code: 'Sourcing' },
                    cv_states_cv_history_new_state_idTocv_states: { name: 'Tiếp nhận CV', state_code: 'Sourcing' },
                    users: { name: 'HR Executive', email: 'hr@demo.com' },
                    changes_payload: {
                        phone: { old: '0911223344', new: '0988776655' },
                        email: { old: null, new: 'ungvien.moi@gmail.com' },
                        cv_source: { old: 'Facebook', new: 'LinkedIn' },
                        note: 'Cập nhật lại thông tin liên lạc ứng viên.'
                    },
                    created_at: new Date(Date.now() - 86400000 * 4.5).toISOString()
                },
                {
                    id: 3,
                    action_type: 'UPDATE_STATE',
                    old_state: { name: 'Tiếp nhận CV', state_code: 'Sourcing' },
                    new_state: { name: 'Sơ loại HR', state_code: 'HR_Screening' },
                    cv_states_cv_history_previous_state_idTocv_states: { name: 'Tiếp nhận CV', state_code: 'Sourcing' },
                    cv_states_cv_history_new_state_idTocv_states: { name: 'Sơ loại HR', state_code: 'HR_Screening' },
                    users: { name: 'HR Executive', email: 'hr@demo.com' },
                    changes_payload: { note: 'CV đạt chuẩn sơ loại, đã check kinh nghiệm OK.' },
                    created_at: new Date(Date.now() - 86400000 * 4).toISOString()
                }
            ];

            // Nếu không phải ID chẵn (Sơ loại HR mặc định) thì cho thêm lịch sử tới bước Phỏng vấn/Manager Review
            if (id % 2 !== 0) {
                historyData.push({
                    id: 4,
                    action_type: 'ASSIGN',
                    new_state: { name: 'Sơ loại HR', state_code: 'HR_Screening' },
                    cv_states_cv_history_new_state_idTocv_states: { name: 'Sơ loại HR', state_code: 'HR_Screening' },
                    users: { name: 'Admin', email: 'admin@demo.com' },
                    changes_payload: {
                        assigned_team_id: { old: null, new: 1 },
                        note: 'Giao hồ sơ cho Team Phát triển đánh giá chuyên môn.'
                    },
                    created_at: new Date(Date.now() - 86400000 * 3).toISOString()
                });

                historyData.push({
                    id: 5,
                    action_type: 'UPDATE_STATE',
                    old_state: { name: 'Sơ loại HR', state_code: 'HR_Screening' },
                    new_state: { name: 'Phỏng vấn', state_code: 'Interviewing' },
                    cv_states_cv_history_previous_state_idTocv_states: { name: 'Sơ loại HR', state_code: 'HR_Screening' },
                    cv_states_cv_history_new_state_idTocv_states: { name: 'Phỏng vấn', state_code: 'Interviewing' },
                    users: { name: 'Dev Lead', email: 'lead@demo.com' },
                    changes_payload: { note: 'Hồ sơ pass, đã sắp xếp lịch phỏng vấn T5 tuần sau.' },
                    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
                });
            }

            return {
                data: { data: historyData.reverse() }, // Trả về dạng mới nhất lên đầu
                status: 200, statusText: 'OK', headers: {}, config, request: {}
            };
        }

        // 5. Mặc định trả về Thành công cho các request PUT, POST, DELETE khác (để thao tác không bị gián đoạn)
        return {
            data: { success: true, message: 'Thao tác thành công (Mock Data)' },
            status: 200, statusText: 'OK', headers: {}, config, request: {}
        };
    };
}

// Add a request interceptor to inject the JWT token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle token expiry or global errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Mock doesn't throw real network errors conventionally, but keep logic
        if (error.response?.status === 401 || error.response?.status === 403) {
            // localStorage.removeItem('token');
            // localStorage.removeItem('user');
            // window.location.href = '/login'; 
        }
        return Promise.reject(error);
    }
);

export default apiClient;
