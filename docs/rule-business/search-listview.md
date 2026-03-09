# 📄 ĐẶC TẢ NGHIỆP VỤ: BỘ LỌC DANH SÁCH ỨNG VIÊN (LIST VIEW FILTER)

## 1. Mục tiêu (Objectives)
Cung cấp bộ công cụ tìm kiếm mạnh mẽ, linh hoạt, giúp người dùng (HR/Manager) nhanh chóng lọc ra các hồ sơ phù hợp từ hệ thống dữ liệu lớn. Tối ưu hóa hiệu năng bằng cách lọc trực tiếp từ Backend thay vì Client-side.

## 2. Đặc tả các thành phần bộ lọc (Filter Components)

### 2.1. Ô tìm kiếm văn bản (Search Textbox)
* **Cơ chế**: Tìm kiếm theo dạng **LIKE** (chứa cụm từ). 
* **Phạm vi tìm kiếm**: Tên ứng viên, Email, Số điện thoại.
* **Quy tắc kỹ thuật**: 
    - Áp dụng **Debounce (300ms)**: Hệ thống chỉ gọi API sau khi người dùng ngừng gõ 300ms để tránh quá tải Server.
    - Dữ liệu được truyền vào URL Query Params (ví dụ: `?search=nguyen+van+a`).

### 2.2. Bộ lọc danh sách (Advanced Dropdown List)
Sử dụng cho các trường dữ liệu như: **Trạng thái (Status)**, **Vị trí (Role)**, **Team**.

* **Tính năng bắt buộc**:
    - **Searchable**: Cho phép nhập văn bản bên trong Dropdown để lọc nhanh các Option (tiện dụng khi danh sách Team/Role quá dài).
    - **Multi-select & "Select All"**: Cho phép chọn nhiều mục cùng lúc hoặc chọn tất cả để xem tổng quát.
    - **Clear Action (Button X)**: Nút "X" tại mỗi option đã chọn hoặc nút "Clear All" để xóa nhanh toàn bộ lựa chọn hiện tại.
    - **Trạng thái mặc định**: Nếu không chọn gì, hệ thống coi như "Chọn tất cả" để hiển thị toàn bộ dữ liệu.



## 3. Quy tắc Kỹ thuật & Luồng dữ liệu (Technical Rules)

| Thành phần | Quy tắc thực thi |
| :--- | :--- |
| **Backend** | Sử dụng toán tử `ILIKE` trong SQL (PostgreSQL) để tìm kiếm không phân biệt hoa thường. |
| **Pagination Sync** | Khi người dùng thay đổi bộ lọc, hệ thống phải reset trang về **Page 1**. |
| **URL Persistence** | Các giá trị lọc phải được đẩy lên URL (Query String). Khi người dùng nhấn F5 hoặc gửi link cho người khác, bộ lọc vẫn giữ nguyên trạng thái. |
| **Empty State** | Nếu kết quả tìm kiếm không có dữ liệu, hiển thị thông báo "Không tìm thấy ứng viên phù hợp" kèm nút "Xóa bộ lọc". |

---
**Ghi chú cho Developer**: 
- Sử dụng thư viện `react-select` hoặc `Ant Design Select` để có các tính năng Multi-select và Searchable nhanh chóng.
- Đảm bảo logic đồng bộ giữa thanh URL và trạng thái của các Component Dropdown.