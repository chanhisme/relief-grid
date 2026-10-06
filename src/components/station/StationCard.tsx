import { Link } from 'react-router-dom';
import type { Station } from '../../types/models';
import { calcS } from '../../lib/needLogic';
import { itemById } from '../../data/items';
import { VerifiedBadge, UrgencyBadge } from '../ui/Badges';
import { MaskedPhone } from '../ui/MaskedPhone';

function worstUrgency(st: Station) {
  const order = ['low', 'medium', 'high', 'critical'];
  let w = 'low';
  for (const n of st.needs) {
    if (calcS(n) > 0 && order.indexOf(n.urgency) > order.indexOf(w)) w = n.urgency;
  }
  return w as 'low' | 'medium' | 'high' | 'critical';
}

export function StationCard({ station, compact = false }: { station: Station; compact?: boolean }) {
  const missing = station.needs
    .map((n) => ({ n, s: calcS(n), item: itemById(n.itemId) }))
    .filter((x) => x.s > 0 && !x.n.closed)
    .sort((a, b) => b.s - a.s)
    .slice(0, compact ? 3 : 5);

  return (
    <div className="flex flex-col rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <VerifiedBadge verified={station.verified} />
        <UrgencyBadge level={worstUrgency(station)} />
        <span className="ml-auto text-xs text-slate-500">{station.distanceKm} km • {station.province}</span>
      </div>
      <Link to={`/tram/${station.id}`} className="mt-2 font-bold text-blue-950 hover:underline">
        {station.name}
      </Link>
      <div className="text-xs text-slate-500">{station.address}</div>
      {station.provinceOld !== station.province && (
        <div className="text-[11px] text-slate-400">Địa chỉ cũ: {station.address.replace(station.province, station.provinceOld)}</div>
      )}
      <div className="mt-1 text-xs">SĐT: <MaskedPhone phone={station.phone} compact /></div>
      <div className="mt-2 space-y-1 text-sm">
        {missing.length === 0 && <div className="text-green-700 font-semibold">Trạm đã nhận đủ — cảm ơn!</div>}
        {missing.map(({ n, s, item }) => (
          <div key={n.itemId} className="flex justify-between gap-2 text-[13px]">
            <span className="text-slate-700">{item.name}</span>
            <span className="font-semibold text-orange-700">còn thiếu {s}/{n.D} {item.unit}</span>
          </div>
        ))}
      </div>
      <Link
        to={`/tram/${station.id}`}
        className="mt-3 rounded-xl bg-orange-500 px-3 py-2 text-center text-sm font-bold text-white hover:bg-orange-600"
      >
        Quyên góp cho trạm này
      </Link>
    </div>
  );
}
