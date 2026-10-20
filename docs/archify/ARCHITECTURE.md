# 🏗️ Tổng quan hệ thống ReliefGrid

ReliefGrid là ứng dụng web demo (không backend) điều phối hàng cứu trợ thiên tại theo nhu cầu thực tế.
Slogan: **"Đừng để lòng tốt bị lãng phí"**. Sản phẩm thi AISC'26.

## 1. Tech stack

| Công cụ | Vai trò |
|---------|---------|
| React 18 + Vite | Giao diện đơn trang (SPA), build nhanh |
| TypeScript | Kiểu dữ liệu, lỗi phát hiện sớm |
| Tailwind CSS | Css utility, thiết kế nhanh |
| react-router-dom | Điều hướng giữa các trang |
| zustand | Quản lý state global (trạm, đơn hàng, auth, toast…) |
| lucide-react | Biểu tượng SVG |
| qrcode.react | Sinh mã QR cho đơn tự giao |

## 2. Các trang chính

| Đường dẫn | Trang | Mô tả |
|-----------|-------|-------|
| `/` | Trang chủ | Bản đồ Việt Nam, bộ lọc trạm, danh sách nhu cầu khẩn cấp |
| `/quyen-gop` | Quyên góp | Wizard 3 bước: chọn trạm/món → hình thức → xác nhận |
| `/quyen-gop-cua-toi` | Đơn của tôi | Lịch sử đơn, đơn chờ offline, đồng bộ |
| `/nha-phan-phoi` | Mua sắm | Quản lý sản phẩm, đơn cứu trợ (distributor) |
| `/thong-ke` | Thống kê | Báo cáo tổng quan |
| `/tram-quan-ly` | Trạm quản lý | Quản lý hồ sơ trạm, xác nhận nhận hàng |
| `/van-chuyen` | Vận chuyển | Quản lý đơn vận chuyển (carrier) |
| `/dang-nhap` | Đăng nhập / đăng ký | Vai trò donor, station, distributor |
| `/admin/xac-minh` | Admin xác minh | Duyệt trạm, duyệt tài khoản station/NPP (chỉ admin) |
| `*` | 404 | Trang không tồn tại |

## 3. Luồng dữ liệu center

Tất cả state nằm trong **zustand store** duy nhất (`src/store/useAppStore.ts`):
- `stations`: danh sách trạm cứu trợ + nhu cầu hàng (D/R/T)
- `orders`: đơn quyên góp
- `products`, `carriers`: sản phẩm NPP và đơn vị vận chuyển
- `userRole`, `isLoggedIn`: phân quyền (demo, tự xưng)
- `approvals`: đơn xin tài khoản chờ admin duyệt
- `messages`: tin nhắn donor ↔ nhà phân phối
- `wizard`, `filters`: form quyên góp và bộ lọc trang chủ

Dữ liệu mặc định là **mock** trong `src/data/` (9 trạm, 8 mặt hàng, 4 đơn mẫu). Reload trang sẽ reset hàng hóa, nhưng đăng nhập được nhớ qua `localStorage`.

## 4. Bản đồ Việt Nam

- `src/data/vnProvinces63.ts` / `vnProvinces34.ts`: ranh giới 63 tỉnh (trước sáp nhập) và 34 tỉnh (sau sáp nhập theo NQ 202/2025/QH15)
- Toggle trước/sau sáp nhập
- Click vào tỉnh/pin trên bản đồ → mở dialog trạm cứu trợ ở khu vực đó

## 5. Điều chỉnh quan trọng

- Không có backend thực. Phân quyền là demo (frontend check), không an toàn cho production.
- Mã admin nội bộ lưu dưới dạng hash djb2 trong `src/config/dev.ts`, không lưu plaintext.
- Hình ảnh sản phẩm là URL dán tay, không upload thật.

> Mục tiêu: đọc xong file này bạn nắm được hệ thống ReliefGrid hoạt động như thế nào, mỗi trang làm gì, dữ liệu luồng thế nào.
