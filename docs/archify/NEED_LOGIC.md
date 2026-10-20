# 📊 Logic cần/hàng thiếu (D/R/T/S)

Đây là logic nghiệp vụ cốt lõi nhất của ReliefGrid, nằm trong `src/lib/needLogic.ts`.

## Công thức chính

Mỗi mặt hàng tại mỗi trạm có 3 con số:

| Ký hiệu | Ý nghĩa |
|---------|---------|
| **D** | Tổng nhu cầu (demand) |
| **R** | Đã tiếp nhận (received) |
| **T** | Đang vận chuyển (transit / on the way) |

**Còn thiếu:**
```
S = max(0, D − R − T)
```

- Nếu **S = 0** → trạm đã đủ hàng → **khóa quyên góp** mặt hàng này (thẻ xanh + tooltip + gợi ý trạm khác).
- Nếu **S > 0** → trạm còn cần hàng → mở quyên góp.

## Trạng thái nhu cầu (`NeedStatus`)

| Trạng thái | Điều kiện | Ý nghĩa |
|------------|-----------|---------|
| `open` | R = 0, T = 0, S > 0 | Chưa có lượt nhận nào |
| `partial` | R > 0 hoặc T > 0, S > 0 | Một phần đã đáp ứng |
| `fulfilled` | S = 0 | Đã đủ hàng |
| `closed` | `closed === true` | Trạm chủ động đóng nhận |

## Thanh tiến độ 3 đoạn (`progressSegments`)

Hiển thị trên giao diện, tổng luôn = 100%:

| Đoạn | Màu | Ý nghĩa |
|------|-----|---------|
| R | Xanh | Đã nhận / D |
| T | Vàng | Đang giao / D |
| rest | Xám | Còn thiếu / D |

Ví dụ: D=500, R=320, T=30 → R=64%, T=6%, rest=30%.

## Giới hạn quyên góp khi nhập số lượng

Người dùng nhập số lượng quyên góp:

- Nếu `qty > S` → vượt số còn thiếu.
- Hệ thống chặn đơn quá S, hoặc chia phần dư sang các trạm khác còn cần cùng món hàng (`allocateSupply` trong `src/lib/suggest.ts`).
- Nếu nhập vượt S và tổng tất cả trạm vẫn không đủ → thông báo phần dư không giao được.

## Ví dụ thực tế từ dữ liệu demo

Trạm **Nghệ An — Con Cuông** (`nghean-1`):

| Mặt hàng | D | R | T | S = D−R−T | Trạng thái |
|----------|---|---|---|-----------|------------|
| Nước uống | 800 | 500 | 150 | **150** | partial (critical) |
| Mì gói | 700 | 300 | 100 | **300** | partial (high) |
| Thuốc sát khuẩn | 200 | 40 | 10 | **150** | partial (critical) |
| Tã | 150 | 150 | 0 | **0** | fulfilled (low) |
| Đồ vệ sinh | 300 | 80 | 20 | **200** | partial (medium) |

Nhìn qua bảng này người quyên góp biết ngay nên chọn món nào (nước, thuốc còn thiếu nhiều và khẩn cấp).

## File liên quan

- `src/lib/needLogic.ts`: `calcS`, `getNeedStatus`, `isLocked`, `progressSegments`, `onTheWayLabel`
- `src/types/models.ts`: `StationNeed`, `Urgency`, `NeedStatus`
- `src/components/station/StationCard.tsx`: hiển thị "Còn x {S} {unit} • Tiến độ {R+T}/{D}"
- `src/components/ui/ProgressBar3.tsx`: vẽ thanh 3 đoạn

> Mục tiêu: đọc xong bạn hiểu tại sao một số trạm bị khóa quyên góp, tại sao một số còn mở, và cách tính số còn thiếu S.
