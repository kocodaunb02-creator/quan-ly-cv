# 📄 ĐẶC TẢ NGHIỆP VỤ: ĐIỀU KHIỂN TRẠNG THÁI & NHẬP LIỆU INLINE

## 1. Mục tiêu (Objectives)
Tối ưu hóa quy trình chuyển đổi trạng thái ứng viên thông qua giao diện tương tác trực tiếp (Inline). Đảm bảo mọi thay đổi trạng thái đều đi kèm với lý do nghiệp vụ để phục vụ công tác đối soát và lưu vết lịch sử (Audit Log).

## 2. Bảng Ma trận Hành động (State Action Matrix)

| Trạng thái hiện tại | Button hiển thị | Hành động nghiệp vụ | Trạng thái đích | Người thực hiện |
| :--- | :--- | :--- | :--- | :--- |
| **Nguồn CV / Tìm kiếm** | **Đạt Sơ loại** | Xác nhận hồ sơ đạt yêu cầu cơ bản | **Quản lý Đánh giá** | HR |
| | **Từ chối** | Loại hồ sơ không phù hợp | **Từ chối / Bị loại** | HR |
| **Quản lý Đánh giá** | **Nhận hồ sơ (Pick)** | Manager nhận CV về Team mình | **Quản lý Đánh giá** | Quản lý |
| | **Duyệt hồ sơ** | Đồng ý chuyển sang phỏng vấn | **Phỏng vấn** | Quản lý |
| | **Từ chối** | Hồ sơ không đạt chuyên môn | **Từ chối / Bị loại** | Quản lý |
| **Phỏng vấn** | **Đạt Phỏng vấn** | Xác nhận ứng viên vượt qua phỏng vấn | **Đề xuất Lương** | Quản lý / HR |
| | **Loại (Fail)** | Không đạt yêu cầu sau phỏng vấn | **Từ chối / Bị loại** | Quản lý / HR |
| **Đề xuất Lương** | **Đồng ý Offer** | Ứng viên chấp nhận việc làm | **Nhận việc** | HR |
| | **Từ chối Offer** | Ứng viên không đồng ý đãi ngộ | **Từ chối / Bị loại** | HR |
| **Từ chối / Bị loại** | **Khôi phục (Revert)** | Xem xét lại hồ sơ đã bị loại | **Quản lý Đánh giá** | Quản lý |

## 3. Đặc tả Giao diện Nhập lý do (Inline Input Specification)
Hệ thống sử dụng cơ chế **Inline Expand** để thu thập thông tin khi người dùng tương tác với các Button điều hướng trạng thái.

### 3.1. Luồng tương tác (UX Flow)
1. **Kích hoạt**: Khi người dùng Click vào một Action Button (vd: *Từ chối* hoặc *Đạt sơ loại*).
2. **Hiển thị**: Ngay phía dưới cụm Button sẽ mở rộng (Slide down) một vùng nhập liệu nhỏ.
3. **Thành phần**:
    - Một ô `TextArea` với placeholder: "Nhập lý do hoặc ghi chú cho hành động này..."
    - Nút **"Xác nhận"** (Icon Gửi/Check) và **"Hủy"** (Icon X).
4. **Kết thúc**: Sau khi bấm Xác nhận, hệ thống thực hiện gọi API chuyển trạng thái kèm theo nội dung văn bản vừa nhập.

### 3.2. Quy tắc Nghiệp vụ (Business Rules)
- **Bắt buộc nhập (Required)**: Đối với các hành động dẫn tới trạng thái **Từ chối / Bị loại**, ô nhập liệu là bắt buộc. Nút "Xác nhận" sẽ bị mờ (Disable) cho đến khi có ít nhất 10 ký tự.
- **Tự động lưu**: Nội dung nhập vào sẽ được lưu.


## 4. Quy tắc Kỹ thuật cho Developer (Technical Rules)
- **Component**: Sử dụng `AnimatePresence` (framer-motion) hoặc transition của Tailwind để hiệu ứng mở rộng ô nhập liệu mượt mà.
- **State Management**: Khi đang mở ô nhập liệu của nút "Từ chối", nếu người dùng bấm "Đạt sơ loại", hệ thống phải đóng ô cũ và mở ô mới tương ứng (hoặc dùng chung 1 ô nhập nhưng đổi Label nút Xác nhận).
