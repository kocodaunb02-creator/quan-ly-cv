# Kế hoạch Triển khai: Hệ thống Quản lý CV (Recruitment Lifecycle)

Dựa trên tài liệu nghiệp vụ do người dùng cung cấp (`docs/rule-business/overview.md`), hệ thống này nhằm quản lý vòng đời ứng viên Game Studio, tối ưu phối hợp giữa HR và Team Manager.

---

## Các Giai đoạn Phát triển (Development Phases)

### Phase 1: Phân tích Cơ sở dữ liệu (Database Design)
Chúng ta sẽ triển khai PostgreSQL dựa trên nghiệp vụ phân quyền.
- **Bảng `users`**: Quản lý accounts. Thuộc tính quan trọng: `role` (HR, Manager), `team_id` (nếu là Manager).
- **Bảng `teams`**: Danh sách dự án/nhóm con.
- **Bảng `candidates`**: Hồ sơ ứng viên. Các field: `name`, `cv_url`, `role` (Artist, Dev, GD...), `current_state` (Sourcing, Manager_Review...), `salary_offer` (Chỉ HR xem), `assigned_team_id`.
- **Bảng `candidate_history`**: Trace log ghi lại ai (Manager nào) đã reject kèm lý do, khi nào đổi state.

### Phase 2: Thiết kế UI/UX & Mockup (Pencil Prototyping)
Sử dụng file `docs/design/design.pen` để thiết kế giao diện (Premium Design):
- **Bảng quản lý (List/Table View)**: Nơi hiển thị danh sách CV dưới dạng bảng/danh sách.
- **Bộ Lọc Nâng Cao (Filters)**: Cho phép chắt lọc dữ liệu cực nhanh theo Trạng thái (State), Chuyên môn (Role), và Tên ứng viên.
- **Hành động (Actions)**: Các nút "Pick CV", "Reject", "Revert" đặt trong Modal Chi tiết.
- **Phân quyền UI**: Màn hình của Manager sẽ không có cột/trường "Salary Offer" và chỉ hiện CV của Team mình + Sourcing + Rejected.

### Phase 3: Phát triển Backend API (Node.js/Express + Prisma)
- Khởi tạo project Backend với Node.js, Typescript.
- Tích hợp và cấu hình hệ quản trị CSDL với **Prisma ORM**.
- Viết các API CRUD cho User, Team, Candidate.
- Đảm bảo logic nghiệp vụ ở Backend (Ví dụ: Chỉ Manager chưa có CV này mới được Revert, hoặc chỉ HR mới được Update State Offering).
- Xử lý JWT Token cấp quyền trả về kèm thông tin Team.

### Phase 4: Phát triển Frontend (React Vite)
- Áp dụng Tailwind CSS theo rule-coding.
- Dựng giao diện tương tác (Drag & Drop hoặc Action Buttons cho việc đổi trạng thái).
- Code logic bảo vệ (Protected Routes) dựa trên thông tin Auth từ Backend.

---

## User Review Required

> [!IMPORTANT]
> **Plan tổng thể đã được thiết kế dựa trên các tài liệu bạn cung cấp. Tuy nhiên, trước khi tôi bắt tay vào code Sơ đồ Database, xin xác nhận:**
> 
> 1. **Mô hình Database**: Bạn muốn sử dụng thư viện ORM nào để kết nối DB (Ví dụ: `Prisma`, `Sequelize`, hay chỉ viết SQL thuần với `pg` như khai báo ban đầu)?
> 2. **Xác nhận**: Kế hoạch này đã bao quát đúng ý định nghiệp vụ của bạn chưa? Nếu rồi, chúng ta sẽ bắt đầu khởi tạo cấu trúc Bảng DB trước, hay đi vẽ Thiết kế UI trước?
