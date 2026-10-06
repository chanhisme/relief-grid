# VAI TRÒ
Bạn là senior frontend developer + UI/UX designer. Hãy build DEMO GIAO DIỆN (không backend) cho web "Trạm cứu trợ số" (tên tiếng Anh: ReliefGrid), một nền tảng điều phối hàng cứu trợ thiên tai theo nhu cầu thực tế. Giao diện tiếng Việt. Đây là sản phẩm thi AISC'26 nên phải đẹp, đáng tin cậy, và demo trơn tru được các luồng chính.

# BỐI CẢNH NGẮN
Vấn đề: hàng cứu trợ bị thừa chỗ này, thiếu chỗ kia vì người quyên góp không biết trạm cần gì. Giải pháp: trạm cập nhật nhu cầu theo từng mặt hàng, người quyên góp chọn đúng thứ đang thiếu, khi đủ thì hệ thống khóa quyên góp.
Slogan: "Đừng để lòng tốt bị lãng phí".
4 nhóm người dùng: Trạm cứu trợ, Người quyên góp, Nhà phân phối, Đơn vị vận chuyển (+ Admin xác minh trạm, làm đơn giản).

# TECH STACK
React + Vite + TypeScript, Tailwind CSS, react-router, lucide-react, zustand (giữ state demo), react-leaflet + OpenStreetMap cho bản đồ (nếu lỗi thì fallback bản đồ giả bằng SVG + các pin).
KHÔNG backend, KHÔNG thanh toán thật. Toàn bộ dữ liệu là mock trong src/data/*.ts. State đổi được khi bấm (để demo luồng), reload thì reset cũng được.
Mobile-first, responsive đủ điện thoại/tablet/desktop.

# DESIGN
- Cảm giác: tin cậy, nhân văn, rõ ràng, khẩn cấp nhưng không hoảng loạn. Nhiều khoảng trắng, card bo góc, bóng nhẹ.
- Màu: xanh dương đậm (primary), cam (khẩn cấp/CTA quyên góp), xanh lá (đã đủ/đã xác minh), đỏ (rất khẩn cấp), nền sáng.
- Font hỗ trợ tiếng Việt tốt (Be Vietnam Pro hoặc Inter).
- Nhẹ cho mạng yếu: không dùng ảnh nặng, dùng icon lucide + placeholder gradient, lazy-load. Thêm công tắc "Chế độ tiết kiệm dữ liệu" trên header (bật thì ẩn ảnh, giảm hiệu ứng) và banner "Bạn đang offline, dữ liệu sẽ đồng bộ khi có mạng" (có nút demo bật/tắt).
- Số điện thoại hiển thị dạng che (090****123), chỉ hiện đầy đủ khi bấm "Hiện số" (cần đã đăng nhập).

# LOGIC NGHIỆP VỤ BẮT BUỘC (đây là điểm ăn tiền của dự án)
Mỗi mặt hàng tại một trạm có 3 con số:
- D = tổng nhu cầu trạm ghi nhận
- R = đã tiếp nhận (hàng đã đến trạm và được kiểm kê xác nhận)
- T = đang vận chuyển (đã xác nhận gửi, chưa đến trạm)
Còn thiếu S = max(0, D - R - T).
Thanh tiến độ chia 3 đoạn: R màu xanh lá đặc, T màu xanh dương sọc/nhạt, phần còn lại xám. Chú thích rõ 3 đoạn.
Trạng thái nhu cầu: "Mở" / "Một phần đã đáp ứng" / "Đã đủ" / "Đóng".
Khi S = 0: thẻ chuyển xanh, hiện "Đã đủ", nút quyên góp bị khóa (disabled) kèm tooltip "Trạm đã nhận đủ, hãy chọn nhu cầu khác" + gợi ý 2-3 trạm khác còn thiếu đúng mặt hàng này. Nếu T > 0 và R < D thì ghi "Đủ (còn X đang trên đường)". Nếu đơn bị hủy/giao thiếu thì T giảm và nhu cầu tự mở lại.
Khi người dùng nhập số lượng quyên góp lớn hơn S: chặn, báo "Trạm chỉ còn thiếu S", và đề xuất chuyển phần dư sang trạm khác đang thiếu mặt hàng đó (giải quyết tâm lý "tiếc của đã mua").
Mức khẩn cấp: Thấp / Trung bình / Cao / Rất khẩn cấp (badge màu).

# MOCK DATA
- 8-10 trạm ở các tỉnh: Lạng Sơn, Cao Bằng, Thái Nguyên, Nghệ An, Hà Tĩnh, Quảng Bình, Huế, Đà Nẵng. Mỗi trạm có: tên, đơn vị phụ trách, người liên hệ, SĐT, địa chỉ, tọa độ, giờ nhận hàng, huy hiệu "Đã xác minh" (1-2 trạm là "Chờ xác minh"), 3-6 mặt hàng với D/R/T khác nhau (có cái đã đủ, có cái thiếu nhiều).
- Mặt hàng: nước uống (thùng), mì gói (thùng), thuốc sát khuẩn, chăn màn, sữa trẻ em, đèn pin, đồ vệ sinh, tã.
- 6-8 sản phẩm của nhà phân phối (có giá VND, tồn kho, khuyến mãi).
- Một vài đơn quyên góp mẫu ở đủ trạng thái.
- Vị trí người dùng mặc định: TP. Hồ Chí Minh (dùng để tính khoảng cách giả).
- Thanh Hiện trạng ở trang chủ hiển thị: 24 trạm đang hoạt động | 156 nhu cầu cần hỗ trợ | 3.420 vật phẩm còn thiếu (hằng số demo).

# CÁC MÀN HÌNH

## A. Chung
- Header: logo, Hiện trạng, Quyên góp, Mua sắm, Thống kê tác động, Đăng nhập/Đăng ký, công tắc tiết kiệm dữ liệu.
- Đăng ký: chọn 1 trong 3 vai trò (Trạm cứu trợ / Cá nhân quyên góp / Nhà phân phối). Nếu là Trạm: form tải minh chứng pháp lý/xác nhận địa phương, trạng thái "Chờ xác minh". Có nút "Đăng nhập nhanh demo" cho từng vai trò để tiện trình diễn.

## B. Trang chủ (/)
- Hero + slogan "Đừng để lòng tốt bị lãng phí" + CTA "Quyên góp ngay".
- Thanh Hiện trạng (3 số liệu).
- Bản đồ các trạm (pin màu theo mức khẩn cấp) + bộ lọc bên cạnh: tỉnh/thành, loại hàng, mức khẩn cấp, khoảng cách. Bấm pin mở thẻ ngắn: tên trạm, địa chỉ, SĐT (che), 3-5 mặt hàng thiếu nhất, mức khẩn cấp, nút "Quyên góp cho trạm này".
- Ô tìm kiếm thông minh (từ khóa "nước", "tã", "thuốc", tên khu vực, tên trạm).
- Mục "Nhu cầu khẩn cấp hôm nay": các thẻ, mỗi thẻ có tên trạm, khu vực, mặt hàng, "còn thiếu 150/500 thùng" và thanh tiến độ.
- Khối "Cách hoạt động" 4 bước: Trạm cập nhật nhu cầu → Bạn chọn đúng món cần → Hàng được giao/kiểm kê → Trạm đăng ảnh minh chứng.
- Footer: thông tin trang web, liên hệ.

## C. Chi tiết trạm (/tram/:id) - góc nhìn người quyên góp
Huy hiệu "Đã xác minh", đơn vị phụ trách, liên hệ (che SĐT), bản đồ nhỏ; thống kê trạm (hàng đã nhận, nhu cầu đang thiếu, số khu vực đã hỗ trợ); danh sách nhu cầu từng mặt hàng (icon, D/R/T/S, mức ưu tiên, thanh tiến độ 3 đoạn, nút Quyên góp hoặc "Đã đủ"); cập nhật mới nhất (ảnh/video minh chứng, ngày giờ); khu vực đã hỗ trợ (để trạm khác tránh trùng); báo cáo minh bạch (tổng lượt quyên góp, đơn giao thành công); nút "Báo cáo sai lệch"; form liên hệ nhanh với trạm (không lộ SĐT).

## D. Luồng quyên góp (/quyen-gop) - wizard, tối đa 4 bước, ít thao tác nhất có thể
1. "Bạn muốn hỗ trợ gì?": chọn loại hàng (chip lớn có icon).
2. Danh sách trạm đang thiếu mặt hàng này, có nhãn "Gợi ý phù hợp nhất". Xếp theo điểm kết hợp khoảng cách + mức khẩn cấp + lượng còn thiếu, hiển thị khoảng cách và vì sao được gợi ý. Chọn trạm + nhập số lượng (validate theo S).
3. Chọn hình thức (3 lựa chọn):
   - Tự mang đến điểm tập kết: hiện địa chỉ, giờ nhận, liên hệ, và sinh MÃ ĐƠN + MÃ QR để trạm quét xác nhận.
   - Đặt đơn vị vận chuyển: nhập địa chỉ lấy hàng, chọn đối tác (3 đơn vị mock), xem phí/thời gian dự kiến (chỉ mang tính tham khảo).
   - Mua trực tiếp: chọn sản phẩm của nhà phân phối, giỏ hàng, thanh toán giả lập (Momo/ZaloPay/ngân hàng, bấm là thành công), giao thẳng đến trạm.
4. Xác nhận và hoàn tất: tóm tắt, thành công thì T của mặt hàng tại trạm đó tăng ngay (thanh tiến độ cập nhật, S giảm).

## E. Quyên góp của tôi (/quyen-gop-cua-toi)
Danh sách đơn, timeline trạng thái: Đã tạo/thanh toán → Đã xác nhận → Đang chuẩn bị/lấy hàng → Đang giao → Trạm đã nhận. Khi trạm đã nhận thì hiện ảnh xác nhận từ trạm. Có mã QR cho đơn tự mang.

## F. Dashboard trạm (/tram-quan-ly)
4 chỉ số đầu: tổng nhu cầu đang mở, số mặt hàng đã đủ, đơn đang vận chuyển, lượng hàng đã phân phát.
Chức năng: cập nhật hồ sơ/địa chỉ nhận hàng; tạo/sửa nhu cầu theo mặt hàng (D, mức khẩn cấp); danh sách đơn đang đến, mỗi đơn có nút "Xác nhận đã nhận" kèm ô nhập SỐ LƯỢNG THỰC NHẬN (giao thiếu thì phần thiếu quay lại S); ô quét/nhập mã QR để xác nhận đơn tự mang; cập nhật khu vực đã phân phát; đăng ảnh và bài minh chứng. Có thông báo kiểu "Nước uống đã đủ, hệ thống đã đóng nhận quyên góp", "Thuốc sát khuẩn còn thiếu 80%".
Có một nút ẩn "Demo: giả lập đơn mới đến" để trình diễn thông báo real-time (toast).

## G. Nhà phân phối (/nha-phan-phoi)
Quản lý sản phẩm (ảnh, giá, danh mục cứu trợ), tồn kho + cảnh báo sắp hết hàng, khuyến mãi/quà tặng/miễn phí ship, đơn hàng cứu trợ (xác nhận, chọn đơn vị vận chuyển, trạng thái, hoàn trả), chat với khách, doanh thu ngày/tháng/năm (biểu đồ đơn giản), sản phẩm bán chạy, nút "Rút tiền".

## H. Đơn vị vận chuyển (/van-chuyen) - đơn giản, ưu tiên làm cuối
Danh sách yêu cầu giao nhận: địa chỉ lấy/giao, loại hàng, trọng lượng, ưu tiên, nút "Đã lấy hàng" / "Đã giao hàng". Ghi chú nhỏ: "Thực tế kết nối qua API với hệ thống của đơn vị vận chuyển".

## I. Thống kê tác động (/thong-ke) và Admin xác minh trạm (/admin/xac-minh)
Thống kê: tổng vật phẩm đã điều phối, số trạm được hỗ trợ, số khu vực đã tiếp cận, tỷ lệ nhu cầu được đáp ứng (số + biểu đồ đơn giản).
Admin: danh sách trạm chờ duyệt, xem giấy tờ, nút Duyệt/Từ chối.

# CÁCH LÀM VIỆC (QUAN TRỌNG)
Làm theo 3 phase, xong mỗi phase thì DỪNG, tóm tắt 3-5 dòng và chờ tôi xác nhận rồi mới sang phase sau:
- Phase 1 (làm kỹ nhất): layout chung, mock data, store, Trang chủ (B), Chi tiết trạm (C), Luồng quyên góp (D), Quyên góp của tôi (E). Logic D/R/T/S và khóa khi đủ phải chạy đúng.
- Phase 2: Dashboard trạm (F) và Đăng ký/đăng nhập demo, sao cho xác nhận nhận hàng ở F làm thay đổi dữ liệu thấy được ở C.
- Phase 3: Nhà phân phối (G), Vận chuyển (H), Thống kê + Admin (I).
Không hỏi lại những chi tiết nhỏ, tự đưa ra giả định hợp lý và ghi chú ngắn ở cuối. Code gọn, tách component (StationCard, NeedItem, ProgressBar3, DonationWizard, OrderTimeline...), dễ đọc để nhóm chỉnh sửa. Không lỗi TypeScript/console khi chạy.