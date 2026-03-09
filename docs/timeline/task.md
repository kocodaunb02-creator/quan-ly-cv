# Task Checklists: Phát triển Hệ thống Quản lý CV (Recruitment Lifecycle)

Dự án được xây dựng dựa trên tài liệu nghiệp vụ `docs/rule-business/overview.md` và `docs/rule-coding/tech-stack-rules.md`.

## 1. Giai đoạn Phân tích & Thiết kế Database (Database Design)
- [x] Thiết kế bảng `users` (HR, Team Manager).
- [x] Thiết kế bảng `teams` (Nhóm A, Nhóm B, vv).
- [x] Thiết kế bảng `candidates` (Lưu thông tin CV, Role: Dev, Artist... và State hiện tại).
- [x] Thiết kế bảng `cv_history` (Lưu vết thay đổi Team và lý do Reject).
- [x] Chốt sơ đồ Database (ERD) và chạy Script SQL tạo bảng.

## 2. Giai đoạn Thiết kế Giao diện (Mockup trong `docs/design`)
- [x] Thiết kế Màn hình Đăng nhập (Login).
- [x] Thiết kế Dashboard Bảng quản lý CV (List/Table View) với bộ lọc nâng cao (Trạng thái, Chuyên môn, Team).
- [x] Thiết kế Modal Xem chi tiết CV (Thông tin ứng viên, Lịch sử, Phân quyền).
- [x] Thiết kế Modal Upload File CV mới.
- [x] Thiết kế Modal Chỉnh sửa Hồ sơ CV (Thay thế file/thông tin).

## 3. Giai đoạn Phát triển Backend API
- [x] API Authentication (Login, Phân quyền theo Role HR/Manager).
- [x] API Upload & Quản lý Pool CV (Sourcing).
- [x] API Thao tác nghiệp vụ: Assign Team (Pick), Đổi State, Khôi phục (Revert).
- [x] API Lịch sử CV & Thống kê dữ liệu báo cáo.
- [x] Cài đặt Middleware bảo mật tiền lương (Salary) chỉ cho HR.

## 4. Giai đoạn Phát triển Frontend
- [x] Dựng Layout chính (Sidebar, Header, Danh sách CV).
- [x] Tích hợp API Đăng nhập và quản lý State/Phân quyền (Context).
- [ ] Dựng giao diện Kanban/Bảng thao tác CV với các State.
- [x] Code logic hiển thị dữ liệu tuỳ theo Quyền (HR thấy lương, Manager thấy CV của Team mình/Sourcing/Rejected).

## 5. Kiểm thử & Chấp nhận (Testing & Acceptance)
- [ ] Test luồng End-to-end: HR upload -> Manager Pick -> HR Screening -> Interview -> Offer.
- [ ] Test luồng Reject & Revert CV giữa các Manager.
