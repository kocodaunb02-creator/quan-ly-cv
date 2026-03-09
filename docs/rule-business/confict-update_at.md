# 📄 ĐẶC TẢ NGHIỆP VỤ: KIỂM SOÁT XUNG ĐỘT DỮ LIỆU QUA UPDATED_AT

## 1. Mục tiêu (Objectives)
Đảm bảo người dùng luôn đưa ra quyết định dựa trên thông tin mới nhất. Ngăn chặn việc ghi đè dữ liệu khi có nhiều người cùng thao tác trên một hồ sơ ứng viên tại cùng một thời điểm.

## 2. Quy trình Nghiệp vụ (Business Process)

### 2.1. Cơ chế Lưu vết Phiên bản (Snapshot)
- Khi người dùng mở màn hình Chi tiết hồ sơ, hệ thống sẽ ghi nhớ mốc thời gian `updated_at` của hồ sơ đó tại thời điểm mở (gọi là `view_timestamp`).

### 2.2. Kiểm tra trước khi thực hiện hành động (Pre-action Check)
Khi người dùng bấm bất kỳ Action Button nào (Pick, Duyệt, Từ chối...), hệ thống thực hiện các bước sau:
1. **Gửi yêu cầu**: Frontend gửi kèm `view_timestamp` lên Backend.
2. **So khớp (Backend)**: Backend so sánh `view_timestamp` với giá trị `updated_at` hiện tại trong Database.
3. **Xử lý tình huống**:
    - **Nếu trùng khớp**: Hồ sơ chưa bị ai thay đổi -> Thực hiện hành động và cập nhật `updated_at` mới.
    - **Nếu khác biệt**: Có nghĩa là một Manager khác đã Pick, hoặc HR đã sửa thông tin trong lúc người dùng này đang xem.

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