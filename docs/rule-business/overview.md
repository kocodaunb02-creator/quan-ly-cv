# 📄 TỔNG QUAN NGHIỆP VỤ: HỆ THỐNG QUẢN LÝ CV (RECRUITMENT LIFECYCLE)
## 1. Mục tiêu dự án (Objectives)
Hệ thống được thiết kế để quản lý tập trung toàn bộ vòng đời ứng viên, tối ưu hóa sự phối hợp giữa bộ phận HR và các Team Manager. Mục tiêu chính là xây dựng đội ngũ nhân sự đầy đủ cho từng nhóm dự án (Team) và tái sử dụng nguồn lực CV linh hoạt giữa các nhóm thông qua cơ chế luân chuyển trạng thái thông minh.

## 2. Phân loại Role ứng viên (Candidate Roles)
Ứng viên khi được Sourcing sẽ được phân loại vào các nhóm chuyên môn cốt lõi của Game Team:
* **Artist**: Chuyên môn về Mỹ thuật, Concept, 2D/3D Animation.
* **Dev**: Lập trình viên hệ thống, Unity, Frontend/Backend.
* **Game Design (GD)**: Thiết kế kịch bản, cơ chế và trải nghiệm Game.
* **QA**: Kiểm thử chất lượng sản phẩm và quy trình vận hành.
* **Video Editor**: Hậu kỳ, Motion Graphics và sản xuất Video Marketing.
* **Admonet (Monetization & Ads)**: Bộ phận chuyên môn đánh giá vị trí đặt Quảng cáo (Ads) trong Game để tối ưu hóa lợi nhuận cho sản phẩm.

## 3. Quy trình Vòng đời CV (Recruitment Lifecycle)

### 3.1. Sơ đồ trạng thái (State Diagram)
 ```mermaid
stateDiagram-v2
    [*] --> Sourcing: HR Upload (Pool chung)
    
    Sourcing --> HR_Screening: HR trao đổi trước với ứng viên
    
    state HR_Screening {
        [*] --> Initial_Contact
        Initial_Contact --> HR_Evaluation
    }
    
    HR_Screening --> Manager_Review: Pass Screening (HR đẩy CV cho Manager / Manager Pick)
    HR_Screening --> Rejected: Fail Screening
    
    Manager_Review --> Interviewing: Manager duyệt hồ sơ (Pass)
    Manager_Review --> Rejected: Manager loại hồ sơ
    
    Interviewing --> Offering: Phỏng vấn Đạt
    Interviewing --> Rejected: Phỏng vấn Loại
    
    Offering --> Onboarding: Ứng viên đồng ý Offer
    Offering --> Rejected: Ứng viên từ chối Offer
    
    Rejected --> Manager_Review: Manager Team khác "Revert" CV
    Onboarding --> [*]
```

### 3.2. Mô tả các giai đoạn chi tiết

| Giai đoạn | Trạng thái (System Code) | Tên Tiếng Việt | Hành động nghiệp vụ | Phụ trách |
| :--- | :--- | :--- | :--- | :--- |
| **Khởi tạo** | `Sourcing` | **Nguồn CV / Tìm kiếm** | HR upload CV lên Pool chung hoặc gán thẳng cho một Team cụ thể. | HR |
| **Sơ loại** | `HR_Screening` | **Sơ loại HR** | HR đánh giá thái độ, kỹ năng mềm và trao đổi sơ bộ với ứng viên. | HR |
| **Thẩm định** | `Manager_Review` | **Quản lý Đánh giá** | Team Manager tiếp nhận CV (Pick), thẩm định năng lực chuyên môn. | Team Manager |
| **Phỏng vấn** | `Interviewing` | **Phỏng vấn** | Thực hiện phỏng vấn sâu và ghi nhận đánh giá tổng hợp. | HR & Manager |
| **Thỏa thuận** | `Offering` | **Đề xuất Lương** | Trao đổi chi tiết về lương, đãi ngộ và chốt ngày nhận việc. | HR |
| **Tiếp nhận** | `Onboarding` | **Nhận việc** | Ứng viên đồng ý Offer và làm thủ tục nhận việc. | HR |
| **Lưu trữ** | `Rejected` | **Từ chối / Bị loại** | Không phù hợp, từ chối hoặc ứng viên từ chối offer, lưu DB phục hồi (Revert). | HR / Manager |

## 4. Quy tắc nghiệp vụ & Phân quyền (Business Rules & RBAC)

### 4.1. Phân quyền theo Nhóm dự án (Team-based Access)
* **Quyền HR**: Có toàn quyền (Full Access) truy cập tất cả các Team, xem thông tin tất cả các Role và quản lý dữ liệu lương (Offer).
* **Quyền Team Manager**: Được phân quyền theo Nhóm dự án cụ thể (Ví dụ: Manager Nhóm A, Manager Nhóm B).
* **Phạm vi quản lý**: Manager Nhóm A nhìn thấy toàn bộ CV thuộc tất cả các Role (Dev, Artist, QA, GD, Video Editor, Admonet) đang được tuyển dụng cho Nhóm A.
* **Tầm nhìn mở rộng**: Tất cả Manager đều thấy toàn bộ CV ở trạng thái Sourcing (Mới upload) và Rejected (Đã bị loại từ các nhóm khác).

### 4.2. Cơ chế Pick & Revert (Chọn và Khôi phục)
* **Hành động Pick**: Khi Manager chọn một CV từ Pool Sourcing, hệ thống gán team_id của Manager đó vào hồ sơ và chuyển sang Manager Review.
* **Hành động Revert**: Manager có thể khôi phục một CV đã bị Reject từ bất kỳ nhóm nào khác để gán về Team mình đánh giá lại.
* **Lưu vết**: Hệ thống bắt buộc lưu lại lịch sử thay đổi Team và lý do Reject của các Team trước đó để tham khảo.

### 4.3. Bảo mật & Lưu trữ
* **Bảo mật**: Chỉ HR mới được phép thao tác và xem các trường dữ liệu liên quan đến mức lương (Salary Offer).
* **Lưu trữ**: CV không đạt sẽ được lưu trữ vĩnh viễn ở trạng thái Rejected để tái sử dụng nguồn lực trong tương lai.