import { useMemo, useState } from 'react';
import { Maximize2 } from 'lucide-react';
import type { Station } from '../../types/models';
import { useAppStore } from '../../store/useAppStore';
import { MapLegend, StationPins, VietnamBase, ZoomControls, useMapZoom, type MapEra } from './VietnamMap';
import { FullMapModal } from './FullMapModal';
import { ProvinceReliefModal } from './ProvinceReliefModal';
import { NEW_FEATURE_NAME, OLD_FEATURE_NAME } from '../../data/provinces';

/** Bản đồ Việt Nam thật (offline, Free-GIS-Data). Toggle sau/trước sáp nhập + zoom + fullmap. */
export function StationMap({
  stations,
  selectedId,
  onSelect,
}: {
  stations: Station[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  const dataSaver = useAppStore((s) => s.dataSaver);
  const [era, setEra] = useState<MapEra>('new');
  const [fullOpen, setFullOpen] = useState(false);
  const [relief, setRelief] = useState<{ feature: string; stationId?: string } | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const zoom = useMapZoom();

  const highlightNames = useMemo(() => {
    const s = new Set<string>();
    for (const st of stations) {
      const prov = era === 'new' ? st.province : st.provinceOld;
      const map = era === 'new' ? NEW_FEATURE_NAME : OLD_FEATURE_NAME;
      s.add(map[prov] ?? prov);
    }
    return s;
  }, [stations, era]);

  function featOf(st: Station): string {
    const prov = era === 'new' ? st.province : st.provinceOld;
    const map = era === 'new' ? NEW_FEATURE_NAME : OLD_FEATURE_NAME;
    return map[prov] ?? prov;
  }

  const pins = (
    <StationPins
      stations={stations}
      selectedId={selectedId}
      onSelect={onSelect}
      era={era}
      onStationPick={(st) => setRelief({ feature: featOf(st), stationId: st.id })}
    />
  );

  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-white ${dataSaver ? '' : 'shadow-sm'}`}>
      <div className="flex flex-wrap items-center gap-2 px-3 pt-2 text-xs text-slate-500">
        <span>Bản đồ Việt Nam ({era === 'new' ? 'sau sáp nhập · 34' : 'trước sáp nhập · 63'})</span>
        <span>{stations.length} trạm</span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-full border text-[11px] font-bold">
            <button
              onClick={() => setEra('new')}
              className={`px-2.5 py-1 ${era === 'new' ? 'bg-blue-800 text-white' : 'text-slate-600'}`}
            >
              Sau sáp nhập
            </button>
            <button
              onClick={() => setEra('old')}
              className={`px-2.5 py-1 ${era === 'old' ? 'bg-blue-800 text-white' : 'text-slate-600'}`}
            >
              Trước sáp nhập
            </button>
          </div>
          <button
            onClick={() => setFullOpen(true)}
            className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold text-blue-800 hover:bg-blue-50"
          >
            <Maximize2 className="h-3.5 w-3.5" /> Fullmap
          </button>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row">
        {/* Sidebar trái (desktop) / dưới map (mobile): zoom + legend + tên tỉnh hover */}
        <aside className="order-2 flex shrink-0 flex-row flex-wrap items-center gap-x-4 gap-y-1 px-3 py-1 lg:order-1 lg:w-48 lg:flex-col lg:items-stretch lg:gap-2 lg:py-2">
          <ZoomControls zoom={zoom} />
          <MapLegend />
          <div className="min-h-5 text-xs font-semibold text-blue-900">
            {hovered ?? <span className="font-normal text-slate-400">Trỏ/chạm vào tỉnh để xem tên</span>}
          </div>
        </aside>
        {/* Map */}
        <div className="order-1 min-w-0 flex-1 lg:order-2">
          <VietnamBase
            era={era}
            highlightNames={highlightNames}
            viewBox={zoom.viewBox}
            svgRef={zoom.svgRef}
            showReadout={false}
            onHoverChange={setHovered}
            onProvinceClick={(f) => setRelief({ feature: f })}
          >
            {pins}
          </VietnamBase>
        </div>
      </div>
      <div className="px-3 pb-3 text-[10px] leading-snug text-slate-400">
        Ranh giới: Free-GIS-Data (từ TTXVN + Cục Đo đạc, Bản đồ và Thông tin địa lý VN).
        Hoàng Sa – Trường Sa là của Việt Nam. Không có đường lưỡi bò. Lăn chuột để zoom, giữ chuột kéo để di chuyển.
      </div>
      <FullMapModal
        open={fullOpen}
        onClose={() => setFullOpen(false)}
        era={era}
        onEra={setEra}
        highlightNames={highlightNames}
        pins={pins}
        onProvinceClick={(f) => setRelief({ feature: f })}
      />
      <ProvinceReliefModal
        featureName={relief?.feature ?? null}
        era={era}
        stations={stations}
        onlyStationId={relief?.stationId}
        onClose={() => setRelief(null)}
      />
    </div>
  );
}
