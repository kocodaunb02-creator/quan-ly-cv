# Tổng hợp Danh sách Backend API (Hệ thống Quản lý CV)

Dưới đây là thiết kế chi tiết các luồng API đã được xây dựng bằng Node.js + Express + Prisma ở Phase 3. Tất cả các endpoint (ngoại trừ Login) đều yêu cầu Client phải gửi thẻ cấp quyền ở Header: `Authorization: Bearer <token>`.

---

## 1. Authentication (Xác thực & Phân quyền)
Base URL: `/api/auth`

| Phương thức | Endpoint | Chức năng (Ý nghĩa) | Quyền (Role) | Body / Params / Form-Data |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/login` | Đăng nhập hệ thống. Trả về JWT Token cùng thông tin User (ID, Name, Roles: `HR` hoặc `MANAGER`, và `teamId`). | Công khai | Json: `{ "username": "...", "password": "..." }` |

---

## 2. Quản lý CV Pool (Sourcing & Liệt kê)
Base URL: `/api/candidates`

| Phương thức | Endpoint | Chức năng (Ý nghĩa) | Quyền (Role) | Body / Params / Form-Data |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/upload` | HR (tuyển dụng) đẩy một CV mới lên hệ thống. Ảnh/PDF được tự động ném vào thư mục `/uploads`. Trạng thái mặc định tự động gán là `Sourcing`. | `HR`, `ADMIN` | Form-Data: <br/>- File: `cvFile` (Chỉ nhận doc, docx, pdf)<br/>- Text: `name`, `email`, `phone`, `role_code`, `school_code`, `demo_link` |
| **GET** | `/` | Lấy danh sách CV (Pool) mới nhất. Bỏ qua các record đã bị xóa mềm (`deleted_at: null`). <br/><br/>👉 **Quy định RBAC (Giới hạn Dữ liệu):**<br/>- **HR:** Nhìn thấy TẤT CẢ ứng viên thuộc mọi Team & Mọi Trạng thái, CÓ hiển thị Mức Lương (`salary_offer`).<br/>- **MANAGER:** Bị ẨN hoàn toàn field Lương. Chỉ nhìn thấy CV nếu CV đó thuộc Team của mình, HOẶC nếu CV đang nằm chơi với `Sourcing`, HOẶC bị `Rejected`. | `HR`, `MANAGER`, `ADMIN` | Query: `?page=1&limit=10&search=xyz` - Trả về mảng danh sách CV + thông tin liên quan (Team, School, State). |
| **GET** | `/:id` | Lấy chi tiết một CV. Tích hợp tương tự RBAC của List API (Chặn xem CV khác Team). Tự động filter trường Lương tuỳ quyền. | `HR`, `MANAGER`, `ADMIN` | URL Param: `id` - Trả về chi tiết ứng viên. |
| **PUT** | `/:id` | Cập nhật hồ sơ ứng viên. Sửa Name, Email, Phone, Role, Level, School, Demo Link. Nếu có field `salary_offer` thì Server sẽ check quyền `VIEW_SALARY` trước khi cho phép lưu db. | `HR`, `MANAGER`, `ADMIN` | URL Param: `id`<br/><br/>Json Body: <br/> `{ "name": "...", "phone": "...", ... }` |
| **DELETE** | `/:id` | Xóa mềm hồ sơ ứng viên (`deleted_at`). Trigger `ActionLog`. | `HR`, `MANAGER`, `ADMIN` | URL Param: `id` |

---

## 3. Luân chuyển Trạng thái & Gán Team (Workflow)
Base URL: `/api/workflow`

| Phương thức | Endpoint | Chức năng (Ý nghĩa) | Quyền (Role) | Body / Params / Form-Data |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/candidates/:candidateId/assign` | Quản lý Team tiến hành "Pick" CV từ Pool Sourcing mang về Team của mình để phỏng vấn/xem xét.<br/><br/>👉 **Logic Backend:** Tự lấy ID của Manager đang click chuột qua token để biết CV rơi về Team nào. | `HR`, `MANAGER`, `ADMIN` | URL Param: `candidateId`<br/><br/>Json Body: (tùy chọn) `team_code` nếu HR thay mặt gán. |
| **POST** | `/candidates/:candidateId/state` | Đổi trạng thái hiển thị của CV (Ví dụ: Đẩy từ vòng *HR Screening* sang *Interviewing* hoặc *Rejected*). Mọi cú click đổi bài báo này đều được ghi vết (Audit). | `HR`, `MANAGER`, `ADMIN` | URL Param: `candidateId`<br/><br/>Json Body:<br/>- `new_state_code`: (VD: "Interviewing")<br/>- `note`: Lý do hoặc Text gì đó để lưu lại History. |

---

## 4. Lịch sử Di chuyển (Audit Log)
Base URL: `/api/history`

| Phương thức | Endpoint | Chức năng (Ý nghĩa) | Quyền (Role) | Body / Params / Form-Data |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/candidates/:candidateId` | Lấy dữ liệu ghi lại (ai làm, vào lúc nào, đổi từ vòng nào sang vòng nào, lý do là gì) của một số báo CV cụ thể.<br/><br/>🔥 **Data Masking:** Nếu bạn là **Manager** và cố tình query ID của CV đang giao cho Team KHÁC, Backend sẽ chặn đứng báo Lỗi **403 Forbidden**. | `HR`, `MANAGER`, `ADMIN` | URL Param: `candidateId` - Trả về mảng JSON dữ liệu lịch sử. |

---

### Tự động bảo vệ Lương (Salary Middleware)
Như đã quy định ở tài liệu thiết kế lúc trước: 
- Dữ liệu trả về ở **Controller `GET /api/candidates`** sẽ kiểm tra trực tiếp qua thuộc tính `VIEW_SALARY` được cấu hình từ bảng `permissions` trong Database.
- Khi người dùng Login, thẻ `JWT` sinh ra đã bao gồm mảng `permissions` như `["VIEW_SALARY", "EDIT_CV"]`.
- Backend kiểm tra nếu user KHÔNG chứa `VIEW_SALARY`, sẽ tiến hành ghi đè biến `salary_offer = null` trực tiếp ở Backend ngay trước khi trả Data JSON về. Front-End (Giao diện) của Team Lead hoàn toàn không có cách nào tự bùa ngải để móc xem được mức lương này.
