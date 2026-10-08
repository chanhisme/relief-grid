import { describe, expect, it } from 'vitest';
import type { StationNeed } from '../../types/models';
import { calcS, getNeedStatus, isLocked, onTheWayLabel, progressSegments } from '../needLogic';

describe('calcS: S = max(0, D - R - T)', () => {
  it('trừ cả R và T', () => {
    expect(calcS({ D: 500, R: 320, T: 30 })).toBe(150);
  });
  it('kẹp về 0 khi đã đủ / thừa', () => {
    expect(calcS({ D: 400, R: 400, T: 0 })).toBe(0);
    expect(calcS({ D: 100, R: 90, T: 50 })).toBe(0);
  });
});

describe('getNeedStatus / isLocked', () => {
  it('open khi chưa có R/T', () => {
    expect(getNeedStatus({ itemId: 'nuoc', D: 100, R: 0, T: 0, urgency: 'high' })).toBe('open');
  });
  it('partial khi đã có R hoặc T nhưng S > 0', () => {
    expect(getNeedStatus({ itemId: 'nuoc', D: 100, R: 30, T: 0, urgency: 'high' })).toBe('partial');
    expect(getNeedStatus({ itemId: 'nuoc', D: 100, R: 0, T: 10, urgency: 'high' })).toBe('partial');
  });
  it('fulfilled khi S = 0 và khóa quyên góp', () => {
    const need: StationNeed = { itemId: 'nuoc', D: 100, R: 100, T: 0, urgency: 'high' };
    expect(getNeedStatus({ ...need })).toBe('fulfilled');
    expect(isLocked({ ...need })).toBe(true);
  });
  it('closed luôn khóa kể cả khi còn thiếu', () => {
    const need: StationNeed = { itemId: 'nuoc', D: 100, R: 10, T: 0, urgency: 'high', closed: true };
    expect(getNeedStatus(need)).toBe('closed');
    expect(isLocked(need)).toBe(true);
  });
  it('chưa đủ thì không khóa', () => {
    expect(isLocked({ itemId: 'nuoc', D: 100, R: 10, T: 5, urgency: 'high' })).toBe(false);
  });
});

describe('progressSegments: tổng luôn 100', () => {
  it('chia R / T / còn lại', () => {
    const seg = progressSegments({ itemId: 'nuoc', D: 500, R: 320, T: 30, urgency: 'high' });
    expect(seg.r + seg.t + seg.rest).toBeCloseTo(100);
    expect(seg.r).toBeCloseTo(64);
    expect(seg.t).toBeCloseTo(6);
  });
  it('D <= 0 thì rest 100', () => {
    expect(progressSegments({ itemId: 'nuoc', D: 0, R: 0, T: 0, urgency: 'low' })).toEqual({ r: 0, t: 0, rest: 100 });
  });
});

describe('onTheWayLabel', () => {
  it('báo "còn X đang trên đường" khi S = 0 nhưng T > 0', () => {
    expect(onTheWayLabel({ itemId: 'nuoc', D: 450, R: 300, T: 150, urgency: 'medium' })).toBe(
      'Đủ (còn 150 đang trên đường)',
    );
  });
  it('null khi còn thiếu hoặc không có hàng trên đường', () => {
    expect(onTheWayLabel({ itemId: 'nuoc', D: 500, R: 320, T: 30, urgency: 'high' })).toBeNull();
    expect(onTheWayLabel({ itemId: 'nuoc', D: 100, R: 100, T: 0, urgency: 'high' })).toBeNull();
  });
});
