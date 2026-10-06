import { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartHandshake, X } from 'lucide-react';
import type { Station } from '../../types/models';
import { itemById } from '../../data/items';
import { calcS } from '../../lib/needLogic';
import { displayName, type MapEra } from './VietnamMap';
import { NEW_FEATURE_NAME, OLD_FEATURE_NAME } from '../../data/provinces';
import { UrgencyBadge } from '../ui/Badges';
import { VerifiedBadge } from '../ui/Badges';

/** Bấm vùng tỉnh / pin trạm trên bản đồ -> dialog giữa màn hình hỏi cứu trợ */
export function ProvinceReliefModal({
  featureName,
  era,
  stations,
  onlyStationId,
  onClose,
}: {
  featureName: string | null;
  era: MapEra;
  stations: Station[];
  /** Bấm từ pin trạm: chỉ hiện đúng trạm đó */
  onlyStationId?: string | null;
  onClose: () => void;
}) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!featureName) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [featureName, onClose]);

  const inProvince = useMemo(() => {
    if (!featureName) return [];
    const list = stations.filter((st) => {
      const map = era === 'new' ? NEW_FEATURE_NAME : OLD_FEATURE_NAME;
      const prov = era === 'new' ? st.province : st.provinceOld;
      return (map[prov] ?? prov) === featureName;
    });
    if (onlyStationId) {
      const one = list.find((st) => st.id === onlyStationId);
      return one ? [one] : [];
    }
    return list;
  }, [stations, era, featureName, onlyStationId]);

  const suggestions = useMemo(() => {
    const scored = stations.map((st) => ({
      st,
      s: st.needs.reduce((a, n) => a + calcS(n), 0),
    }));
    return scored.sort((a, b) => b.s - a.s).slice(0, 2);
  }, [stations]);

  if (!featureName) return null;
  const provLabel = displayName(era, featureName);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-2">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-100 text-orange-700">
            <HeartHandshake className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-extrabold text-blue-950">Bạn có muốn cứu trợ {provLabel}?</h2>
            <p className="text-xs text-slate-500">
              {era === 'new' ? 'Sau sáp nhập · 34 tỉnh/thành' : 'Trước sáp nhập · 63 tỉnh/thành'}
            </p>
          </div>
          <button onClick={onClose} className="ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-full border" aria-label="Để sau">
            <X className="h-4 w-4" />
          </button>
        </div>

        {inProvince.length === 0 ? (
          <div className="mt-3">
            <p className="text-sm text-slate-600">
              {provLabel} chưa có trạm nào trong demo. Bạn có thể cứu các trạm đang thiếu nhiều nhất:
            </p>
            <div className="mt-2 space-y-2">
              {suggestions.map(({ st, s }) => (
                <SuggestionRow key={st.id} st={st} sub={`Còn thiếu ${s} vật phẩm`} onPick={() => { onClose(); navigate(`/tram/${st.id}`); }} />
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {inProvince.map((st) => (
              <StationRelief key={st.id} st={st} onClose={onClose} />
            ))}
          </div>
        )}

        <button onClick={onClose} className="mt-4 w-full rounded-xl border px-4 py-2 text-sm font-bold text-slate-600">
          Để sau
        </button>
      </div>
    </div>
  );
}

function topMissing(st: Station) {
  return st.needs
    .map((n) => ({ n, s: calcS(n) }))
    .filter((x) => x.s > 0 && !x.n.closed)
    .sort((a, b) => b.s - a.s)
    .slice(0, 3);
}

function StationRelief({ st, onClose }: { st: Station; onClose: () => void }) {
  const navigate = useNavigate();
  const top = topMissing(st);
  const best = top[0];
  return (
    <div className="rounded-2xl border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-blue-950">{st.name}</span>
        <VerifiedBadge verified={st.verified} />
      </div>
      <div className="mt-1 text-xs text-slate-500">{st.address}</div>
      {top.length === 0 ? (
        <div className="mt-1 text-xs font-semibold text-green-700">Trạm đã nhận đủ — cảm ơn!</div>
      ) : (
        <ul className="mt-1.5 space-y-1">
          {top.map(({ n, s }) => (
            <li key={n.itemId} className="flex items-center gap-2 text-[13px]">
              <UrgencyBadge level={n.urgency} />
              <span className="font-medium">{itemById(n.itemId).name}</span>
              <span className="ml-auto font-bold text-orange-700">thiếu {s}/{n.D}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2 flex gap-2">
        {best && (
          <button
            onClick={() => { onClose(); navigate(`/quyen-gop?item=${best.n.itemId}&station=${st.id}`); }}
            className="flex-1 rounded-xl bg-orange-500 px-3 py-2 text-sm font-bold text-white hover:bg-orange-600"
          >
            Cứu trạm này
          </button>
        )}
        <Link
          to={`/tram/${st.id}`}
          onClick={onClose}
          className="rounded-xl border px-3 py-2 text-sm font-bold text-blue-800"
        >
          Chi tiết
        </Link>
      </div>
    </div>
  );
}

function SuggestionRow({ st, sub, onPick }: { st: Station; sub: string; onPick: () => void }) {
  return (
    <button onClick={onPick} className="block w-full rounded-xl border p-2.5 text-left hover:border-orange-400">
      <div className="text-sm font-bold text-blue-950">{st.name}</div>
      <div className="text-xs text-slate-500">{st.province} • {sub}</div>
    </button>
  );
}
