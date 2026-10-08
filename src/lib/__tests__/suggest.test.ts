import { describe, expect, it } from 'vitest';
import type { Station, Urgency } from '../../types/models';
import {
  allocateSupply,
  alternativesForItem,
  computeCost,
  rankStationsForItem,
} from '../suggest';

function mkStation(
  id: string,
  opts: { distanceKm: number; verified?: boolean; needs: { itemId: string; D: number; R: number; T: number; urgency: Urgency; closed?: boolean }[] },
): Station {
  return {
    id,
    name: id,
    org: 'org',
    contact: 'contact',
    phone: '0900000000',
    address: 'addr',
    province: 'Tỉnh',
    provinceOld: 'Tỉnh',
    lat: 0,
    lng: 0,
    pickupHours: '8h-17h',
    verified: opts.verified ?? true,
    distanceKm: opts.distanceKm,
    needs: opts.needs.map((n) => ({ ...n })),
    servedAreas: [],
    proofs: [],
    totalDonations: 0,
    successOrders: 0,
  };
}

const stations = [
  // A: gần, rất khẩn cấp, thiếu 150
  mkStation('a', { distanceKm: 900, needs: [{ itemId: 'nuoc', D: 500, R: 320, T: 30, urgency: 'critical' }] }),
  // B: xa hơn, khẩn cấp cao, thiếu 250
  mkStation('b', { distanceKm: 1350, needs: [{ itemId: 'nuoc', D: 800, R: 500, T: 50, urgency: 'high' }] }),
  // C: đã đủ (S = 0) -> loại
  mkStation('c', { distanceKm: 950, needs: [{ itemId: 'nuoc', D: 400, R: 400, T: 0, urgency: 'low' }] }),
  // D: đóng -> loại
  mkStation('d', { distanceKm: 900, needs: [{ itemId: 'nuoc', D: 500, R: 100, T: 0, urgency: 'critical', closed: true }] }),
];

describe('rankStationsForItem / alternativesForItem (giữ hành vi cũ)', () => {
  it('loại trạm đã đủ và trạm đã đóng', () => {
    const ranked = rankStationsForItem(stations, 'nuoc');
    expect(ranked.map((s) => s.id)).toEqual(['a', 'b']);
  });
  it('alternatives loại trừ trạm hiện tại', () => {
    expect(alternativesForItem(stations, 'nuoc', 'a').map((s) => s.id)).toEqual(['b']);
  });
});

describe('computeCost: trạm khẩn cấp + gần + thiếu nhiều thì rẻ hơn', () => {
  it('-1 khi không nhận hàng (đã đủ / đóng / không có need)', () => {
    expect(computeCost(stations[2], 'nuoc')).toBe(-1);
    expect(computeCost(stations[3], 'nuoc')).toBe(-1);
    expect(computeCost(stations[0], 'mi')).toBe(-1);
  });
  it('thứ tự chi phí: a < b', () => {
    expect(computeCost(stations[0], 'nuoc')).toBeLessThan(computeCost(stations[1], 'nuoc'));
  });
});

describe('allocateSupply: chia nguồn hàng theo chi phí tăng dần', () => {
  it('vừa đủ trong 1 trạm thì rót đúng S của trạm rẻ nhất', () => {
    const plan = allocateSupply(stations, 'nuoc', 100);
    expect(plan.allocations).toEqual([{ stationId: 'a', allocQty: 100, unitCost: computeCost(stations[0], 'nuoc') }]);
    expect(plan.allocated).toBe(100);
    expect(plan.unmet).toBe(0);
    expect(plan.totalCost).toBe(100 * computeCost(stations[0], 'nuoc'));
  });
  it('vượt S trạm đầu thì tràn sang trạm tiếp theo (case tiếc của đã mua)', () => {
    const plan = allocateSupply(stations, 'nuoc', 200);
    expect(plan.allocations.map((a) => [a.stationId, a.allocQty])).toEqual([
      ['a', 150],
      ['b', 50],
    ]);
    expect(plan.allocated).toBe(200);
    expect(plan.unmet).toBe(0);
  });
  it('vượt tổng S thì phần dôi ghi vào unmet', () => {
    const plan = allocateSupply(stations, 'nuoc', 1000);
    expect(plan.allocated).toBe(400); // 150 + 250
    expect(plan.unmet).toBe(600);
  });
  it('tất cả đã đủ / qty <= 0 thì rỗng', () => {
    expect(allocateSupply([stations[2]], 'nuoc', 50).allocations).toEqual([]);
    expect(allocateSupply([stations[2]], 'nuoc', 50).unmet).toBe(50);
    expect(allocateSupply(stations, 'nuoc', 0)).toEqual({
      allocations: [],
      totalCost: 0,
      requested: 0,
      allocated: 0,
      unmet: 0,
    });
  });
  it('preferStationId: rót đầy trạm user chọn trước, phần dôi min-cost tiếp', () => {
    // b đắt hơn a nhưng user đã chọn b -> b đầy 200 trước
    const plan = allocateSupply(stations, 'nuoc', 200, 'b');
    expect(plan.allocations.map((a) => [a.stationId, a.allocQty])).toEqual([['b', 200]]);
    expect(plan.unmet).toBe(0);
    // vượt S của b (250) -> tràn 50 sang a
    const plan2 = allocateSupply(stations, 'nuoc', 300, 'b');
    expect(plan2.allocations.map((a) => [a.stationId, a.allocQty])).toEqual([
      ['b', 250],
      ['a', 50],
    ]);
    expect(plan2.unmet).toBe(0);
  });
  it('prefer trạm đã đủ / không tồn tại thì fallback greedy thuần', () => {
    const plan = allocateSupply(stations, 'nuoc', 100, 'c');
    expect(plan.allocations.map((a) => a.stationId)).toEqual(['a']);
  });
});
