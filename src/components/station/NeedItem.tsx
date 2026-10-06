import { Link } from 'react-router-dom';
import type { StationNeed } from '../../types/models';
import { calcS, getNeedStatus, isLocked, onTheWayLabel } from '../../lib/needLogic';
import { itemById } from '../../data/items';
import { ProgressBar3 } from '../ui/ProgressBar3';
import { UrgencyBadge, NeedStatusBadge } from '../ui/Badges';
import { ItemIcon } from '../ui/ItemIcon';
import { stationsForAlternatives } from './SurplusSuggest';
import { useAppStore } from '../../store/useAppStore';

export function NeedItem({ stationId, need, showDonate = true }: { stationId: string; need: StationNeed; showDonate?: boolean }) {
  const item = itemById(need.itemId);
  const s = calcS(need);
  const status = getNeedStatus(need);
  const locked = isLocked(need);
  const way = onTheWayLabel(need);

  return (
    <div className={`rounded-2xl border p-3 ${locked ? 'border-green-300 bg-green-50' : 'bg-white'}`}>
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-800">
          <ItemIcon icon={item.icon} />
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-bold">{item.name}</div>
          <div className="text-xs text-slate-500">D {need.D} • R {need.R} • T {need.T} • <b className={s === 0 ? 'text-green-700' : 'text-orange-700'}>S {s}</b> {item.unit}</div>
        </div>
        <div className="ml-auto flex flex-col items-end gap-1">
          <UrgencyBadge level={need.urgency} />
          <NeedStatusBadge status={status} />
        </div>
      </div>
      <div className="mt-2"><ProgressBar3 need={need} /></div>
      {way && <div className="mt-1 text-xs font-medium text-blue-700">{way}</div>}
      {locked ? (
        <div className="mt-2">
          <button
            disabled
            title="Trạm đã nhận đủ, hãy chọn nhu cầu khác"
            className="w-full cursor-not-allowed rounded-xl bg-green-200 px-3 py-2 text-sm font-bold text-green-900"
          >
            Đã đủ — khóa quyên góp
          </button>
          <Alternatives stationId={stationId} itemId={need.itemId} />
        </div>
      ) : (
        showDonate && (
          <Link
            to={`/quyen-gop?item=${need.itemId}&station=${stationId}`}
            className="mt-2 block rounded-xl bg-orange-500 px-3 py-2 text-center text-sm font-bold text-white hover:bg-orange-600"
          >
            Quyên góp • còn thiếu {s} {item.unit}
          </Link>
        )
      )}
    </div>
  );
}

function Alternatives({ stationId, itemId }: { stationId: string; itemId: string }) {
  const stations = useAppStore((s) => s.stations);
  const alts = stationsForAlternatives(stations, stationId, itemId, 2);
  if (alts.length === 0) return null;
  return (
    <div className="mt-2 rounded-xl bg-white p-2 text-xs">
      <div className="font-semibold text-slate-700">Trạm khác còn thiếu {itemById(itemId).name}:</div>
      {alts.map((a) => (
        <Link key={a.station.id} to={`/tram/${a.station.id}`} className="mt-1 block rounded-lg border px-2 py-1 hover:border-orange-400">
          <span className="font-semibold text-blue-900">{a.station.name}</span>
          <span className="text-slate-500"> — thiếu {a.s} • {a.station.province}</span>
        </Link>
      ))}
    </div>
  );
}
