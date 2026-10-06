import type { NeedStatus, StationNeed } from '../types/models';

/** Còn thiếu: S = max(0, D - R - T) */
export function calcS(n: Pick<StationNeed, 'D' | 'R' | 'T'>): number {
  return Math.max(0, n.D - n.R - n.T);
}

export function getNeedStatus(n: StationNeed): NeedStatus {
  if (n.closed) return 'closed';
  const s = calcS(n);
  if (s === 0) return 'fulfilled';
  if (n.R > 0 || n.T > 0) return 'partial';
  return 'open';
}

export function isLocked(n: StationNeed): boolean {
  return n.closed === true || calcS(n) === 0;
}

/** % cho thanh 3 đoạn, tổng = 100 */
export function progressSegments(n: StationNeed): { r: number; t: number; rest: number } {
  if (n.D <= 0) return { r: 0, t: 0, rest: 100 };
  const r = Math.min(100, (n.R / n.D) * 100);
  const t = Math.min(100 - r, (n.T / n.D) * 100);
  const rest = Math.max(0, 100 - r - t);
  return { r, t, rest };
}

export function onTheWayLabel(n: StationNeed): string | null {
  const s = calcS(n);
  if (s === 0 && n.T > 0 && n.R < n.D) return `Đủ (còn ${n.T} đang trên đường)`;
  return null;
}
