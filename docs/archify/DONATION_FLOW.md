# 🔄 Luồng quyên góp (Donation Flow)

Dưới đây là toàn bộ hành trình một đơn quyên góp trong ReliefGrid, từ khi người dùng nhấn nút đến khi trạm xác nhận nhận hàng.

## Bước 1: Chọn trạm và món hàng

Người dùng vào trang `/quyen-gop` (DonateWizardPage).

- Hệ thống liệt kê các trạm còn cần hàng (`calcS(n) > 0` và chưa `closed`).
- Có thể lọc theo tỉnh, loại hàng, mức khẩn cấp, khoảng cách.
- Người dùng chọn 1 trạm và 1 mặt hàng cần hỗ trợ.

## Bước 2: Chọn hình thức quyên góp

Có 3 phương thức (`DonateMethod`):

| Hình thức | Mô tả | Mã vận đơn |
|-----------|-------|------------|
| `self` | Tự mang đến điểm tập kết | Không có (sinh mã QR để trạm quét) |
| `carrier` | Đặt đơn vị vận chuyển giao hàng | `TRK-<mã đơn>` |
| `buy` | Mua trực tiếp từ nhà phân phối | `TRK-<mã đơn>` |

Nếu chọn `carrier`: nhập địa chỉ lấy hàng, chọn ĐVVC (Nhanh Express / Cứu trợ Logistics / Tốc hành Miền Trung).
Nếu chọn `buy`: chọn sản phẩm tương ứng, cổng thanh toán (Momo / ZaloPay / Chuyển khoản), chat với NPP.

## Bước 3: Xác nhận và tạo đơn

Gọi `createOrder()` trong zustand:

1. Nếu **offline**: đơn vào hàng chờ `pendingSync`, chưa có mã, chưa tăng T.
2. Nếu **online**: gọi `commitOrder()`:
   - Cấp mã đơn duy nhất (`RG-1005`, `RG-1006`, …), lưu counter vào `localStorage`.
   - Tăng `T` (đang vận chuyển) của trạm qua `incT()`, kẹp theo số còn thiếu `S`.
   - Nếu mua trực tiếp: trừ tồn kho nhà phân phối.
   - Đơn vào danh sách `orders` với trạng thái `created`.

## Bước 4: Xử lý trường hợp nhập vượt số còn thiếu

Công thức cốt lõi: **S = max(0, D − R − T)** (còn thiếu).

Nếu người dùng nhập số lượng vượt `S` của trạm đã chọn:

- Hệ thống gọi `allocateSupply()` (min-cost flow lite): chia phần dư sang các trạm khác còn cần cùng món hàng.
- Ưu tiên trạm user chọn trước, phần còn lại greedily theo chi phí thấp nhất (khoảng cách + mức khẩn cấp + lượng thiếu).
- Nếu tổng tất cả trạm vẫn không đủ → thông báo phần dư không giao được, yêu cầu giảm số lượng.

## Bước 5: Trạm xác nhận nhận hàng

Trạm vào `/tram-quan-ly`, gọi `confirmReceipt()`:

- `R += số thực nhận`
- `T -= số đơn đã giao` (không âm)
- Đơn chuyển trạng thái `received`, gắn ảnh minh chứng.
- Nếu `S` xuống về 0 → thông báo "Đã đủ hàng", khóa quyên góp mặt hàng này.
- Nếu giao thiếu → `S` tự mở lại, trạm tiếp tục nhận quyên góp phần còn thiếu.

## Tóm tắt luồng

```
Chọn trạm & món → Chọn hình thức → Xác nhận đơn
      ↓                                    ↑
Tạo mã đơn, tăng T (commitOrder)   ←  Trạm xác nhận nhận (confirmReceipt)
      ↓
Nếu vượt S: chia dư sang trạm khác (allocateSupply)
      ↓
Trạm nhận hàng: R+=qty, T-=qty, đơn = received
```

> Tất cả dữ liệu là mock/demo. Reload trang reset đơn hàng và hàng hóa, nhưng đăng nhập được nhớ qua `localStorage`.
