import type { Carrier, Product, DonationOrder } from '../types/models';

export const PRODUCTS: Product[] = [
  { id: 'p1', name: 'Nước uống Aquafina 500ml (24 chai)', itemId: 'nuoc', price: 95000, stock: 500, promo: 'Mua 10 tặng 1', freeShip: true },
  { id: 'p2', name: 'Mì Hảo Hảo thùng 30 gói', itemId: 'mi', price: 115000, stock: 800, promo: 'Giảm 10% đơn cứu trợ' },
  { id: 'p3', name: 'Thuốc sát khuẩn Anolyte 500ml', itemId: 'thuoc', price: 45000, stock: 12, promo: 'Sắp hết hàng' },
  { id: 'p4', name: 'Chăn nỉ ấm cao cấp', itemId: 'chan', price: 120000, stock: 300, freeShip: true },
  { id: 'p5', name: 'Sữa bột Dielac Alpha 900g', itemId: 'sua', price: 285000, stock: 150 },
  { id: 'p6', name: 'Đèn pin siêu sáng + pin', itemId: 'denpin', price: 89000, stock: 400, promo: 'Tặng pin dự phòng' },
  { id: 'p7', name: 'Combo đồ vệ sinh gia đình', itemId: 'vesinh', price: 65000, stock: 600 },
  { id: 'p8', name: 'Tã Bobby size M (64 miếng)', itemId: 'ta', price: 175000, stock: 250, freeShip: true },
];

export const CARRIERS: Carrier[] = [
  { id: 'c1', name: 'Nhanh Express', fee: 35000, eta: '1-2 ngày' },
  { id: 'c2', name: 'Cứu trợ Logistics', fee: 0, eta: '2-3 ngày (miễn phí tuyến bão)' },
  { id: 'c3', name: 'Tốc hành Miền Trung', fee: 50000, eta: 'Trong ngày (nội vùng)' },
];

export const SAMPLE_ORDERS: DonationOrder[] = [
  { id: 'o1', code: 'RG-1001', stationId: 'hue-1', itemId: 'nuoc', qty: 50, method: 'self', status: 'received', createdAt: '2026-09-28', proofImg: 'Ảnh xác nhận kho Huế' },
  { id: 'o2', code: 'RG-1002', stationId: 'nghean-1', itemId: 'mi', qty: 100, method: 'carrier', status: 'shipping', carrierId: 'c1', createdAt: '2026-10-02' },
  { id: 'o3', code: 'RG-1003', stationId: 'quangbinh-1', itemId: 'thuoc', qty: 30, method: 'buy', status: 'confirmed', productId: 'p3', createdAt: '2026-10-04' },
  { id: 'o4', code: 'RG-1004', stationId: 'danang-1', itemId: 'chan', qty: 20, method: 'self', status: 'created', createdAt: '2026-10-05' },
];

export const HERO_STATS = {
  stations: 24,
  needs: 156,
  missing: 3420,
};

export const USER_LOCATION = 'TP. Hồ Chí Minh';
