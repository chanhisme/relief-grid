/**
 * Cổng admin nội bộ (demo-grade, KHÔNG phải bảo mật thật).
 * - Dev cấp link riêng: /dang-nhap?dev=<MÃ>. Đúng mã -> login admin.
 * - Chỉ lưu HASH (djb2) của mã, mã gốc dev tự giữ ngoài repo.
 * - Đổi/thu hồi mã: thay số DEV_ADMIN_HASH bên dưới + deploy lại (link cũ chết ngay).
 *   Ai đọc kỹ bundle vẫn moi được -> chống bypass thật phải có DB + backend.
 */
export const DEV_ADMIN_HASH = 0x925948ab; // djb2("RG-ADMIN-2026") — mã mẫu, đổi khi dùng thật

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (h * 33 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function checkDevCode(input: string): boolean {
  if (!input) return false;
  return djb2(input.trim()) === DEV_ADMIN_HASH;
}
