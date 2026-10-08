import type { Station } from '../types/models';
import { calcS } from './needLogic';

const urgencyWeight: Record<string, number> = {
  critical: 40,
  high: 30,
  medium: 15,
  low: 5,
};

/**
 * Min-cost flow lite (docs tab1 §7: min Σ cij·xij) — thuật toán thuần trong logic, demo.
 * - Nút cung (supply): nguồn hàng của người quyên góp với số lượng qty.
 * - Nút cầu (demand): các trạm còn thiếu S > 0 của đúng mặt hàng.
 * - cij: chi phí đơn vị ước tính = khoảng cách + phạt ưu tiên thấp + phạt thiếu ít.
 *   Trạm khẩn cấp hơn / thiếu nhiều hơn / gần hơn => cij thấp hơn => được rót hàng trước.
 * Hằng số là demo (không phải cước thật), greedy theo cij tăng dần thay vì solver LP.
 */
const W_DIST = 0.1;
const URGENCY_PENALTY: Record<string, number> = {
  critical: 0,
  high: 50,
  medium: 150,
  low: 300,
};

/** Chi phí đơn vị cij của cạnh nguồn -> trạm. -1 nếu trạm không còn nhận mặt hàng này. */
export function computeCost(st: Station, itemId: string): number {
  const need = st.needs.find((n) => n.itemId === itemId);
  if (!need || need.closed) return -1;
  const s = calcS(need);
  if (s <= 0) return -1;
  const urgency = URGENCY_PENALTY[need.urgency] ?? 200;
  const fill = Math.max(0, 200 - s); // thiếu càng nhiều, phạt càng ít
  return W_DIST * st.distanceKm + urgency + fill;
}

export interface Allocation {
  stationId: string;
  /** Lượng hàng rót cho trạm (đơn vị mặt hàng, số nguyên) */
  allocQty: number;
  /** cij tại thời điểm lập phương án */
  unitCost: number;
}

export interface AllocationPlan {
  allocations: Allocation[];
  /** Σ cij·xij của phương án */
  totalCost: number;
  requested: number;
  allocated: number;
  /** Phần dôi ra khi tổng S của mọi trạm không đủ chứa */
  unmet: number;
}

/**
 * Chia nguồn hàng qty cho các trạm theo chi phí tăng dần (greedy min-cost).
 * Với mạng 1 nguồn + chi phí tuyến tính, greedy rót đầy trạm rẻ nhất trước
 * chính là nghiệm tối ưu của min Σ cij·xij (không cần solver LP).
 * @param preferStationId trạm user đã chọn: rót đầy S của trạm này trước
 * (đúng tâm lý "trạm này trước, phần dôi đi tiếp"), phần còn lại vẫn min-cost.
 */
export function allocateSupply(
  stations: Station[],
  itemId: string,
  qty: number,
  preferStationId?: string,
): AllocationPlan {
  const requested = Math.max(0, Math.floor(qty));
  const empty: AllocationPlan = { allocations: [], totalCost: 0, requested, allocated: 0, unmet: requested };
  if (requested <= 0) return { ...empty, unmet: 0 };
  const cands = stations
    .map((st) => {
      const need = st.needs.find((n) => n.itemId === itemId);
      const unitCost = computeCost(st, itemId);
      return { st, need, unitCost };
    })
    .filter((c) => c.need && c.unitCost >= 0)
    .sort((a, b) => a.unitCost - b.unitCost);
  const allocations: Allocation[] = [];
  let rest = requested;
  let totalCost = 0;
  const takeFrom = (stationId: string, unitCost: number, s: number) => {
    const take = Math.min(rest, s);
    if (take <= 0) return;
    allocations.push({ stationId, allocQty: take, unitCost });
    totalCost += unitCost * take;
    rest -= take;
  };
  // 1. Trạm user đã chọn trước (nếu còn nhận hàng)
  const prefer = preferStationId ? cands.find((c) => c.st.id === preferStationId) : undefined;
  if (prefer?.need) takeFrom(prefer.st.id, prefer.unitCost, calcS(prefer.need));
  // 2. Phần còn lại: greedy min-cost trên các trạm khác
  for (const c of cands) {
    if (rest <= 0) break;
    if (prefer && c.st.id === prefer.st.id) continue;
    takeFrom(c.st.id, c.unitCost, calcS(c.need!));
  }
  const allocated = requested - rest;
  return { allocations, totalCost, requested, allocated, unmet: rest };
}

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
