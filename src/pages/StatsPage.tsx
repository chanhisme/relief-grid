import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { itemById } from '../data/items';
import { calcS } from '../lib/needLogic';

export function StatsPage() {
  const stations = useAppStore((s) => s.stations);
  const orders = useAppStore((s) => s.orders);

  const m = useMemo(() => {
    let R = 0, T = 0, needCount = 0, doneCount = 0;
    const areas = new Set<string>();
    const missingByItem: Record<string, number> = {};
    const provMap: Record<string, { stations: number; missing: number }> = {};
    for (const st of stations) {
      st.servedAreas.forEach((a) => areas.add(a));
      if (!provMap[st.province]) provMap[st.province] = { stations: 0, missing: 0 };
      provMap[st.province].stations += 1;
      for (const n of st.needs) {
        needCount += 1;
        R += n.R; T += n.T;
        const s = calcS(n);
        if (s === 0) doneCount += 1;
        else {
          missingByItem[n.itemId] = (missingByItem[n.itemId] ?? 0) + s;
          provMap[st.province].missing += s;
        }
      }
    }
    const rate = needCount === 0 ? 0 : Math.round((doneCount / needCount) * 100);
    const topMissing = Object.entries(missingByItem).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const provs = Object.entries(provMap).sort((a, b) => b[1].missing - a[1].missing);
    const maxMissing = Math.max(1, ...provs.map(([, v]) => v.missing));
    return { R, T, coordinated: R + T, needCount, doneCount, rate, areas: areas.size, topMissing, provs, maxMissing,
      receivedOrders: orders.filter((o) => o.status === 'received').length };
  }, [stations, orders]);

  return (
    <div className="space-y-4 py-6">
      <h1 className="text-xl font-extrabold text-blue-950">Thống kê tác động</h1>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <div className="rounded-2xl bg-blue-900 p-4 text-white"><div className="text-2xl font-extrabold">{m.coordinated.toLocaleString('vi-VN')}</div><div className="text-[11px] opacity-80">vật phẩm đã điều phối (R+T)</div></div>
        <div className="rounded-2xl border bg-white p-4"><div className="text-2xl font-extrabold text-blue-900">{stations.length}</div><div className="text-[11px] text-slate-500">trạm được hỗ trợ</div></div>
        <div className="rounded-2xl border bg-white p-4"><div className="text-2xl font-extrabold text-blue-900">{m.areas}</div><div className="text-[11px] text-slate-500">khu vực đã tiếp cận</div></div>
        <div className="rounded-2xl border bg-white p-4"><div className="text-2xl font-extrabold text-green-700">{m.rate}%</div><div className="text-[11px] text-slate-500">nhu cầu được đáp ứng ({m.doneCount}/{m.needCount})</div></div>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="text-sm font-bold">Tỷ lệ đáp ứng: {m.doneCount}/{m.needCount} nhu cầu • {m.receivedOrders} đơn đã tới trạm</div>
        <div className="mt-2 h-4 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-green-600" style={{ width: `${m.rate}%` }} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm font-bold">Còn thiếu theo tỉnh</div>
          <div className="mt-2 space-y-1.5">
            {m.provs.map(([prov, v]) => (
              <div key={prov} className="text-xs">
                <div className="flex justify-between"><span className="font-semibold">{prov} ({v.stations} trạm)</span><span className="text-orange-700">thiếu {v.missing}</span></div>
                <div className="mt-0.5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-orange-500" style={{ width: `${(v.missing / m.maxMissing) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm font-bold">Top mặt hàng còn thiếu</div>
          <ul className="mt-2 space-y-1.5 text-sm">
            {m.topMissing.map(([id, s]) => (
              <li key={id} className="flex items-center justify-between rounded-xl bg-slate-50 px-2.5 py-1.5">
                <span className="font-semibold">{itemById(id).name}</span>
                <span className="text-orange-700">thiếu {s} {itemById(id).unit}</span>
              </li>
            ))}
            {m.topMissing.length === 0 && <li className="text-slate-500">Tất cả đã đủ — tuyệt vời!</li>}
          </ul>
          <Link to="/quyen-gop" className="mt-3 block rounded-xl bg-orange-500 px-3 py-2 text-center text-sm font-bold text-white">Quyên góp ngay</Link>
        </div>
      </div>
    </div>
  );
}
