# Quy tắc Lập trình (Coding Rules) & Cấu trúc Công nghệ

Dự án `QuanLyCV` sẽ sử dụng hoàn toàn cùng một Technology Stack với dự án `Antigravity-Todo` để đảm bảo tính nhất quán và dễ dàng bảo trì.

## 1. Công nghệ (Technology Stack)

### Frontend
- **Framework:** React 19
- **Build Tool:** Vite
- **Styling:** Tailwind CSS (v4)
- **Routing:** React Router DOM
- **HTTP Client:** Axios
- **Icons:** Lucide React

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **File Upload:** Sử dụng `multer` để tiếp nhận file upload CV (.pdf, .doc, .docx). File được lưu trữ ở thư mục local trên Backend.
- **Database:** PostgreSQL (kết nối qua thư viện `pg`)
- **Authentication:** JSON Web Tokens (JWT) & bcryptjs
- **CORS & Environment:** thư viện `cors` và `dotenv`

### Infrastructure
- **Database Hosting:** Docker & Docker Compose (tạo môi trường PostgreSQL cô lập).

## 2. Quy tắc Lập trình Cốt lõi (Core Coding Rules)

### Cấu trúc thư mục
- **Frontend:** Chia rõ các thành phần `components`, `pages`, `utils`, `services` (gọi API).
- **Backend:** Phân tách `routes`, `controllers`, `models` (nếu có ORM) hoặc các hàm query db, `middlewares`.

### Đặt tên (Naming Conventions)
- **Biến & Hàm (Variables & Functions):** Sử dụng `camelCase` (ví dụ: `getUserData`, `taskStatus`).
- **Component (React):** Sử dụng `PascalCase` cho tên file và tên Component (ví dụ: `TaskDetailModal.jsx`).
- **Hằng số (Constants):** Sử dụng `UPPER_SNAKE_CASE` (ví dụ: `MAX_UPLOAD_SIZE`, `API_BASE_URL`).
- **Database (Bảng & Cột):** Sử dụng `snake_case` (ví dụ: `users`, `created_at`).

### Best Practices
- **Frontend:** Tất cả giao diện thiết kế bắt buộc phải chú trọng tính thẩm mỹ (Premium Designs), sử dụng các màu sắc hài hòa, typography hiện đại, và thêm micro-animations khi có tương tác (hover/click). Tránh dùng các màu cơ bản thô kệch.
- **Backend:** Sử dụng biến môi trường `.env` cho tất cả cấu hình nhạy cảm. Quản lý lỗi (Error Handling) rõ ràng để trả về JSON với format chuẩn (`{ status, message, data }`).

---
***Ghi chú:** Tài liệu này là kim chỉ nam cho các tác vụ lập trình trên dự án QuanLyCV. Mọi quyết định thay đổi công nghệ cần được xem xét và cập nhật tại đây.*
