# 🔐 Phân quyền (Role-Based Access Control)

ReliefGrid sử dụng phân quyền demo (frontend check, chưa có backend thực). Vai trò được tự xưng khi đăng ký, lưu trong `localStorage` (`reliefgrid-auth`).

## 5 vai trò trong hệ thống

| Vai trò | Đăng ký | Cần duyệt admin? | Quyền chính |
|---------|---------|------------------|-------------|
| **Donor** (Người quyên góp) | Dùng ngay | Không cần | Quyên góp hàng, chat với nhà phân phối, xem đơn của mình |
| **Station** (Trạm cứu trợ) | Đăng ký | **Có** | Xác nhận/duyệt/từ chối đơn, sửa nhu cầu D, đăng ảnh minh chứng, quản lý khu vực phục vụ |
| **Distributor** (Nhà phân phối) | Đăng ký | **Có** | Quản lý sản phẩm, xử lý đơn cứu trợ, rút tiền (khi đã duyệt) |
| **Admin** (Quản trị viên) | URL bí mật | Cao nhất | Duyệt trạm, duyệt mọi đơn, duyệt tài khoản Station/NPP |
| **null** (Chưa đăng nhập) | — | — | Chỉ xem trang chủ, bản đồ |

## Luồng duyệt tài khoản Station / Distributor

1. Người dùng đăng ký vai trò Station hoặc Distributor tại `/dang-nhap`.
2. Tài khoản về trạng thái `pending`, tính năng chính bị khóa, hiện banner đỏ.
3. Admin vào `/admin/xac-minh`, tab "Duyệt tài khoản", duyệt hoặc từ chối.
4. Nếu duyệt: tài khoản thành `verified`, đăng nhập lần sau mở khóa ngay.

## Admin đăng nhập

- Không có trang đăng ký/đăng nhập công khai.
- Cửa duy nhất: URL bí mật `/dang-nhap?dev=<MÃ_NỘI_BỘ>`.
- Mã mẫu hiện tại: `RG-ADMIN-2026` (lưu hash djb2 trong `src/config/dev.ts`).
- Dev cấp link qua kênh riêng, không dán công khai.

## Tóm tắt phân quyền trong code

File liên quan:
- `src/types/models.ts`: `Role = 'station' | 'donor' | 'distributor' | 'admin' | null`
- `src/store/useAppStore.ts`: `quickLogin`, `registerDemo`, `approveAccount`, `rejectAccount`, `verifyStation`, `rejectStation`
- `src/router.tsx`: `RequireAdmin` guard cho route `/admin/xac-minh`
- `src/components/layout/Chrome.tsx`: nav item Admin chỉ hiển thị khi `userRole === 'admin'`

> Lưu ý: phân quyền demo chỉ check ở frontend. Muốn thật cần có DB + backend.
