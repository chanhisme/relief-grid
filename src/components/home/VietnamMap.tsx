import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { VN63 } from '../../data/vnProvinces63';
import { VN34 } from '../../data/vnProvinces34';
import {
  MAP_H, MAP_W, STRETCH_X, anchorOfAll, anchorOfLargest,
  polysToPath, project, type EraMap,
} from '../../lib/geo';
import { NEW_FEATURE_NAME, OLD_FEATURE_NAME, VI_OLD_NAME } from '../../data/provinces';
import type { Station } from '../../types/models';

export type MapEra = 'new' | 'old';

export function eraData(era: MapEra): EraMap {
  return era === 'new' ? VN34 : VN63;
}

/** Tên hiển thị của 1 feature theo era (bản cũ dùng tên có dấu) */
export function displayName(era: MapEra, featureName: string): string {
  if (era === 'old') return VI_OLD_NAME[featureName] ?? featureName;
  return featureName;
}

/** Text không méo theo giãn ngang: đặt tại (x,y), co x về 1/STRETCH_X */
function MapText({ x, y, size, children, color = '#1e3a8a', dy = 0 }: {
  x: number; y: number; size: number; children: React.ReactNode; color?: string; dy?: number;
}) {
  return (
    <text
      transform={`translate(${x.toFixed(2)} ${(y + dy).toFixed(2)}) scale(${(1 / STRETCH_X).toFixed(3)} 1)`}
      textAnchor="middle" fontSize={size} fontWeight={700} fill={color}
    >
      {children}
    </text>
  );
}

/**
 * Nền bản đồ Việt Nam dùng chung: ranh giới từng tỉnh + Hoàng Sa/Trường Sa.
 * Chỉ hiện chấm; trỏ/chạm vào tỉnh mới hiện tên (tooltip + dòng readout).
 * Nguồn: Free-GIS-Data (từ TTXVN + Cục Đo đạc, Bản đồ và Thông tin địa lý VN).
 */
export function VietnamBase({
  era,
  highlightNames,
  children,
  className = 'h-96 w-full md:h-[560px]',
  showReadout = true,
  viewBox,
  svgRef,
  onHoverChange,
  onProvinceClick,
}: {
  era: MapEra;
  highlightNames?: Set<string>;
  children?: React.ReactNode;
  className?: string;
  showReadout?: boolean;
  viewBox?: string;
  svgRef?: React.Ref<SVGSVGElement>;
  onHoverChange?: (name: string | null) => void;
  /** Bấm vào vùng tỉnh (không phải pin) -> mở dialog cứu trợ */
  onProvinceClick?: (featureName: string) => void;
}) {
  const data = eraData(era);
  const [hovered, setHovered] = useState<string | null>(null);
  const paths = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of data.provinces) m.set(p.name, polysToPath(p.polys));
    return m;
  }, [data]);
  const dots = useMemo(() => {
    const [hsx, hsy] = anchorOfAll(data.hs);
    const [tsx, tsy] = anchorOfAll(data.ts);
    return {
      hs: { d: polysToPath(data.hs), x: hsx, y: hsy },
      ts: { d: polysToPath(data.ts), x: tsx, y: tsy },
    };
  }, [data]);

  function setHover(name: string | null) {
    setHovered(name);
    onHoverChange?.(name ? displayName(era, name) : null);
  }

  return (
    <>
      <svg
        ref={svgRef}
        viewBox={viewBox ?? `0 0 ${MAP_W} ${MAP_H}`}
        className={`${className} touch-none select-none cursor-grab active:cursor-grabbing`}
        role="img" aria-label="Bản đồ Việt Nam"
      >
        {data.provinces.map((p) => {
          const hot = hovered === p.name;
          const hl = highlightNames?.has(p.name);
          return (
            <path
              key={p.name}
              d={paths.get(p.name)}
              fill={hot ? '#93c5f5' : hl ? '#bfdbfe' : '#e8edf3'}
              stroke={hot || hl ? '#1d4ed8' : '#9aa9bd'}
              strokeWidth={hot || hl ? 0.4 : 0.2}
              strokeLinejoin="round"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHover(p.name)}
              onMouseLeave={() => setHover(null)}
              onClick={() => {
                if (consumeClickGuard()) return;
                setHover(p.name);
                onProvinceClick?.(p.name);
              }}
            >
              <title>{displayName(era, p.name)}</title>
            </path>
          );
        })}
        {/* Quần đảo Hoàng Sa & Trường Sa */}
        <path d={dots.hs.d} fill="#e8edf3" stroke="#9aa9bd" strokeWidth={0.2} />
        <path d={dots.ts.d} fill="#e8edf3" stroke="#9aa9bd" strokeWidth={0.2} />
        <ellipse cx={dots.hs.x} cy={dots.hs.y} rx={1 / STRETCH_X} ry={1} fill="#1d4ed8" stroke="#fff" strokeWidth={0.25} />
        <ellipse cx={dots.ts.x} cy={dots.ts.y} rx={1 / STRETCH_X} ry={1} fill="#1d4ed8" stroke="#fff" strokeWidth={0.25} />
        <MapText x={dots.hs.x} y={dots.hs.y} dy={-2.4} size={3}>Hoàng Sa</MapText>
        <MapText x={dots.ts.x} y={dots.ts.y} dy={3.8} size={3}>Trường Sa</MapText>
        {children}
      </svg>
      {showReadout && (
        <div className="h-5 px-3 text-xs font-semibold text-blue-900">
          {hovered ? displayName(era, hovered) : <span className="font-normal text-slate-400">Trỏ/chạm vào tỉnh để xem tên</span>}
        </div>
      )}
    </>
  );
}

