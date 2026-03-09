# 🛠 CODING RULES & TECHNICAL STANDARDS: QUANLYCV

Tài liệu này quy định các tiêu chuẩn lập trình và cấu trúc dữ liệu bắt buộc nhằm đảm bảo tính nhất quán, bảo mật và khả năng mở rộng của hệ thống Quản lý CV.

## 1. Quy tắc Cơ sở dữ liệu (Database Rules)
* **Primary Keys**: Khuyến nghị sử dụng kiểu dữ liệu **Integer (SERIAL / AUTO_INCREMENT)** làm khóa chính cho các bảng để dễ dàng truy xuất và quản lý.
* **Naming Convention**: Sử dụng `snake_case` cho toàn bộ tên bảng và cột dữ liệu (Ví dụ: `candidate_id`, `assigned_team_id`).
* **Audit Columns**: Mọi bảng nghiệp vụ phải bao gồm các trường:
    * `created_at`: Thời điểm khởi tạo.
    * `updated_at`: Thời điểm cập nhật cuối cùng.
    * `deleted_at`: Sử dụng cho cơ chế **Soft Delete** (không xóa vật lý hồ sơ ứng viên).
* **Data Integrity**: Các trạng thái vòng đời CV (Status) phải được định nghĩa bằng kiểu dữ liệu `ENUM` để kiểm soát chặt chẽ luồng dữ liệu.

## 2. Quy tắc Thiết kế API (RESTful API Design)
* **Endpoint Structure**: Sử dụng danh từ số nhiều với tiền tố phiên bản `/api/v1/` (Ví dụ: `/api/v1/candidates`, `/api/v1/history`).
* **HTTP Methods Standard**: 
    * `GET`: Truy xuất dữ liệu.
    * `POST`: Tạo mới ứng viên hoặc khởi tạo quy trình.
    * `PATCH`: Sử dụng cho các hành động thay đổi trạng thái như **Pick**, **Revert**, **Reject**.
    * `DELETE`: Thực hiện Soft Delete bản ghi.
* **Standard Response**: Dữ liệu trả về từ API phải luôn nằm trong một wrapper chuẩn:
  ```json
  {
    "success": true,
    "data": { ... },
    "message": "Thông báo nghiệp vụ"
  }
  ```
* **List API & Pagination**: Các API dùng cho màn hình danh sách (List View) bắt buộc phải thực hiện filter và phân trang ở Server-side (nhận `page`, `limit`). Dữ liệu trả về phải có thêm object `meta` chứa `total_records`, `total_pages`. Tuyệt đối không query toàn bộ data rồi tự cắt mảng ở Client.
* **Detail API**: Khi xem chi tiết một record, bắt buộc phải gọi API Detail riêng (ví dụ: `GET /api/{resource}/:id`) để lấy thông tin mới và đầy đủ nhất, không truyền object từ props hay state của màn List sang màn Detail.