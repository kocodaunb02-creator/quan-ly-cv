# Quy Tắc Phân Quyền (Role Authorization) Theo Trạng Thái Hồ Sơ

Tài liệu này định nghĩa các quy tắc phân quyền thao tác (Edit, Change State, Assign) trên một hồ sơ ứng viên (Candidate) dựa trên Trạng thái hiện tại (State) và Team thụ lý (Assigned Team).

Mục tiêu: Đảm bảo tính độc quyền xử lý của một Team khi hồ sơ đang trong lộ trình tuyển dụng, nhưng vẫn đảm bảo tính linh hoạt (tái sử dụng) khi hồ sơ bị loại hoặc chưa có người phụ trách.

## Thuật ngữ
- **Team Sở Hữu (Assigned Team):** Là Team đang được gán cho hồ sơ ứng viên (`assigned_team_id`).
- **Team Khác:** Bất kỳ Team nào `team_id` không trùng khớp với `assigned_team_id` của hồ sơ.
- **Thao tác (Action):** Bao gồm việc Cập nhật thông tin (Sửa hồ sơ) và Chuyển đổi trạng thái (Gán Team, Đổi State).

## Ma trận Phân quyền theo Trạng thái

| Trạng Thái (State) | Tình trạng Assigned Team | Quyền của Team Sở Hữu | Quyền của Team Khác | Ghi chú / Ý nghĩa Nghiệp vụ |
| :--- | :--- | :--- | :--- | :--- |
| **Sourcing (Mới nhận)** | Rỗng (`null`) | - (Không áp dụng) | **Full Access** (Được phép Pick / Gán Team để trở thành Team Sở Hữu) | Hồ sơ chưa có chủ, bất kỳ ai cũng có thể Pick (Ai nhấn trước sẽ thành Team Sở Hữu - chặn qua OCC). |
| **Sourcing** | Đã có Team Sở Hữu | **Full Access** | **Read-only** (Chỉ xem, cấm thao tác) | Hồ sơ do Team Sở Hữu tự Submit hoặc đã được Pick. |
| **HR_Screening** (Sơ loại) | Đã có Team Sở Hữu | **Full Access** | **Read-only** (Chỉ xem, cấm thao tác) | Đang trong luồng xử lý riêng của Team Sở Hữu. |
| **Manager_Review** (Đánh giá) | Đã có Team Sở Hữu | **Full Access** | **Read-only** (Chỉ xem, cấm thao tác) | Đang chờ Quản lý của Team thụ lý đánh giá. |
| **Interviewing** (Phỏng vấn) | Đã có Team Sở Hữu | **Full Access** | **Read-only** (Chỉ xem, cấm thao tác) | Ứng viên đang tham gia phỏng vấn với Team. |
| **Offering** | Đã có Team Sở Hữu | **Full Access** | **Read-only** (Chỉ xem, cấm thao tác) | Team đang tiến hành thương lượng lương. |
| **Onboarding** | Đã có Team Sở Hữu | **Full Access** | **Read-only** (Chỉ xem, cấm thao tác) | Đã chốt, chuẩn bị nhận việc vào Team. |
| **Rejected** (Từ chối/Loại) | Đã có hoặc Rỗng | **Full Access** (Được phép Revert) | **Full Access** (Được phép thao tác Khôi phục / Pick lại để tái sử dụng hồ sơ) | **Hồ sơ bị rớt hoặc từ chối.** Giải phóng tính "độc quyền". Mở cơ hội cho Team khác có thể tiếp cận và đánh giá lại (Re-sourcing). |

## 3. Quản lý quyền qua Bảng `permissions`

Hệ thống sẽ không hardcode theo tên Role (`HR`, `MANAGER`), mà sẽ tra cứu dựa trên các `permission_code` được gán trong bảng `role_permissions`.

Chúng ta sẽ định nghĩa thêm 2 quyền (Permission) mới sau vào bảng `permissions`:

1. **`MANAGE_ALL_CANDIDATES`**: 
   - **Định nghĩa:** Quyền cao nhất, cho phép thao tác (Edit, Assign, State Change) trên TẤT CẢ hồ sơ bất kể `assigned_team_id` là gì. (Quyền Admin).
   - **Gán cho Role:** `HR`, `ADMIN`.

2. **`MANAGE_TEAM_CANDIDATES`**:
   - **Định nghĩa:** Quyền thao tác bị giới hạn theo ma trận trạng thái ở phần trên. Chỉ được thao tác đúng trên hồ sơ của Team mình, hoặc hồ sơ `Sourcing` mới, hoặc hồ sơ `Rejected`.
   - **Gán cho Role:** `MANAGER`.

> **Lưu ý:** Việc kiểm tra quyền đọc dữ liệu (View List/View Detail) hiện đang phụ thuộc vào endpoint (ví dụ API `/candidates` trả về list đã filter theo filter params, Backend cũng có phân quyền View không?). Ở đây ta đang nhấn mạnh vào **Quyền Thao tác (Action: Update/State/Assign)**.

### 4. Logic Triển khai Hệ thống Cập Nhật

#### Ở Backend
Khi gọi các API thay đổi nội dung (`PUT /candidates/:id`, `POST /workflow/...`):
1. Lấy user hiện tại và JOIN tìm list `permissions` của user đó.
2. Tìm hồ sơ theo ID.
3. **If user có quyền `MANAGE_ALL_CANDIDATES`**: Cho phép Update và Bỏ qua các rule chặn bên dưới.
4. **If user có quyền `MANAGE_TEAM_CANDIDATES` (Nhưng không có MANAGE_ALL)**: 
    - Áp dụng các Rule Ngoại lệ: Cho phép qua nếu `assigned_team_id` là `null`, hoặc `candidate.cv_states.state_code === 'Rejected'`.
    - Chặn (Block): Nếu không thuộc ngoại lệ trên và `user.teamId !== candidate.assigned_team_id`, dội HTTP `403 Forbidden`.
5. **Else (Staff bình thường)**: Không cho phép sửa hồ sơ (Ví dụ Role DEV, TESTER chỉ xem).

#### Ở Frontend (Lớp UI Candidate Detail)
- Tương tự, UI sẽ check `user.permissions`:
    - Nếu có `MANAGE_ALL_CANDIDATES`, hiển thị full nút cho mọi hồ sơ.
    - Nếu chỉ có `MANAGE_TEAM_CANDIDATES`, UI sẽ tự đối chiếu `assigned_team_id` để quyết định ẩn/hiện nút (Read-only mode).
