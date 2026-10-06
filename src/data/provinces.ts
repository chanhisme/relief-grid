/**
 * Map tên tỉnh cũ (63) <-> mới (34) theo NQ 202/2025/QH15.
 * `province` trong Station = tên MỚI (chuẩn), `provinceOld` = tên trước sáp nhập.
 */

/** Tên tỉnh mới của 8 tỉnh/thành có trạm demo */
export const PROVINCES_NEW = [
  'Lạng Sơn', 'Cao Bằng', 'Thái Nguyên', 'Nghệ An',
  'Hà Tĩnh', 'Quảng Trị', 'Huế', 'Đà Nẵng',
];

/** Tên cũ -> tên feature trong file 63 tỉnh */
export const OLD_FEATURE_NAME: Record<string, string> = {
  'Lạng Sơn': 'Lang Son',
  'Cao Bằng': 'Cao Bang',
  'Thái Nguyên': 'Thai Nguyen',
  'Nghệ An': 'Nghe An',
  'Hà Tĩnh': 'Ha Tinh',
  'Quảng Bình': 'Quang Binh',
  'Huế': 'Thua Thien - Hue',
  'Đà Nẵng': 'Da Nang city',
};

/** Tên mới -> tên feature trong file 34 tỉnh */
export const NEW_FEATURE_NAME: Record<string, string> = {
  'Lạng Sơn': 'Lạng Sơn',
  'Cao Bằng': 'Cao Bằng',
  'Thái Nguyên': 'Thái Nguyên',
  'Nghệ An': 'Nghệ An',
  'Hà Tĩnh': 'Hà Tĩnh',
  'Quảng Trị': 'Quảng Trị',
  'Huế': 'Huế',
  'Đà Nẵng': 'Đà Nẵng',
};

/** Tên cũ của trạm (key = tên mới). Chỉ liệt kê nơi khác nhau. */
export const OLD_NAME_OF: Record<string, string> = {
  'Quảng Trị': 'Quảng Bình',
};

/** Tên 63 tỉnh/thành cũ có dấu (file số liệu dùng tên ASCII) — tôn trọng tiếng Việt */
export const VI_OLD_NAME: Record<string, string> = {
  'An Giang': 'An Giang',
  'Ba Ria - Vung Tau': 'Bà Rịa – Vũng Tàu',
  'Bac Giang': 'Bắc Giang',
  'Bac Kan': 'Bắc Kạn',
  'Bac Lieu': 'Bạc Liêu',
  'Bac Ninh': 'Bắc Ninh',
  'Ben Tre': 'Bến Tre',
  'Binh Dinh': 'Bình Định',
  'Binh Duong': 'Bình Dương',
  'Binh Phuoc': 'Bình Phước',
  'Binh Thuan': 'Bình Thuận',
  'Ca Mau': 'Cà Mau',
  'Can Tho city': 'Cần Thơ',
  'Cao Bang': 'Cao Bằng',
  'Da Nang city': 'Đà Nẵng',
  'Dak Lak': 'Đắk Lắk',
  'Dak Nong': 'Đắk Nông',
  'Dien Bien': 'Điện Biên',
  'Dong Nai': 'Đồng Nai',
  'Dong Thap': 'Đồng Tháp',
  'Gia Lai': 'Gia Lai',
  'Ha Giang': 'Hà Giang',
  'Ha Nam': 'Hà Nam',
  'Ha Noi city': 'Hà Nội',
  'Ha Tinh': 'Hà Tĩnh',
  'Hai Duong': 'Hải Dương',
  'Hai Phong city': 'Hải Phòng',
  'Hau Giang': 'Hậu Giang',
  'Ho Chi Minh city': 'TP. Hồ Chí Minh',
  'Hoa Binh': 'Hòa Bình',
  'Hung Yen': 'Hưng Yên',
  'Khanh Hoa': 'Khánh Hòa',
  'Kien Giang': 'Kiên Giang',
  'Kon Tum': 'Kon Tum',
  'Lai Chau': 'Lai Châu',
  'Lam Dong': 'Lâm Đồng',
  'Lang Son': 'Lạng Sơn',
  'Lao Cai': 'Lào Cai',
  'Long An': 'Long An',
  'Nam Dinh': 'Nam Định',
  'Nghe An': 'Nghệ An',
  'Ninh Binh': 'Ninh Bình',
  'Ninh Thuan': 'Ninh Thuận',
  'Phu Tho': 'Phú Thọ',
  'Phu Yen': 'Phú Yên',
  'Quang Binh': 'Quảng Bình',
  'Quang Nam': 'Quảng Nam',
  'Quang Ngai': 'Quảng Ngãi',
  'Quang Ninh': 'Quảng Ninh',
  'Quang Tri': 'Quảng Trị',
  'Soc Trang': 'Sóc Trăng',
  'Son La': 'Sơn La',
  'Tay Ninh': 'Tây Ninh',
  'Thai Binh': 'Thái Bình',
  'Thai Nguyen': 'Thái Nguyên',
  'Thanh Hoa': 'Thanh Hóa',
  'Thua Thien - Hue': 'Thừa Thiên – Huế',
  'Tien Giang': 'Tiền Giang',
  'Tra Vinh': 'Trà Vinh',
  'Tuyen Quang': 'Tuyên Quang',
  'Vinh Long': 'Vĩnh Long',
  'Vinh Phuc': 'Vĩnh Phúc',
  'Yen Bai': 'Yên Bái',
};