const PIN_COLOR: Record<string, string> = {
  critical: '#dc2626',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

/** Chú thích màu pin theo mức khẩn cấp (dùng chung map thường + fullmap) */
export function MapLegend() {
  return (
    <div className="flex flex-wrap gap-2 px-3 pb-1 text-[11px]">
      <span><i className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: PIN_COLOR.critical }} />Rất khẩn cấp</span>
      <span><i className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: PIN_COLOR.high }} />Cao</span>
      <span><i className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: PIN_COLOR.medium }} />Trung bình</span>
      <span><i className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: PIN_COLOR.low }} />Thấp</span>
    </div>
  );
}

export function stationColor(st: Station): string {
  const order = ['low', 'medium', 'high', 'critical'];
  let w = 'low';
  for (const n of st.needs) {
    if (order.indexOf(n.urgency) > order.indexOf(w)) w = n.urgency;
  }
  return PIN_COLOR[w];
}

/**
 * Pin các trạm đặt GIỮA TỈNH (tâm polygon lớn nhất, theo era).
 * Trạm cùng tỉnh tách đều quanh tâm để không chồng pin.
 */
export function StationPins({
  stations,
  selectedId,
  onSelect,
  era,
  onStationPick,
}: {
  stations: Station[];
  selectedId?: string;
  onSelect: (id: string) => void;
  era: MapEra;
  /** Bấm pin trạm (ngoài highlight còn mở dialog cứu trợ đúng trạm đó) */
  onStationPick?: (st: Station) => void;
}) {
  const anchors = useMemo(() => {
    const data = eraData(era);
    const byFeat = new Map(data.provinces.map((p) => [p.name, p.polys]));
    const groups = new Map<string, Station[]>();
    for (const st of stations) {
      const prov = era === 'new' ? st.province : st.provinceOld;
      const feat = (era === 'new' ? NEW_FEATURE_NAME : OLD_FEATURE_NAME)[prov] ?? prov;
      if (!groups.has(feat)) groups.set(feat, []);
      groups.get(feat)!.push(st);
    }
    const m = new Map<string, [number, number]>();
    groups.forEach((list, feat) => {
      const polys = byFeat.get(feat);
      const [bx, by] = polys ? anchorOfLargest(polys) : project(list[0].lat, list[0].lng);
      list.forEach((st, i) => {
        if (list.length === 1) {
          m.set(st.id, [bx, by]);
        } else {
          const a = (i / list.length) * Math.PI * 2 - Math.PI / 2;
          m.set(st.id, [bx + (Math.cos(a) * 1.8), by + (Math.sin(a) * 1.8)]);
        }
      });
    });
    return m;
  }, [stations, era]);

  return (
    <>
      {stations.map((st) => {
        const [x, y] = anchors.get(st.id) ?? project(st.lat, st.lng);
        const sel = selectedId === st.id;
        return (
          <g
            key={st.id}
            onClick={() => {
              if (consumeClickGuard()) return;
              onSelect(st.id);
              onStationPick?.(st);
            }}
            className="cursor-pointer"
          >
            {sel && (
              <ellipse cx={x} cy={y} rx={3 / STRETCH_X} ry={3} fill="none" stroke={stationColor(st)} strokeWidth={0.5} opacity={0.7} />
            )}
            <ellipse
              cx={x} cy={y} rx={(sel ? 1.9 : 1.35) / STRETCH_X} ry={sel ? 1.9 : 1.35}
              fill={stationColor(st)}
              stroke={sel ? '#0f172a' : '#fff'}
              strokeWidth={0.35}
            >
              <title>{st.name}</title>
            </ellipse>
          </g>
        );
      })}
    </>
  );
}

export interface ZoomView {
  x: number; y: number; w: number; h: number; k: number;
}

