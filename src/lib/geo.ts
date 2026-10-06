/** Kiểu dữ liệu bản đồ: poly -> ring -> [lng, lat] */
export interface ProvinceShape {
  name: string;
  /** mỗi poly = mảng ring, mỗi ring = mảng [lng, lat] */
  polys: number[][][][];
}

export interface EraMap {
  provinces: ProvinceShape[];
  /** Cụm đảo Hoàng Sa (mảng poly) */
  hs: number[][][][];
  /** Cụm đảo Trường Sa (mảng poly) */
  ts: number[][][][];
}

/** Khung bao toàn VN gồm 2 quần đảo */
export const VN_BBOX = { minLng: 102.1, maxLng: 117.9, minLat: 6.9, maxLat: 23.4 };
/** Giãn ngang lúc chưa zoom cho đầy khung (UI), y giữ nguyên */
export const STRETCH_X = 1.5;
export const MAP_W = 100 * STRETCH_X;
export const MAP_H = 104.5;

/** Chiếu lat/lng -> tọa độ SVG */
export function project(lat: number, lng: number): [number, number] {
  const x = ((lng - VN_BBOX.minLng) / (VN_BBOX.maxLng - VN_BBOX.minLng)) * MAP_W;
  const y = ((VN_BBOX.maxLat - lat) / (VN_BBOX.maxLat - VN_BBOX.minLat)) * MAP_H;
  return [x, y];
}

/** Mảng poly -> chuỗi path SVG */
export function polysToPath(polys: number[][][][]): string {
  let d = '';
  for (const poly of polys) {
    for (const ring of poly) {
      if (ring.length === 0) continue;
      d += 'M' + ring.map(([lng, lat]) => `${project(lat, lng).map((v) => v.toFixed(2)).join(',')}`).join('L') + 'Z';
    }
  }
  return d;
}

/** Trọng tâm (trung bình điểm) của cụm poly */
export function centroidOf(polys: number[][][][]): [number, number] {
  let sx = 0, sy = 0, n = 0;
  for (const poly of polys) {
    for (const ring of poly) {
      for (const [lng, lat] of ring) {
        const [x, y] = project(lat, lng);
        sx += x; sy += y; n += 1;
      }
    }
  }
  if (n === 0) return [0, 0];
  return [sx / n, sy / n];
}

function bboxOfRing(ring: number[][]): [number, number, number, number] {
  let mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9;
  for (const [lng, lat] of ring) {
    if (lng < mnx) mnx = lng;
    if (lng > mxx) mxx = lng;
    if (lat < mny) mny = lat;
    if (lat > mxy) mxy = lat;
  }
  return [mnx, mxx, mny, mxy];
}

/** Tâm bbox của polygon LỚN NHẤT — dùng đặt pin giữa tỉnh */
export function anchorOfLargest(polys: number[][][][]): [number, number] {
  let best: number[][] | null = null;
  for (const poly of polys) {
    for (const ring of poly) {
      if (!best || ring.length > best.length) best = ring;
    }
  }
  if (!best) return [0, 0];
  const [mnx, mxx, mny, mxy] = bboxOfRing(best);
  return project((mny + mxy) / 2, (mnx + mxx) / 2);
}

/** Tâm bbox TOÀN cụm poly — dùng đặt chấm đảo Hoàng Sa/Trường Sa */
export function anchorOfAll(polys: number[][][][]): [number, number] {
  let mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9, n = 0;
  for (const poly of polys) {
    for (const ring of poly) {
      const [a, b, c, d] = bboxOfRing(ring);
      if (a < mnx) mnx = a;
      if (b > mxx) mxx = b;
      if (c < mny) mny = c;
      if (d > mxy) mxy = d;
      n += 1;
    }
  }
  if (n === 0) return [0, 0];
  return project((mny + mxy) / 2, (mnx + mxx) / 2);
}
