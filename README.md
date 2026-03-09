# ✨ Quản lý CV (Recruitment Lifecycle System)

**Một giải pháp tối ưu hóa vòng đời tuyển dụng và phân bổ nguồn lực (CV) linh hoạt giữa các dự án.**

[![Tech Stack](https://img.shields.io/badge/Tech_Stack-React_%7C_Node.js_%7C_PostgreSQL-blue?style=for-the-badge&logo=appveyor)](https://github.com/kocodaunb02-creator/quan-ly-cv)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2CA5E0?style=for-the-badge&logo=docker)](https://github.com/kocodaunb02-creator/quan-ly-cv)
[![Status](https://img.shields.io/badge/Status-In_Development-green?style=for-the-badge)](#)

---

## 🎯 Business Value (Giá trị nghiệp vụ)
Trong các tổ chức có nhiều nhóm dự án (Team) cùng có nhu cầu tuyển dụng dùng chung Pool CV, việc quản lý phân tán thường dẫn đến 2 nỗi đau lớn (Pain points):
1. **Xung đột dữ liệu (Conflict)**: Hai Manager của hai team khác nhau vô tình thao tác trên cùng một hồ sơ ứng viên tại cùng một thời điểm.
2. **Mất dấu vết (No History)**: Không nắm được lý do vì sao một CV bị loại ở Team A, nhưng lại có thể phù hợp để "Revert" (Khôi phục) đánh giá lại ở Team B. 

👉 **Hệ thống Quản lý CV** ra đời để đóng vai trò trung tâm (Single Source of Truth), quản lý xuyên suốt 5 trạng thái vòng đời ứng viên (từ Sourcing đến Onboarding). Hệ thống giúp **phối hợp nhịp nhàng giữa HR và Team Manager**, tối đa hóa việc **tái sử dụng nguồn lực CV** đã từng bị loại.

---

## 🚀 Key Technical Features (Tính năng kỹ thuật nổi bật)

Dự án áp dụng các pattern thiết kế hệ thống chuyên sâu nhằm giải quyết triệt để các bài toán nghiệp vụ phức tạp:

### 1. 🔄 State Machine Workflow (Luồng máy trạng thái)
Vòng đời CV tuân thủ nghiêm ngặt mô hình luồng trạng thái 1 chiều kết hợp cơ chế Revert linh hoạt. 
- Ngăn chặn hoàn toàn các chuyển đổi trạng thái phi logic (VD: Không thể nhảy thẳng từ `Sourcing` sang `Onboarding`).
- Đảm bảo tính nhất quán (Consistency) của dữ liệu CV tại mọi thời điểm.

### 2. 🕰️ JSONB Timeline Diff View (Theo dõi biến động dữ liệu)
- Tận dụng kiểu dữ liệu `JSONB` của PostgreSQL để snapshot (chụp) lại toàn bộ Payload Data sau mỗi lần cập nhật CV (VD: đổi trạng thái, cập nhật lương, đổi Team).
- **Giá trị**: Xây dựng màn hình Timeline trực quan giúp Admin (HR) dễ dàng so sánh sự khác biệt (Diff Old/New) của từng field bị thay đổi giống như lịch sử Commit trên Git. 

### 3. 🛡️ Optimistic Concurrency Control (Kiểm soát đồng thời)
- Áp dụng kỹ thuật OCC thông qua trường `updated_at` trong Database.
- **Duyệt xung đột**: Nếu hai Manager cùng thao tác trên 1 hồ sơ, hệ thống sẽ phát hiện độ lệch version và chặn (Throw 409 Conflict) yêu cầu đến sau, ngăn chặn hoàn toàn lỗi ghi đè dữ liệu tàng hình.

---

## 📂 Project Structure (Cấu trúc dự án)

Dự án được phân chia theo kiến trúc Frontend/Backend cô lập và quản lý chặt chẽ bằng Document Rules.

```bash
📦 QuanLyCV
 ┣ 📂 backend       # API Server (Node.js/Express, TypeScript)
 ┣ 📂 frontend      # Client App (React, Vite, Tailwind CSS)
 ┣ 📂 docs          # 📖 Hệ thống Docs là "Single Source of Truth" 
 ┃ ┣ 📜 rule-business/ # Chứa toàn bộ logic nghiệp vụ (Quyền hạn, Workflow...)
 ┃ ┣ 📜 timeline/      # Checklist tiến độ, Todo Tasks
 ┃ ┗ 📜 system-info/   # Cấu hình môi trường, DB Schema
 ┣ 📜 docker-compose.yml
 ┗ 📜 README.md
```
> 💡 **Triết lý phát triển**: Mọi dòng code sinh ra ở `frontend` hay `backend` đều phải ánh xạ 1-1 với quy tắc nghiệp vụ đã được định nghĩa và thống nhất trước tại thư mục `docs/`.

---

## 🛠️ Tech Stack (Công nghệ sử dụng)

* **Frontend**: React.js (Vite), TypeScript, Tailwind CSS, Context API.
* **Backend**: Node.js, Express.js, TypeScript.
* **Database**: PostgreSQL (Relational & JSONB features).
* **Containerization**: Docker & Docker Compose. 

---

## ⚙️ Setup Guide (Hướng dẫn cài đặt nhanh)

Dự án đã được đóng gói và chuẩn hóa môi trường bằng Docker. Để thử nghiệm toàn bộ hệ thống (Bao gồm Frontend, Backend và Database Postgres):

```bash
# 1. Clone repository
git clone https://github.com/kocodaunb02-creator/quan-ly-cv.git
cd quan-ly-cv

# 2. Khởi chạy toàn bộ hệ thống bằng 1 câu lệnh
docker-compose up -d --build
```

**Truy cập ứng dụng:**
* 🌐 Frontend UI: `http://localhost:5173` (hoặc port được map trong docker-compose)
* 🔌 Backend API: `http://localhost:3000`

---
*Developed with ❤️ as a robust solution for Talent Acquisition operations.*