const FULL_VIEW: ZoomView = { x: 0, y: 0, w: MAP_W, h: MAP_H, k: 1 };
const MIN_K = 1;
const MAX_K = 8;

function clampView(x: number, y: number, w: number, h: number): { x: number; y: number } {
  return {
    x: Math.min(Math.max(x, 0), Math.max(0, MAP_W - w)),
    y: Math.min(Math.max(y, 0), Math.max(0, MAP_H - h)),
  };
}

// Cờ toàn cục: vừa kéo-rê (quá ngưỡng) thì click thả chuột ngay sau bị bỏ qua
let suppressClick = false;
/** Trả true nếu click này là dư âm của thao tác kéo (đồng thời reset cờ) */
export function consumeClickGuard(): boolean {
  const s = suppressClick;
  suppressClick = false;
  return s;
}

/** Chuyển pixel màn hình -> tọa độ viewBox (tính cả letterbox của preserveAspectRatio) */
function toViewCoords(el: SVGSVGElement, v: ZoomView, clientX: number, clientY: number): [number, number] {
  const rect = el.getBoundingClientRect();
  const s = Math.min(rect.width / MAP_W, rect.height / MAP_H);
  const ox = (rect.width - MAP_W * s) / 2;
  const oy = (rect.height - MAP_H * s) / 2;
  const scale = v.w / (MAP_W * s);
  return [v.x + (clientX - rect.left - ox) * scale, v.y + (clientY - rect.top - oy) * scale];
}

function viewScale(el: SVGSVGElement, v: ZoomView): number {
  const rect = el.getBoundingClientRect();
  const s = Math.min(rect.width / MAP_W, rect.height / MAP_H);
  return v.w / (MAP_W * s);
}

/**
 * Zoom viewBox: lăn chuột (tại con trỏ) + kéo-rê chuột trái (có quán tính ném)
 * + pinch. Dùng chung map thường + fullmap.
 */
