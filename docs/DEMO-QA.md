# Demo script + QA chốt thi (Phase 7)

## 1. Script demo 5 phút (donor → trạm → NPP → carrier → admin)

1. **Home `/`**: Hero + Thanh Hiện trạng (24/156/3420). Bật map, lọc tỉnh + mặt hàng `nước`, bấm pin → dialog cứu trợ → `Quyên góp cho trạm này`.
2. **Wizard `/quyen-gop?item=nuoc&station=...`**:
   - B2 nhập vượt S → hiện phương án `allocateSupply` chia nhiều trạm, bấm `Tiếp tục với N đơn`.
   - B3 chọn `Mua trực tiếp` → chọn SP còn tồn, radio Momo/ZaloPay/Bank, chat NPP 1 câu.
   - B4 xác nhận → T tăng ngay, S giảm, liệt kê từng mã `RG-xxxx` + QR nếu đơn lẻ tự mang.
3. **Trạm `/tram-quan-ly`**: bấm `Demo: giả lập đơn mới đến` → toast realtime. Vào đơn shipping → `Xác nhận đã nhận` nhập thiếu 1 phần → toast `Giao thiếu … quay lại S`.
4. **NPP `/nha-phan-phoi`**: check tồn vừa trừ, sửa giá/tồn, xem tab Khách hàng group theo `buyerName`, tab Doanh thu Ngày/Tuần/Tháng nhảy theo đơn vừa tạo, mở modal Rút tiền.
5. **Carrier `/van-chuyen`**: đơn mới có `TRK-RG-xxxx`, bấm `Đã lấy/Đã giao`. Check `MyDonations` hiện tracking + timeline.
6. **Admin `/dang-nhap?dev=<MÃ_NỘI_BỘ>`** → tab Duyệt tài khoản: checklist 4 ô + lý do từ chối, Duyệt NPP pending → NPP đăng nhập lại thành verified. Tab trạm: Duyệt trạm `verified:false`.

## 2. Checklist tay trước thi

- [ ] `npm run test` 28 pass, `npm run build` pass, không lỗi TS/console.
- [ ] S=0 khóa quyên góp: thẻ xanh + tooltip + 2-3 trạm khác (`alternativesForItem`).
- [ ] Mask SĐT `090****567`, chỉ hiện khi login + bấm Hiện số.
- [ ] Offline: tạo 2 đơn → reload còn `pendingSync` → Online → Đồng bộ → T tăng.
- [ ] DataSaver bật: ẩn `.ds-media`, tắt shadow/animation. Banner offline hiện số đơn chờ.
- [ ] Responsive: 360px / 768px / 1280px, menu mobile, map pinch + fullmap modal.
- [ ] Trình duyệt: Chrome, Edge, Cốc Cốc, Safari (check font Be Vietnam Pro, QR, toast).
- [ ] Bundle: vendor ~206KB, mapdata ~185KB lazy, pages 4-18KB. Initial ~240KB thay vì 546KB.

## 3. Q&A dự phòng (tab2 §9)

- Trạm ma: đăng ký lưu SĐT + giấy tờ, admin checklist, trạm chưa duyệt banner vàng.
- Realtime 3 MTQ: T tăng ngay khi tạo đơn (clamp S), đơn sau thấy S mới, vượt S bị chặn + chia đơn.
- Mạng yếu: nhẹ (lazy route, ảnh lazy, không ảnh nặng), offline queue + data saver.
- Traffic spike: frontend tĩnh, chưa load-test thật (honesty README). Đã code-split.
- Bảo mật: mask SĐT, RBAC demo frontend, hash admin djb2 — cần backend mới thật.
- Sau lũ: dùng cho mái ấm/bếp ăn/hộ nghèo — cùng model D/R/T/S.
