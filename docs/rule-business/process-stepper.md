# 📄 ĐẶC TẢ UI: THANH TIẾN TRÌNH TUYỂN DỤNG (PROCESS STEPPER)

## 1. Mục tiêu (Objectives)
Cung cấp cái nhìn trực quan về lộ trình 4 giai đoạn chính của hồ sơ. Sử dụng cơ chế cảnh báo màu sắc để nhận diện ngay lập tức các hồ sơ bị dừng lại giữa chừng trong quy trình.

## 2. Các điểm mốc trạng thái (4 Milestones)
Thanh tiến trình hiển thị cố định 4 giai đoạn tiến tới:

1. **Nguồn CV / Tìm kiếm**
2. **Quản lý Đánh giá**
3. **Phỏng vấn**
4. **Đề xuất Lương**

## 3. Quy tắc Hiển thị & Cảnh báo (Visual & Alert Rules)

### 3.1. Hiển thị thông thường
- **Tên giai đoạn**: Hiển thị phía trên mỗi điểm mốc.
- **Thời gian xử lý (Timestamp)**: Hiển thị ngay bên dưới mỗi giai đoạn.
- **Chỉ báo trạng thái**:
    - **Hoàn thành**: Màu xanh (Green), icon checkmark.
    - **Hiện tại**: Màu xanh đậm (Active), vòng tròn số thứ tự.
    - **Chưa tới**: Màu xám nhạt.

### 3.2. Cơ chế xử lý trạng thái "Từ chối / Bị loại"
Trạng thái này không xuất hiện thành điểm mốc riêng trên thanh tiến trình. Thay vào đó:
- **Cảnh báo đỏ**: Khi hồ sơ chuyển sang **Từ chối / Bị loại**, điểm mốc (Step) mà hồ sơ đang dừng lại trước đó sẽ chuyển sang **Màu đỏ (Danger Red)**.
- **Timestamp**: Hiển thị thời điểm bị loại ngay dưới bước bị đánh dấu đỏ kèm dòng chữ: *"[Thời gian]"*.



## 4. Quy tắc Dữ liệu (Data Rules)

| Trường hợp | Logic thực thi |
| :--- | :--- |
| **Logic Cảnh báo** | Nếu `status == 'Từ chối / Bị loại'`, hệ thống tìm trạng thái gần nhất trước đó trong lịch sử để tô đỏ bước tương ứng trên Stepper. |
| **Log lịch sử** | Mốc thời gian của các bước đã "Pass" vẫn được giữ nguyên màu xanh để thể hiện quá trình đã đi qua. |
| **Revert (Khôi phục)** | Nếu hồ sơ được "Khôi phục", bước màu đỏ sẽ chuyển lại thành màu xanh (Active) và tiếp tục quy trình. |

## 5. Lưu ý cho Developer
- Sử dụng thuộc tính `status="error"` (nếu dùng Ant Design) hoặc class `text-red-500` để đổi màu điểm mốc bị loại.
- Đảm bảo logic truy vấn lịch sử chính xác để xác định "bước cuối cùng" trước khi bị loại là bước nào trong 4 giai đoạn trên.