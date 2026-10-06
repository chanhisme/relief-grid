import type { Station } from '../types/models';
import { calcS } from './needLogic';

const urgencyWeight: Record<string, number> = {
  critical: 40,
  high: 30,
  medium: 15,
  low: 5,
};

/** Điểm gợi ý = urgency + lượng thiếu + gần (demo, không GPS thật) */
export function scoreStation(st: Station, itemId: string): { score: number; reasons: string[] } {
  const need = st.needs.find((n) => n.itemId === itemId);
  const reasons: string[] = [];
  if (!need) return { score: -1, reasons };
  const s = calcS(need);
  let score = urgencyWeight[need.urgency] ?? 0;
  score += Math.min(30, s / 10);
  score += Math.max(0, 20 - st.distanceKm / 100);
  if (need.urgency === 'critical' || need.urgency === 'high') reasons.push('Mức khẩn cấp cao');
  if (s >= 100) reasons.push(`Còn thiếu nhiều (${s})`);
  if (st.distanceKm < 800) reasons.push(`Gần bạn (${st.distanceKm} km)`);
  if (st.verified) reasons.push('Trạm đã xác minh');
  return { score, reasons: reasons.slice(0, 3) };
}

export function rankStationsForItem(stations: Station[], itemId: string): Station[] {
  return stations
    .filter((st) => {
      const n = st.needs.find((x) => x.itemId === itemId);
      return n && calcS(n) > 0 && !n.closed;
    })
    .map((st) => ({ st, score: scoreStation(st, itemId).score }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.st);
}

/** 2-3 trạm khác còn thiếu đúng mặt hàng (khi trạm hiện tại đã đủ / nhập vượt S) */
export function alternativesForItem(
  stations: Station[],
  itemId: string,
  excludeStationId: string,
  limit = 3,
): Station[] {
  return rankStationsForItem(stations, itemId)
    .filter((st) => st.id !== excludeStationId)
    .slice(0, limit);
}
