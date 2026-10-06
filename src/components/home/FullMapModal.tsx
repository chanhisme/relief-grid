import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { MapLegend, VietnamBase, ZoomControls, useMapZoom, type MapEra } from './VietnamMap';

export function FullMapModal({
  open,
  onClose,
  era,
  onEra,
  highlightNames,
  pins,
  onProvinceClick,
}: {
  open: boolean;
  onClose: () => void;
  era: MapEra;
  onEra: (e: MapEra) => void;
  highlightNames: Set<string>;
  pins: React.ReactNode;
  onProvinceClick?: (featureName: string) => void;
}) {
  const zoom = useMapZoom();
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', fn);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', fn);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setHovered(null);
      zoom.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open ]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex bg-slate-900/70 p-2 sm:p-4" onClick={onClose}>
      <div
        className="mx-auto flex max-h-full w-full max-w-6xl flex-1 flex-col overflow-hidden rounded-2xl bg-white lg:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Panel trái: điều khiển + chú thích */}
        <aside className="flex shrink-0 flex-row flex-wrap items-center gap-x-3 gap-y-1 overflow-y-auto border-b p-3 lg:w-60 lg:flex-col lg:items-stretch lg:gap-2 lg:border-b-0 lg:border-r">
          <div className="flex w-full items-center gap-2">
            <span className="text-sm font-bold text-blue-950">
              Bản đồ Việt Nam ({era === 'new' ? 'sau sáp nhập · 34' : 'trước sáp nhập · 63'})
            </span>
            <button onClick={onClose} className="ml-auto grid h-8 w-8 place-items-center rounded-full border" aria-label="Đóng fullmap">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex overflow-hidden rounded-full border text-[11px] font-bold">
            <button onClick={() => onEra('new')} className={`px-2.5 py-1.5 ${era === 'new' ? 'bg-blue-800 text-white' : 'text-slate-600'}`}>
              Sau sáp nhập
            </button>
            <button onClick={() => onEra('old')} className={`px-2.5 py-1.5 ${era === 'old' ? 'bg-blue-800 text-white' : 'text-slate-600'}`}>
              Trước sáp nhập
            </button>
          </div>
          <ZoomControls zoom={zoom} />
          <div className="min-h-6 text-xs font-semibold text-blue-900">
            {hovered ?? <span className="font-normal text-slate-400">Trỏ/chạm vào tỉnh để xem tên</span>}
          </div>
          <div className="hidden lg:block">
            <MapLegend />
            <div className="px-3 pt-1 text-[10px] leading-snug text-slate-400">
              Ranh giới: Free-GIS-Data (từ TTXVN + Cục Đo đạc, Bản đồ và Thông tin địa lý VN).
              Hoàng Sa – Trường Sa là của Việt Nam.
            </div>
          </div>
        </aside>
        {/* Map kéo full chiều cao còn lại */}
        <div className="min-h-0 min-w-0 flex-1">
          <VietnamBase
            era={era}
            highlightNames={highlightNames}
            viewBox={zoom.viewBox}
            svgRef={zoom.svgRef}
            showReadout={false}
            onHoverChange={setHovered}
            onProvinceClick={onProvinceClick}
            className="h-[58vh] w-full lg:h-[86vh]"
          >
            {pins}
          </VietnamBase>
        </div>
        <div className="border-t px-3 py-1 lg:hidden">
          <MapLegend />
        </div>
      </div>
    </div>
  );
}
