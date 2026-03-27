# Tài liệu Yêu cầu Nghiệp vụ (BRD): Nâng cấp Quản lý Job lên BullMQ

## 1. Thông tin chung
- **Dự án:** Quản lý CV (Recruitment Lifecycle System)
- **Tên tính năng:** Hệ thống Quản lý Job nền tảng BullMQ & Redis
- **Vai trò:** Senior Business Analyst
- **Ngày lập:** 27/03/2026
- **Trạng thái:** Nâng cấp cấu trúc (Refactor & Upgrade)

## 2. Mục tiêu kinh doanh
Hệ thống hiện tại đang sử dụng thư viện `node-cron` để quản lý các background task (như quét CV trùng lặp, dọn dẹp dữ liệu rác, xử lý trạng thái theo thời gian). Tuy nhiên, để đảm bảo tính sẵn sàng cao và khả năng mở rộng của sản phẩm trong tương lai, `node-cron` không còn đáp ứng đủ nhu cầu vận hành vì các rào cản về theo dõi trạng thái, thiếu khả năng tự khôi phục động (retry), và rủi ro gián đoạn luồng xử lý chính.

**Mục tiêu của việc nâng cấp sang BullMQ:**
- **Kiểm soát dòng chảy dữ liệu:** Xử lý Queue (hàng đợi) bất đồng bộ mạnh mẽ nhờ tận dụng hiệu năng của in-memory datastore (Redis).
- **Quản trị rủi ro sự cố:** Cung cấp cơ chế tự động thử lại (Retry / Backoff) với các mức độ trễ linh hoạt nhằm bảo vệ dữ liệu khi Background Job thất bại do lỗi bên thứ 3 hoặc tải cao.
- **Tính minh bạch (Auditability):** Lưu vết toàn bộ lịch sử (Logs & Events) công việc rõ ràng để audit và theo dõi.
- **Tư duy quản trị:** Trực quan hóa tiến trình và vòng đời các job để Admin dễ dàng giám sát vận hành dự án, tránh các "điểm mù" (Blind spots) trong vận hành hệ thống.

## 3. Phạm vi dự án
- **Hạ tầng:** Tích hợp Redis vào project architecture (với Docker) phục vụ cho hàng đợi của BullMQ.
- **Chuyển đổi:** Loại bỏ hoàn toàn `node-cron`, thay thế và refactor các tiến trình hiện tại (Duplicate CV Check, Auto-Cleanup) sang cấu trúc Worker của BullMQ.
- **UI Giám sát:** (Tùy chọn/Mở rộng) Tích hợp BullMQ Board hoặc UI nội bộ kết nối API để cho phép Admin theo dõi trạng thái công việc toàn hệ thống (Completed, Failed, Delayed, Active, Waiting).

## 4. Yêu cầu nghiệp vụ

| Mã YC | Tên Yêu cầu | Mô tả chi tiết | Mức độ ưu tiên |
|---|---|---|---|
| BR-JM-01 | Chuyển đổi Cron sang Repeatable Job | Toàn bộ các cron schedule cũ phải chuyển thành Repeatable Pattern của BullMQ. Nhằm đảm bảo vẫn chạy theo định kỳ (vd: quét 1 lần mỗi giờ). | High |
| BR-JM-02 | Cơ chế Retry Job (Thử lại tự động) | Các job ở trạng thái failed (lỗi kết nối, xử lý logic) được thiết đặt chế độ Retry tự động tối đa 3-5 lần. Thời gian chờ (Backoff) tăng dần sau mỗi lần fail tránh spam server. | High |
| BR-JM-03 | Theo dõi sự kiện (Event Tracking) | Bắt buộc lắng nghe và ghi nhận (log) các trigger event: `completed`, `failed`, `stalled` vào logging file/DB của hệ thống giúp dễ truy xuất lịch sử. | Medium |
| BR-JM-04 | Phân tách Queue & Worker | Kiến trúc bộ source cần chia tách độc lập `Queue Producer` (Nơi đẩy thông tin cần làm) và `Worker Consumer` (Nơi tiếp nhận & xử lý thông tin) để không gây block Main Engine. | High |
| BR-JM-05 | Quản trị kẹt hàng đợi (Stalled Jobs) | Cấu hình tự động dọn dẹp (RemoveOnComplete, RemoveOnFail) một số lượng nhất định nhằm tránh tràn bộ nhớ Redis, quản trị tốt rủi ro memory leak. | Medium |

## 5. Yêu cầu phi chức năng
- **Hiệu năng & Khả năng mở rộng (Scalability):** Tách bạch quá trình xử lý nền với CRUD API, cho phép nhân bản (Scale) số lượng Worker trên nhiều container để song song xử lý nếu tải trọng đẩy lên >10,000 requests/ngày.
- **Tính sẵn sàng (Availability):** Sự cố tạm thời tại Worker không làm gián đoạn End-User, vì Job sẽ được Retry. Lỗi từ Redis sẽ được giới hạn rủi ro và không làm sập chức năng tìm kiếm hay chỉnh sửa thao tác chính thống (Core Features) từ Manager.

## 6. Tiêu chí nghiệm thu (Acceptance Criteria)
1. Khởi động các container bao gồm Redis, Nodejs thành công không ném ngoại lệ.
2. Mô phỏng (Mocking) thử việc một tiến trình bị lỗi: Hệ thống ghi nhận job Failed và tự động Retry đủ số lần quy định rồi mới Stop.
3. Job hoàn thành thì sau một khoảng thời gian tự động loại bỏ khỏi Redis memory (config giới hạn cache max 100 queue).
4. Xác minh không còn cảnh báo từ tính thread-blocking của `node-cron` trên các báo cáo performance.

## 7. Danh sách Lịch trình công việc (Job Schedule)

Để thuận tiện cho việc đối soát và theo dõi thời gian vận hành, dưới đây là danh mục các Background Job định kỳ đã cấu hình trên BullMQ:

| Tên Queue (Job Name) | Biểu thức Cron | Thời điểm chạy | Tác vụ xử lý | Cơ chế Retry |
|---|---|---|---|---|
| `CleanupQueue` (`cleanup-job`) | `0 0 * * *` | 00:00 (Nửa đêm) mỗi ngày | Quét toàn bộ hồ sơ CV hơn 6 tháng không cập nhật và tiến hành xoá thủ công (Soft-delete). | 3 attempts (Backoff: 5s) |

*(Bảng này đóng vai trò như Sổ tay Vận hành và sẽ tiếp tục được cập nhật khi team phát triển thêm các tiến trình tự động khác).*