export function useMapZoom() {
  const [view, setView] = useState<ZoomView>(FULL_VIEW);
  const viewRef = useRef(view);
  viewRef.current = view;
  const rafRef = useRef(0);
  const velRef = useRef({ x: 0, y: 0 });
  const elRef = useRef<SVGSVGElement | null>(null);

  function stopInertia() {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
  }

  function zoomAt(cx: number, cy: number, factor: number) {
    stopInertia();
    setView((v) => {
      const k = Math.min(MAX_K, Math.max(MIN_K, v.k * factor));
      if (k === v.k) return v;
      const w = MAP_W / k;
      const h = MAP_H / k;
      // Giữ điểm (cx,cy) cố định khi zoom: nội suy vị trí góc theo tỉ lệ w
      const t = w / v.w;
      const c = clampView(cx - (cx - v.x) * t, cy - (cy - v.y) * t, w, h);
      return { ...c, w, h, k };
    });
  }

  function startInertia(vx: number, vy: number) {
    stopInertia();
    velRef.current = { x: vx, y: vy };
    let last: number | null = null;
    const tick = (now: number) => {
      if (last === null) {
        last = now;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const dt = Math.min(64, now - last);
      last = now;
      const f = Math.pow(0.94, dt / 16.7);
      velRef.current.x *= f;
      velRef.current.y *= f;
      if (Math.hypot(velRef.current.x, velRef.current.y) < 0.004) {
        rafRef.current = 0;
        return;
      }
      setView((v) => {
        const c = clampView(
          v.x + velRef.current.x * dt, v.y + velRef.current.y * dt, v.w, v.h,
        );
        return { ...c, w: v.w, h: v.h, k: v.k };
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  // Callback ref: gắn listener khi svg mount (sửa bug modal mở sau nên wheel không chạy)
  function attach(el: SVGSVGElement | null) {
    const old = elRef.current as (SVGSVGElement & { __mzCleanup?: () => void }) | null;
    if (old?.__mzCleanup) {
      old.__mzCleanup();
      old.__mzCleanup = undefined;
    }
    elRef.current = el;
    if (!el) return;
    const pointers = new Map<number, [number, number]>();
    let pinchD0 = 0;
    let pinchK0 = 1;
    let downX = 0;
    let downY = 0;
    let trail: { t: number; x: number; y: number }[] = [];

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      stopInertia();
      const [cx, cy] = toViewCoords(el, viewRef.current, e.clientX, e.clientY);
      zoomAt(cx, cy, e.deltaY > 0 ? 1 / 1.25 : 1.25);
    };
    const onDown = (e: PointerEvent) => {
      stopInertia();
      suppressClick = false;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* bỏ qua */
      }
      pointers.set(e.pointerId, [e.clientX, e.clientY]);
      if (pointers.size === 1) {
        downX = e.clientX;
        downY = e.clientY;
        trail = [{ t: performance.now(), x: e.clientX, y: e.clientY }];
      }
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchD0 = Math.hypot(a[0] - b[0], a[1] - b[1]);
        pinchK0 = viewRef.current.k;
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      const prev = pointers.get(e.pointerId)!;
      pointers.set(e.pointerId, [e.clientX, e.clientY]);
      const v = viewRef.current;
      if (pointers.size === 1) {
        // Kéo rê chuột trái: giữ chuột kéo để di chuyển bản đồ
        if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) suppressClick = true;
        const scale = viewScale(el, v);
        const dx = (e.clientX - prev[0]) * scale;
        const dy = (e.clientY - prev[1]) * scale;
        const c = clampView(v.x - dx, v.y - dy, v.w, v.h);
        setView({ ...c, w: v.w, h: v.h, k: v.k });
        const now = performance.now();
        trail.push({ t: now, x: e.clientX, y: e.clientY });
        trail = trail.filter((p) => now - p.t < 150);
      } else if (pointers.size === 2) {
        // Pinch 2 ngón
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (pinchD0 > 0 && d > 0) {
          stopInertia();
          const k = Math.min(MAX_K, Math.max(MIN_K, pinchK0 * (d / pinchD0)));
          const w = MAP_W / k;
          const h = MAP_H / k;
          const [cx, cy] = toViewCoords(el, v, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
          const t = w / v.w;
          const c = clampView(cx - (cx - v.x) * t, cy - (cy - v.y) * t, w, h);
          setView({ ...c, w, h, k });
        }
      }
    };
    const onUp = (e: PointerEvent) => {
      const wasSingle = pointers.size === 1 && pointers.has(e.pointerId);
      pointers.delete(e.pointerId);
      pinchD0 = 0;
      if (!wasSingle || pointers.size > 0) return;
      // Thả chuột khi đang lia ("ném"): quán tính trôi tiếp rồi dừng
      const v = viewRef.current;
      const now = performance.now();
      const recent = trail.filter((p) => now - p.t < 120);
      if (v.k > 1.01 && recent.length >= 2) {
        const first = recent[0];
        const lastP = recent[recent.length - 1];
        const dt = Math.max(1, lastP.t - first.t);
        const spx = (lastP.x - first.x) / dt; // px/ms
        const spy = (lastP.y - first.y) / dt;
        if (Math.hypot(spx, spy) > 0.15) {
          const scale = viewScale(el, v);
          startInertia(-spx * scale, -spy * scale);
        }
      }
      trail = [];
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    (el as SVGSVGElement & { __mzCleanup?: () => void }).__mzCleanup = () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
    };
  }

  const svgRef = useCallback(attach, []);

  useEffect(() => () => stopInertia(), []);

  function zoomCenter(factor: number) {
    stopInertia();
    const v = viewRef.current;
    zoomAt(v.x + v.w / 2, v.y + v.h / 2, factor);
  }

  return {
    view,
    viewBox: `${view.x.toFixed(2)} ${view.y.toFixed(2)} ${view.w.toFixed(2)} ${view.h.toFixed(2)}`,
    svgRef,
    zoomIn: () => zoomCenter(1.5),
    zoomOut: () => zoomCenter(1 / 1.5),
    reset: () => {
      stopInertia();
      setView(FULL_VIEW);
    },
    setK: (k: number) => {
      stopInertia();
      const v = viewRef.current;
      zoomAt(v.x + v.w / 2, v.y + v.h / 2, k / v.k);
    },
  };
}

/** Thanh trượt + nút zoom gọn */
export function ZoomControls({ zoom }: { zoom: ReturnType<typeof useMapZoom> }) {
  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <button onClick={zoom.zoomOut} className="grid h-7 w-7 place-items-center rounded-full border text-slate-700 hover:bg-slate-100" aria-label="Thu nhỏ" title="Thu nhỏ">
        <Minus className="h-3.5 w-3.5" />
      </button>
      <input
        type="range" min={MIN_K} max={MAX_K} step={0.5} value={zoom.view.k}
        onChange={(e) => zoom.setK(Number(e.target.value))}
        className="w-20 accent-blue-800 sm:w-24" aria-label="Mức zoom"
      />
      <button onClick={zoom.zoomIn} className="grid h-7 w-7 place-items-center rounded-full border text-slate-700 hover:bg-slate-100" aria-label="Phóng to" title="Phóng to">
        <Plus className="h-3.5 w-3.5" />
      </button>
      {zoom.view.k > 1.01 && (
        <button onClick={zoom.reset} className="grid h-7 w-7 place-items-center rounded-full border text-slate-700 hover:bg-slate-100" aria-label="Về toàn cảnh" title="Về toàn cảnh">
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
