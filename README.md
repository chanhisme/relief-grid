# ReliefGrid — Trạm cứu trợ số

Demo giao diện (không backend) nền tảng điều phối hàng cứu trợ thiên tai theo nhu cầu thực tế.
Slogan: **"Đừng để lòng tốt bị lãng phí"**. Sản phẩm thi AISC'26.

## Tech stack

React + Vite + TypeScript, Tailwind CSS, react-router, zustand, lucide-react.
Dữ liệu mock trong `src/data`, state demo trong zustand (reload thì hàng hóa reset, đăng nhập được nhớ qua localStorage).

## Chạy dự án

```bash
npm install
npm run dev     # chạy local
npm run build   # build production (bắt buộc pass, không lỗi TypeScript)
```

## Logic nghiệp vụ cốt lõi

Mỗi mặt hàng tại mỗi trạm có 3 số: **D** (nhu cầu) – **R** (đã nhận) – **T** (đang vận chuyển).
Còn thiếu **S = max(0, D − R − T)**. **S = 0 thì khóa quyên góp** (thẻ xanh + tooltip + gợi ý trạm khác).
Nhập số lượng vượt S bị chặn + đề xuất chuyển phần dư sang trạm khác.

## Phân quyền (mock RBAC, demo)

| Vai trò | Quyền |
|---|---|
| Người quyên góp | Đăng ký dùng ngay, không cần duyệt |
| Trạm cứu trợ | Đăng ký → **chờ admin duyệt**; được duyệt đơn/xác nhận hàng về trạm mình |
| Nhà phân phối | Đăng ký → **chờ admin duyệt**; được quản lý gian hàng khi đã duyệt |
| Admin (cao nhất) | Duyệt trạm, duyệt mọi đơn, duyệt tài khoản Trạm/NPP |

Tài khoản Trạm/NPP đang `pending` bị khóa tính năng chính (trạm: xác nhận/duyệt/từ chối/sửa D/minh chứng; NPP: rút tiền/lưu SP/xử lý đơn) kèm banner đỏ.
Luồng demo duyệt chờ: đăng ký NPP mới → vào admin duyệt ở tab "Duyệt tài khoản" → NPP đăng nhập lại (cùng tên) thành verified.

> Lưu ý honesty: phân quyền hiện tại là demo (role tự xưng, check ở frontend). Muốn thật phải có DB + backend (xem `src/config/dev.ts`).

## 🔑 Key đăng nhập admin (nội bộ dev)

**Admin KHÔNG có chỗ đăng ký/đăng nhập công khai.** Cửa duy nhất là URL bí mật:

```
/dang-nhap?dev=<MÃ_NỘI_BỘ>
```

- Mở đúng link → tự đăng nhập "Quản trị viên (demo)" + nhảy sang trang Admin.
- Mở sai/thiếu mã → trang Đăng nhập hiện bình thường, không lộ dấu vết.
- Mã mẫu hiện tại: `RG-ADMIN-2026` (chỉ lưu **hash djb2** trong `src/config/dev.ts`, không lưu plaintext).
- **Đổi/thu hồi mã:** sửa số `DEV_ADMIN_HASH` trong `src/config/dev.ts` + build/deploy lại (link cũ chết ngay). Tính hash mã mới: `node -e "let h=5381;const s='MÃ-MỚI';for(let i=0;i<s.length;i++){h=(h*33+s.charCodeAt(i))>>>0;}console.log('0x'+h.toString(16))"`.
- Dev cấp link qua kênh riêng, **không dán lên nhóm chung/README công khai**. Trước ngày thi nên đổi mã 1 lần.
- Nhắc lại: mã nằm trong bundle frontend nên người đọc kỹ source vẫn moi được — đây là "khóa phòng demo", chống bypass thật phải có backend.

## Bản đồ Việt Nam

- Ranh giới 63/34 tỉnh + Hoàng Sa/Trường Sa từ `Free-GIS-Data` (biên soạn từ TTXVN + Cục Đo đạc, Bản đồ và Thông tin địa lý VN), đã rút gọn nhúng offline vào `src/data/vnProvinces63.ts` / `vnProvinces34.ts`. **Không có đường lưỡi bò.**
- Toggle Sau sáp nhập (34) / Trước sáp nhập (63) theo NQ 202/2025/QH15 (bản 34 đã vá thêm Đồng Tháp). Tên cũ hiển thị có dấu đầy đủ.
- Map: zoom lăn chuột/slider, kéo-rê có quán tính, pinch mobile, fullmap modal, bấm tỉnh/pin mở dialog cứu trợ giữa màn hình.

## Cấu trúc thư mục

```text
src/
  main.tsx, router.tsx, index.css
  types/models.ts        # Station, DonationOrder, Role, ...
  lib/                   # needLogic (D/R/T/S), geo (chiếu bản đồ), format, suggest
  data/                  # stations, items, extras, provinces, vnProvinces63/34
  store/useAppStore.ts   # zustand: stations, orders, auth, approvals, toasts, filter, wizard
  config/dev.ts          # hash mã admin nội bộ
  components/            # layout, ui, home (bản đồ), station, donate, orders
  pages/                 # Home, StationDetail, DonateWizard, MyDonations,
                         # Auth, StationDashboard, Distributor, Carrier, Stats, AdminVerify
```

## Ghi chú demo

- Reload reset hàng hóa/đơn mẫu; vai trò đăng nhập được nhớ (localStorage `reliefgrid-auth`), đăng xuất thì xóa.
- Offline/demo toggles, chế độ tiết kiệm dữ liệu nằm trên header.
- Tìm kiếm trang chủ chỉ theo tỉnh thành (tên mới + tên cũ).
