export function maskPhone(phone: string): string {
  // 0901234567 -> 090****567
  if (phone.length < 7) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-3);
}

export function formatVND(n: number): string {
  return n.toLocaleString('vi-VN') + 'đ';
}

export function urgencyLabel(u: string): string {
  switch (u) {
    case 'low':
      return 'Thấp';
    case 'medium':
      return 'Trung bình';
    case 'high':
      return 'Cao';
    case 'critical':
      return 'Rất khẩn cấp';
    default:
      return u;
  }
}

export function statusLabel(s: string): string {
  switch (s) {
    case 'open':
      return 'Mở';
    case 'partial':
      return 'Một phần đã đáp ứng';
    case 'fulfilled':
      return 'Đã đủ';
    case 'closed':
      return 'Đóng';
    default:
      return s;
  }
}

export function orderStatusLabel(s: string): string {
  switch (s) {
    case 'created':
      return 'Đã tạo / thanh toán';
    case 'confirmed':
      return 'Đã xác nhận';
    case 'preparing':
      return 'Đang chuẩn bị / lấy hàng';
    case 'shipping':
      return 'Đang giao';
    case 'received':
      return 'Trạm đã nhận';
    case 'rejected':
      return 'Đã từ chối';
    default:
      return s;
  }
}
