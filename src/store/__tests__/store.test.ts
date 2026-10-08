import { describe, expect, it } from 'vitest';
import { useAppStore } from '../useAppStore';

describe('createOrder (Phase 3: tracking + buyer + tồn kho)', () => {
  it('đơn carrier/buy có mã vận đơn + tên người gửi', () => {
    const o = useAppStore.getState().createOrder({
      stationId: 'nghean-1', itemId: 'mi', qty: 5, method: 'carrier', carrierId: 'c1',
    });
    expect(o.trackingCode).toBe(`TRK-${o.code}`);
    expect(o.buyerName).toBeTruthy();
  });
  it('đơn tự mang không có mã vận đơn', () => {
    const o = useAppStore.getState().createOrder({
      stationId: 'nghean-1', itemId: 'mi', qty: 1, method: 'self',
    });
    expect(o.trackingCode).toBeUndefined();
  });
  it('đơn mua trừ tồn kho NPP (kẹp >= 0)', () => {
    const before = useAppStore.getState().products.find((p) => p.id === 'p2')!.stock;
    useAppStore.getState().createOrder({
      stationId: 'nghean-1', itemId: 'mi', qty: 10, method: 'buy', productId: 'p2',
    });
    const after = useAppStore.getState().products.find((p) => p.id === 'p2')!.stock;
    expect(after).toBe(Math.max(0, before - 10));
  });
  it('NPP sửa được ảnh + mẫu mã sản phẩm', () => {
    useAppStore.getState().updateProduct('p1', { imageUrl: 'https://demo/nuoc.jpg', variant: 'thùng 24 chai' });
    const p = useAppStore.getState().products.find((x) => x.id === 'p1')!;
    expect(p.imageUrl).toBe('https://demo/nuoc.jpg');
    expect(p.variant).toBe('thùng 24 chai');
  });
  it('chat 2 chiều: tin nhắn vào store chung', () => {
    const before = useAppStore.getState().messages.length;
    useAppStore.getState().sendMessage('Hỏi NPP về giao hàng');
    const after = useAppStore.getState().messages;
    expect(after.length).toBe(before + 1);
    expect(after[after.length - 1].text).toBe('Hỏi NPP về giao hàng');
  });
  it('offline queue: xếp hàng chờ, đồng bộ mới tăng T', () => {
    const tOf = () =>
      useAppStore.getState().stations.find((s) => s.id === 'nghean-1')!.needs.find((n) => n.itemId === 'mi')!.T;
    const tBefore = tOf();
    const pendBefore = useAppStore.getState().pendingSync.length;
    useAppStore.getState().queueOfflineOrder({ stationId: 'nghean-1', itemId: 'mi', qty: 3, method: 'self' });
    expect(useAppStore.getState().pendingSync.length).toBe(pendBefore + 1);
    expect(tOf()).toBe(tBefore); // chưa tăng T khi còn trong hàng chờ
    useAppStore.getState().syncPending();
    expect(useAppStore.getState().pendingSync.length).toBe(0);
    expect(tOf()).toBe(tBefore + 3); // đồng bộ xong T tăng
  });
  it('đăng ký lưu SĐT vào hồ sơ chờ duyệt (chống trạm ma)', () => {
    useAppStore.getState().registerDemo('station', 'Trạm Test Phone', 'CV-01', '0901112223');
    const a = useAppStore.getState().approvals.find((x) => x.name === 'Trạm Test Phone');
    expect(a?.phone).toBe('0901112223');
    if (a) useAppStore.getState().rejectAccount(a.id, 'test cleanup');
    expect(useAppStore.getState().approvals.some((x) => x.name === 'Trạm Test Phone')).toBe(false);
  });
});
