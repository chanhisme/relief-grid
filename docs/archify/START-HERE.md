# 👋 Chào mừng bạn đến với ReliefGrid

ReliefGrid là ứng dụng web demo điều phối hàng cứu trợ thiên tại (không backend). Tài liệu dưới đây viết dành cho **người mới đọc lần đầu codebase**, đọc xong là hiểu toàn cảnh hệ thống.

## Đọc theo thứ tự này

| Thứ tự | File | Nội dung |
|--------|------|----------|
| 1 | [`ARCHITECTURE.md`](ARCHITECTURE.md) | Tổng quan hệ thống: stack, 10 trang, state center, bản đồ VN |
| 2 | [`STRUCTURE.md`](STRUCTURE.md) | Cây thư mục `src/`, mỗi file làm gì |
| 3 | [`DONATION_FLOW.md`](DONATION_FLOW.md) | Luồng quyên góp: chọn trạm → hình thức → tạo đơn → chia dư → xác nhận nhận |
| 4 | [`NEED_LOGIC.md`](NEED_LOGIC.md) | Công thức cốt lõi S = D − R − T, trạng thái cần, thanh tiến độ |
| 5 | [`ORDER_LIFECYCLE.md`](ORDER_LIFECYCLE.md) | Chuỗi trạng thái đơn hàng: created → confirmed → … → received / rejected |
| 6 | [`RBAC.md`](RBAC.md) | Phân quyền: donor, station, distributor, admin và luồng duyệt tài khoản |

## Nếu bạn muốn chạy dự án

```bash
npm install
npm run dev     # chạy local tại http://localhost:5173
npm run build   # build production (bắt buộc pass TypeScript)
npm test        # chạy unit test logic D/R/T/S + store
```

## Điểm quan trọng cần nhớ

- **Không có backend.** Dữ liệu mock trong `src/data/`, reload trang reset hàng hóa.
- **Phân quyền demo** chỉ check ở frontend, không an toàn cho production.
- Mã admin nội bộ vào qua URL bí mật `/dang-nhap?dev=<MÃ>`, không có trang đăng ký admin công khai.
- Mọi thay đổi code bắt buộc phải chạy `npm run build` và không để lỗi TypeScript (xem `AGENT.md`).

> Nếu bạn chỉ muốn hiểu hệ thống thì đọc xong 6 file trên là đủ. Nếu muốn sửa code, đọc thêm `AGENT.md` và `README.md` ở gốc repository trước.
