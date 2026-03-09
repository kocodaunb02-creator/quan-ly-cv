# 📄 TỔNG QUAN NGHIỆP VỤ: QUẢN LÝ TỆP TIN CV & VERSIONING (SOFT-DELETE)

## 1. Mục tiêu (Objectives)
Tối ưu hóa trải nghiệm người dùng và đảm bảo an toàn dữ liệu tuyệt đối. Hệ thống áp dụng cơ chế xóa mềm (Soft-delete) cho cả hành động xóa và thay thế file, cho phép truy xuất lại các phiên bản cũ khi cần thiết.

## 2. Quy trình Nghiệp vụ (Business Process)
### 2.1. Xem trực tiếp nội dung (CV Preview)
* **Cơ chế**: Khi người dùng nhấn vào link/icon CV, hệ thống thực hiện mở một **Tab mới (New Tab)** trên trình duyệt để hiển thị nội dung.
* **Xử lý luồng**:
    - Sử dụng `window.open` trỏ đến API Proxy của Backend thay vì link file tĩnh.
    - Đối với PDF/Ảnh: Trình duyệt tự động hiển thị nội dung.
    - Đối với Doc/Docx: Trình duyệt tự động thực hiện lệnh Tải xuống (Download).
* **Bảo mật**: Chỉ cho phép mở Tab mới khi User có quyền hạn tương ứng với ứng viên đó.

### 2.2. Hành động Xóa (Pure Soft-delete)
- **Thao tác**: Người dùng bấm "Xóa CV".
- **Logic hệ thống**: 

    - Ẩn file trên giao diện người dùng.
    - **Không xóa file vật lý** trên Storage.
- **Mục đích**: Lưu vết và cho phép khôi phục nhanh (Restore).

### 2.3. Hành động Thay thế (Replace as Soft-delete)
- **Thao tác**: Người dùng Upload file mới khi đã có file cũ tồn tại.
- **Logic hệ thống**:
    1. **Lưu trữ**: File mới được upload với tên mới (UUID + Timestamp).
    2. **Đánh dấu bản cũ**: File cũ trong Database được chuyển xóa mềm (không xóa vật lý).
    3. **Cập nhật bản mới**: Database cập nhật trỏ tới file mới nhất.
- **Mục đích**: Ngăn chặn việc ghi đè file (Overwriting). Nếu file mới bị lỗi hoặc upload nhầm, HR vẫn có thể tìm lại file cũ trong Storage.

## 3. Quy tắc Kỹ thuật (Technical Rules)

| Quy tắc | Chi tiết thực thi |
| :--- | :--- |
| **Bất biến (Immutability)** | Một khi file đã upload lên Storage, không bao giờ được dùng lệnh `fs.unlink` hoặc xóa vật lý. |
| **Naming Convention** | Tên file luôn có Timestamp để phân biệt các phiên bản: `candidates/{uuid}/{timestamp}_{original_name}`. |
| **Ghi vết (Audit Log)** | Phải phân biệt rõ 2 loại log: "Đã xóa CV" và "Đã thay thế CV cũ bằng phiên bản mới". |
