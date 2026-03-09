# Kế hoạch Triển khai Frontend: Hệ thống Quản lý CV

Dựa trên thiết kế UI Mockup tại `docs/design/design-QuanLyCV.pen` và các API Backend đã hoàn thành, chúng ta sẽ xây dựng Frontend bằng **React, Vite, và TailwindCSS** theo chuẩn Premium Design.

---

## 4. Giai đoạn Phát triển Frontend (Phase 4)
Giai đoạn này sẽ được chia thành các bước nhỏ để dễ dàng kiểm soát luồng dữ liệu (Data Flow) và UX.

### 4.1 Khởi tạo và Cấu hình Project Frontend
- **Công nghệ (Tech Stack)**: Chạy lệnh `npm create vite@latest frontend -- --template react-ts` để khởi tạo.
- **Thư viện Core**: 
  - Routing: `react-router-dom`
  - Fetching Data: `axios` (hoặc `fetch` tích hợp chung với Context API)
  - Styling: `tailwindcss` (và setup `postcss`).
  - Icons: `lucide-react` (icon hiện đại, nhẹ).
- **Cấu trúc thư mục (Folder Structure)**:
  - `src/components/`: Chứa các Component dùng chung (Button, Input, Modal, Table).
  - `src/pages/`: Chứa các trang chính (Login, Dashboard).
  - `src/context/`: Chứa trạng thái Auth và Quyền (Permissions).
  - `src/services//: Chứa cấu hình gọi API Backend.

### 4.2 Triển khai Luồng Authentication (Đăng nhập & Phân quyền)
- **Login Page (`/login`)**: Code lại giao diện `Web Login Screen`. Gắn API `POST /api/auth/login`.
- **Auth Context (`AuthContext.tsx`)**: Lưu JWT token vào `localStorage`. Extract thông tin `user` (gồm ID, `roles`, và `permissions`) để giữ trạng thái đăng nhập cho toàn ứng dụng.
- **Protected Routes**: Tạo Component bọc ngoài để đá những người chưa có Token văng ra trang Login, và ngược lại nếu có Token thì không cho vào trang Login nữa.

### 4.3 Xây dựng Layout Dashboard & Navigation
- **Top Navbar (`TopNavbar` component)**: Header phía trên hiển thị Logo và Thông tin User đang đăng nhập.
- **Main Content Layout (`/dashboard`)**: Khung chứa nội dung chính của bảng Quản lý CV.

### 4.4 Phát triển Màn hình Danh sách CV (Dashboard List View)
- Xây dựng Component **Filter Box**: Bộ lọc theo "State", "Role", và ô "Search Tên".
- Xây dựng **Table Data Grid (`Table Container`)**: Hiển thị danh sách CV Fetch từ `GET /api/candidates`.
- **Trọng tâm Nghiệp vụ**: 
  - Code logic ẩn hiện cột Lương dựa trên mảng `permissions.includes('VIEW_SALARY')` lấy từ AuthContext.
  - Phân trang hoặc Scroll nếu cần thiết.

### 4.5 Xây dựng Các Component Modals (Thao tác Workflow)
- **Modal Upload CV (`Upload Modal Overlay`)**: Form điền thông tin và Upload File, gọi `POST /api/candidates/upload`.
- **Slide-over Modal Chi tiết CV (`CV Detail Slide-Over`)**:
  - **Tab 1 (Thông tin chung & File PDF Viewer)**: Hiển thị file PDF và nút thao tác như *Pick CV*, *Reject*, *Đổi Trạng Thái* tùy vào phân quyền và State hiện tại.
  - **Tab 2 (Lịch sử Audit)**: Gọi API `GET /api/history/...` và hiển thị Timeline (Ai làm gì, lúc nào).
  - **Tab 3 (Action Form)**: Form nhập `Note` hoặc chọn State mới.

---

## User Review Required

> [!IMPORTANT]
> **Kế hoạch cho Phần Frontend (Phase 4) đã được phác thảo chi tiết cấu trúc thư mục, luồng Auth, và cách chia Component theo file thiết kế.**
> 
> 1. Xin xác nhận xem luồng chia Component phía trên đã đúng với mong muốn tổ chức Code (Folder Structure) của bạn chưa?
> 2. Bạn có muốn dùng thư viện Quản lý State nào nặng đô hơn (như *Redux Toolkit* hay *Zustand*) không, hay ta sẽ dùng `React Context` nhẹ nhàng kết hợp với custom hooks?
> 3. Ta sẽ dùng `Lucide-React` cho Hệ thống Icon nhé?
> 
> 👉 Nếu bạn đồng ý với kế hoạch này, tôi sẽ tiến hành gõ lệnh Khởi tạo Project (Vite) và Setup Tailwind ngay lập tức.
