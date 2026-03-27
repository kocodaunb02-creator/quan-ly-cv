# Quy định và Nghiệp vụ: Xử lý Trùng lặp & Dọn dẹp Hồ sơ Ứng viên (CV)

Tài liệu này định nghĩa các quy tắc nghiệp vụ (Business Rules) cho luồng Thêm mới CV (Upload Candidate) nhằm phát hiện sự trùng lặp dữ liệu thông qua Số điện thoại hoặc Email, cũng như quy trình dọn dẹp (Cleanup) các CV quá hạn.

## 1. Mục đích
- Ngăn chặn HR/Manager vô tình tạo ra nhiều bản ghi (records) rác cho cùng một ứng viên.
- Nhắc nhở và hỗ trợ xem lại lịch sử ứng tuyển cũ của một Candidate.
- Đảm bảo cơ sở dữ liệu không bị "phình to" bởi các Data ứng viên đã ngưng tương tác quá 6 tháng.

## 2. Các Quy tắc Nghiệp vụ (Business Rules)

### BR-01: Tiêu chí xác định trùng lặp
Khi thêm mới một CV, hệ thống sẽ được coi là **"Phát hiện trùng lặp"** nếu thỏa mãn một trong các điều kiện sau:
1. `Số điện thoại` truyền lên khớp với `Số điện thoại` của 1 ứng viên đã có trong hệ thống.
2. HOẶC `Email` truyền lên khớp với `Email` của 1 ứng viên đã có trong hệ thống.
3. VÀ ứng viên cũ đó **chưa bị xóa mềm** (`deleted_at` phải `IS NULL`).

### BR-02: Quy tắc hiển thị Cảnh báo (Duplicate Warning)
- Khi thỏa mãn **BR-01**, hệ thống KHÔNG được lưu mới ứng viên ngay lập tức.
- Hệ thống phải hiển thị Giao diện Cảnh báo (Duplicate Warning Modal) cho người dùng cuối.
- Giao diện phải hiển thị rõ các thông tin cơ bản của dòng dữ liệu cũ bị trùng: **Tên**, **SĐT**, **Email**, **Trạng thái xử lý CV hiện tại**.

### BR-03: Quyền quyết định của Người dùng (User Actions)
Trên Giao diện Cảnh báo, người dùng bắt buộc phải đưa ra 1 trong 3 hành động:
1. **Quay lại (Cancel/Back):** Hủy quá trình đang tạo mới, trở về Form điền thông tin để sửa lại SĐT/Email nếu họ nhập sai.
2. **Mở CV cũ (View Existing):** Mở ra trang Chi tiết Hồ sơ (Candidate Details) của ứng viên bị trùng trong một tab/cửa sổ mới để HR kiểm tra lại lịch sử.
3. **Vẫn tạo mới (Force Create):** Người dùng quyết tâm tạo mới vì đây có thể là lần ứng tuyển ở một vị trí mới (Re-apply) của cùng một người. Hệ thống bắt buộc phải **lưu thành công** bản ghi mới mang cùng thông tin SĐT/Email đó.

### BR-04: Quy định Dọn dẹp dữ liệu (Auto-Cleanup Cronjob)
- Hệ thống có 1 tiến trình chạy ngầm (Cron Job) hoạt động vào `00:00` hàng ngày.
- Nhiệm vụ: Quét các CV mà thời gian cập nhật lần cuối (`updated_at`) đã cách thời điểm hiện tại **LỚN HƠN 6 THÁNG (180 Ngày)**.
- Xử lý: Đánh dấu Xóa mềm (`deleted_at` = *Thời gian chạy Job*) cho các bản ghi đó.
- *Hệ quả liên đới:* Kể từ lúc bị xóa mềm, thông tin SĐT/Email của các CV này sẽ không còn bị ràng buộc bởi **BR-01**. Nghĩa là CV mới tinh có thể dùng lại SĐT/Email cũ mà không bị hiện Cảnh báo trùng.

---

## 3. Workflow Flowchart (Luồng thao tác)
```mermaid
flowchart TD
    A[Người dùng điền Form Create CV] --> B{Nhấn Lưu/Tạo mới}
    B --> C[Gửi Request lên API]
    
    C --> D{Kích hoạt BR-01: Check DB
    Tồn tại Email/SĐT ở CV đang Active?}
    
    D -- Không có --> E[Tạo mới Thành công CV]
    E --> END
    
    D -- Có tồn tại --> F[API Trả lỗi 409 Conflict kèm Data Cũ]
    
    F --> G[Kích hoạt BR-02: Hiển thị UI Cảnh Báo]
    
    G --> H{Kích hoạt BR-03: Lựa chọn Hành động}
    
    H -- Chọn Hủy bỏ --> I[Đóng Cảnh Báo, Về Form]
    
    H -- Chọn Mở CV cũ --> J[Mở Tab mới: /candidates/{id_cũ}]
    
    H -- Vẫn Tạo Mới --> K[Gửi lại API Flag: forceCreate=true]
    K --> E
```
