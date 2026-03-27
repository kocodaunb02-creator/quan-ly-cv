# 📄 ĐẶC TẢ NGHIỆP VỤ: KIỂM SOÁT XUNG ĐỘT DỮ LIỆU QUA UPDATED_AT

## 1. Mục tiêu (Objectives)
Đảm bảo người dùng luôn đưa ra quyết định dựa trên thông tin mới nhất. Ngăn chặn việc ghi đè dữ liệu khi có nhiều người cùng thao tác trên một hồ sơ ứng viên tại cùng một thời điểm.

## 2. Quy trình Nghiệp vụ (Business Process)

### 2.1. Cơ chế Lưu vết Phiên bản (Snapshot)
- Khi người dùng mở màn hình Chi tiết hồ sơ, hệ thống sẽ ghi nhớ mốc thời gian `updated_at` của hồ sơ đó tại thời điểm mở (gọi là `view_timestamp`).

### 2.2. Trình tự kiểm tra Backend (Backend Check Sequence)
Khi người dùng bấm bất kỳ Action Button nào (Pick, Duyệt, Từ chối...), hệ thống Backend MẶC ĐỊNH phải thực thi theo đúng trình tự sau để đảm bảo bảo mật và nhất quán dữ liệu:

1. **Bước 1: Kiểm tra Phân quyền (Role Authorization Check) - Ưu tiên cao nhất**
    - Hệ thống kiểm tra xem User hiện tại có quyền thao tác trên Candidate này hay không (VD: CV đã bị Pick về Team khác thì Manager team bị mất quyền).
    - **Xử lý**: Nếu vi phạm, lập tức trả về lỗi **403 Forbidden** (Chặn ngay lập tức, không đi tiếp tới bước check xung đột).

2. **Bước 2: Kiểm tra Xung đột dữ liệu (Optimistic Concurrency Control - OCC)**
    - Nếu vượt qua Bước 1, hệ thống tiếp tục so sánh `view_timestamp` truyền từ Frontend với `updated_at` hiện tại trong Database.
    - **Nếu trùng khớp**: Hồ sơ chưa bị ai thay đổi -> Tiến hành cập nhật DB, thay đổi trạng thái và sinh `updated_at` mới.
    - **Nếu khác biệt**: Dữ liệu đã bị người khác thao tác trước (nhưng hành động đó chưa làm mất quyền của user hiện tại) -> Lập tức trả về lỗi **409 Conflict**.

## 3. Quy tắc Hiển thị & Thông báo (UI/UX Rules)

Khi xảy ra xung đột (khác biệt `updated_at`), hệ thống thực hiện:
- **Thông báo**: Hiển thị thông báo (Warning Toast/Modal): *"Hồ sơ này vừa có sự thay đổi thông tin hoặc trạng thái từ người dùng khác. Vui lòng xem xét lại trước khi thực hiện tiếp."*
- **Hành động**: 
    - Không thực thi lệnh cũ.
    - Tự động thực hiện lệnh **Refresh** (Tải lại) dữ liệu hồ sơ để cập nhật nội dung mới nhất cho người dùng.
    - Cập nhật lại thanh tiến trình (Stepper) và Lịch sử (Timeline) tương ứng.

## 4. Đặc tả Kỹ thuật cho Developer (Technical Spec)

| Thành phần | Giải pháp thực hiện |
| :--- | :--- |
| **Database Query** | `UPDATE candidates SET team_id = :team_id, updated_at = NOW() WHERE id = :id AND updated_at = :view_timestamp` |
| **Frontend State** | Lưu `updated_at` vào một biến ẩn (Ref hoặc State) ngay khi gọi API lấy chi tiết ứng viên thành công. |
| **API Response** | Nếu không có dòng nào được cập nhật (`affected_rows == 0`), trả về lỗi 409 (Conflict). |

---
**Ghi chú cho Agent**: Luôn sử dụng múi giờ chuẩn (UTC) khi so sánh `updated_at` giữa Frontend và Backend để tránh sai lệch do cấu hình máy khách.