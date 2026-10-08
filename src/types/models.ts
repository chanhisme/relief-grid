export type Urgency = 'low' | 'medium' | 'high' | 'critical';
export type NeedStatus = 'open' | 'partial' | 'fulfilled' | 'closed';
export type OrderStatus =
  | 'created'
  | 'confirmed'
  | 'preparing'
  | 'shipping'
  | 'received'
  | 'rejected';
export type DonateMethod = 'self' | 'carrier' | 'buy';
export type Role = 'station' | 'donor' | 'distributor' | 'admin' | null;

export interface ItemDef {
  id: string;
  name: string;
  unit: string;
  icon: string; // lucide icon key used by ItemIcon
  category: string;
}

export interface StationNeed {
  itemId: string;
  /** D: tổng nhu cầu */
  D: number;
  /** R: đã tiếp nhận */
  R: number;
  /** T: đang vận chuyển */
  T: number;
  urgency: Urgency;
  closed?: boolean; // trạm chủ động đóng
}

export interface Proof {
  id: string;
  title: string;
  date: string;
  imageLabel: string;
}

export interface Station {
  id: string;
  name: string;
  org: string;
  contact: string;
  phone: string;
  address: string;
  /** Tên MỚI sau sáp nhập 2025 (chuẩn tra cứu) */
  province: string;
  /** Tên CŨ trước sáp nhập (để hiển thị song song + toggle bản đồ) */
  provinceOld: string;
  lat: number;
  lng: number;
  pickupHours: string;
  verified: boolean;
  distanceKm: number; // khoảng cách giả từ TP.HCM
  needs: StationNeed[];
  servedAreas: string[];
  proofs: Proof[];
  totalDonations: number;
  successOrders: number;
}

export interface Product {
  id: string;
  name: string;
  itemId: string;
  price: number;
  stock: number;
  promo?: string;
  freeShip?: boolean;
  /** Ảnh SP demo (URL dán tay, không upload thật) */
  imageUrl?: string;
  /** Mẫu mã demo (VD: "thùng 30 gói") */
  variant?: string;
}

export interface Carrier {
  id: string;
  name: string;
  fee: number;
  eta: string;
}

export interface DonationOrder {
  id: string;
  code: string;
  stationId: string;
  itemId: string;
  qty: number;
  method: DonateMethod;
  status: OrderStatus;
  carrierId?: string;
  productId?: string;
  createdAt: string;
  proofImg?: string;
  /** Mã vận đơn demo (đơn carrier/buy): TRK-<mã đơn>. Thực tế do ĐVVC cấp qua API. */
  trackingCode?: string;
  /** Tên người đặt (prefill từ tài khoản demo) — dùng cho lịch sử KH phía NPP */
  buyerName?: string;
  /** Cổng thanh toán giả lập (đơn mua trực tiếp) */
  payMethod?: PayMethod;
}

export type PayMethod = 'momo' | 'zalopay' | 'bank';

export interface Toast {
  id: number;
  msg: string;
  kind: 'success' | 'info' | 'warn';
}

/** Tin nhắn donor ↔ NPP (demo cùng máy, thấy nhau 2 phía) */
export interface ChatMessage {
  id: string;
  /** Vai trò người gửi: donor | station | distributor | admin | guest */
  fromRole: string;
  fromName: string;
  text: string;
  at: string; // HH:MM
}

/** Đơn xin cấp tài khoản Trạm/NPP chờ admin duyệt (demo thay DB) */
export interface AccountApproval {
  id: string;
  name: string;
  role: 'station' | 'distributor';
  proof: string;
  date: string;
  /** SĐT đăng ký (để admin đối chiếu chống trạm "ma") */
  phone?: string;
}

export interface WizardDraft {
  itemId?: string;
  stationId?: string;
  qty?: number;
  method?: DonateMethod;
  carrierId?: string;
  productId?: string;
  pickupAddress?: string;
  /** Cổng thanh toán giả lập đã chọn ở bước mua trực tiếp */
  payMethod?: PayMethod;
}

export interface Filters {
  province: string; // 'all' | tên tỉnh
  itemId: string; // 'all' | itemId
  urgency: string; // 'all' | Urgency
  maxKm: number;
  keyword: string;
}

/** Đơn tạo khi offline, chờ đồng bộ (chưa có mã, chưa tăng T) */
export type PendingOrder = Omit<DonationOrder, 'id' | 'code' | 'createdAt' | 'status' | 'trackingCode'> & {
  status?: DonationOrder['status'];
};
