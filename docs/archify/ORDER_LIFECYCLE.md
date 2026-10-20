# 📦 Trạng thái đơn hàng (Order Lifecycle)

Mọi đơn quyên góp trong ReliefGrid đều trải qua chuỗi trạng thái sau, định nghĩa trong `src/types/models.ts`:

```ts
type OrderStatus =
  | 'created'
  | 'confirmed'
  | 'preparing'
  | 'shipping'
  | 'received'
  | 'rejected';
```

## Sơ đồ chuyển trạng thái

```
created ──▶ confirmed ──▶ preparing ──▶ shipping ──▶ received (terminal)
                                             │
                                             ▼
                                        rejected (terminal, từ chối)
```

### Ý nghĩa từng trạng thái

| Trạng thái | Nhãn hiển thị | Ý nghĩa |
|------------|---------------|---------|
| `created` | Đã tạo / thanh toán | Đơn vừa được tạo, chưa xử lý |
| `confirmed` | Đã xác nhận | Đơn đã được xác nhận |
| `preparing` | Đang chuẩn bị / lấy hàng | Nhà phân phối đang chuẩn bị hàng |
| `shipping` | Đang giao | Đang trên đường giao đến trạm |
| `received` | Trạm đã nhận | Trạm xác nhận đã nhận hàng (terminal) |
| `rejected` | Đã từ chối | Đơn bị từ chối, biến mất khỏi list việc (terminal) |

## Các thao tác thay đổi trạng thái

| Thao tác | Từ → Thành | File xử lý |
|----------|------------|------------|
| Tạo đơn | — → `created` | `createOrder()` / `commitOrder()` |
| Advance order | `created` → `confirmed` → `preparing` → `shipping` → `received` | `advanceOrder()` |
| Từ chối đơn | bất kỳ → `rejected` (trừ `received`, `rejected`) | `rejectOrder()` |
| Xác nhận nhận hàng | `shipping` → `received` | `confirmReceipt()` |
| Hoàn trả đơn | bất kỳ → `created` (trừ `received`, `rejected`) | `returnOrder()` |
| Gán đơn vị vận chuyển | giữ nguyên trạng thái, thêm `carrierId` | `setOrderCarrier()` |

## Lưu ý khi nhận hàng (`confirmReceipt`)

- `R` (đã nhận) tăng theo số thực nhận.
- `T` (đang vận chuyển) giảm theo số đơn giao, kẹp không âm.
- Nếu `S = max(0, D − R − T)` xuống về 0 và trước đó > 0 → thông báo "Đã đủ hàng", khóa quyên góp mặt hàng này.
- Nếu giao thiếu số lượng đơn → `S` tự mở lại, trạm tiếp tục nhận quyên góp phần còn thiếu.

## Mã đơn

Mã có dạng `RG-1005`, `RG-1006`, …, sinh duy nhất, counter lưu trong `localStorage` (`reliefgrid-orderseq`) để không trùng mã sau reload.

Nếu đơn tạo khi offline: mã là `CHỜ-ONLINE`, chưa có mã thực, vào hàng chờ `pendingSync` cho đến khi nhấn "Đồng bộ ngay".
