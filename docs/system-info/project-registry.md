# Thông tin cấu hình Hệ thống: QuanLyCV (Quản lý Công việc)

Đây là dự án Quản lý Công việc (hệ thống số 2) dự định triển khai. Tài liệu này lưu lại cấu hình thông số riêng biệt so với dự án `Antigravity-Todo` cũ để tránh xung đột hệ thống.

## Cấu hình Mạng & Database (Ports) Dự kiến
- **Frontend (React Vite):** Cổng `5174` (Chỉ định rõ ràng).
- **Backend (Node.js/Express):** Cổng API `5002`.
- **Database (PostgreSQL qua Docker):**
  - Tên Container: `quanlycv_postgres`
  - Cổng Host mapping: `5433` -> `5432` (Container)
  - Tên Database: `quanlycv_db`
  - User: `quanlycv_user`

## Ghi chú
- Các cổng dùng trong ứng dụng này đã được thay đổi tịnh tiến (+1) so với dự án Todo.
- Khi triển khai một hệ thống số 3 mới, bạn nên tạo ra thông số mới không trùng lập với thông số ở file này và bên hệ thống thứ 1. Lấy thông số cuối thay vì dùng lại `5174, 5002, 5433`.
