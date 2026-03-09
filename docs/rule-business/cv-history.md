# 📄 ĐẶC TẢ UI: LỊCH SỬ TƯƠNG TÁC ỨNG VIÊN (CANDIDATE TIMELINE)

## 1. Thành phần dữ liệu (Data Source)
- **Table**: `cv_history`
- **Các trường chính**: 
    - `changed_by_user_id`: Định danh người thực hiện (cần Join với bảng Users để lấy Tên).
    - `action_type`: Loại hành động (Cập nhật trạng thái, Ghi chú, Upload file).
    - `change_reason`: Lý do chi tiết (Lấy từ phần nhập Inline lý do).
    - `created_at`: Mốc thời gian thực hiện.

## 2. Quy tắc hiển thị UI (UI Mapping)
- **Kiểu dáng**: Vertical Timeline (Thanh thời gian dọc).
- **Thứ tự**: Sắp xếp giảm dần theo `created_at` (Hành động mới nhất nằm trên cùng).
- **Màu sắc điểm mốc**:
    - **Green**: Khi `new_state_id` tiến tới (Pass, Approved).
    - **Red**: Khi `action_type` liên quan đến Reject/Decline.
    - **Grey**: Cho các hành động bổ trợ như Sửa thông tin, Xem hồ sơ.

## 3. Quy tắc Kỹ thuật (Technical Rules)
- **Xử lý Text**: Nếu `change_reason` quá dài (trên 3 dòng), hiển thị nút "Xem thêm" để mở rộng nội dung.
- **Tính thời gian thực**: Khi một Action Button được nhấn ở Slide Detail, danh sách lịch sử này phải được tự động Refresh để hiển thị bản ghi mới nhất.
- **Empty State**: Nếu hồ sơ mới tạo và chưa có tương tác, hiển thị: "Chưa có lịch sử tương tác nào được ghi nhận".
## 4. Xử lý Dữ liệu JSONB (Payload Handling)
- **Cột changes_payload**: Agent cần viết hàm helper để parse dữ liệu JSONB này ra thành văn bản thuần Việt trên UI.
- **Ví dụ**: 
    - Nếu payload có `old_status`, hiển thị: "Chuyển từ {old_status} sang {new_status}".
    - Nếu payload có `score`, hiển thị: "Điểm đánh giá: {score}/100".
- **Lưu ý**: Chỉ hiển thị các thông tin quan trọng nhất trong payload để tránh làm rối Timeline.