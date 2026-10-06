import { useMemo } from 'react';
import { Truck, PackageCheck, PackageOpen } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { itemById } from '../data/items';
import { UrgencyBadge } from '../components/ui/Badges';

/** Trọng lượng giả / đơn vị SP (kg) */
const UNIT_KG: Record<string, number> = { nuoc: 12, mi: 8, thuoc: 0.5, chan: 2, sua: 1, denpin: 0.4, vesinh: 1.5, ta: 3 };

export function CarrierPage() {
  const orders = useAppStore((s) => s.orders);
  const stations = useAppStore((s) => s.stations);
  const carriers = useAppStore((s) => s.carriers);
  const advanceOrder = useAppStore((s) => s.advanceOrder);
  const pushToast = useAppStore((s) => s.pushToast);

  const jobs = useMemo(
    () => orders.filter((o) => o.method !== 'self' && o.status !== 'received' && o.status !== 'rejected'),
    [orders],
  );
  const done = useMemo(
    () => orders.filter((o) => o.method !== 'self' && o.status === 'received').length,
    [orders],
  );

  return (
    <div className="mx-auto max-w-3xl space-y-4 py-6">
      <h1 className="text-xl font-extrabold text-blue-950">Đơn vị vận chuyển</h1>
      <p className="rounded-2xl border bg-slate-50 p-3 text-xs text-slate-600">
        Thực tế kết nối qua API với hệ thống của đơn vị vận chuyển. Demo này mô phỏng 3 đối tác:{' '}
        {carriers.map((c) => c.name).join(' • ')}.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-orange-50 p-3"><div className="text-xl font-extrabold text-orange-800">{jobs.length}</div><div className="text-xs">yêu cầu chờ giao</div></div>
        <div className="rounded-2xl bg-green-50 p-3"><div className="text-xl font-extrabold text-green-800">{done}</div><div className="text-xs">đơn đã hoàn tất</div></div>
      </div>

      {jobs.length === 0 && <p className="text-sm text-slate-500">Không có yêu cầu nào. Tạo đơn quyên góp (hình thức VC / mua trực tiếp) để thấy ở đây.</p>}
      {jobs.map((o) => {
        const st = stations.find((x) => x.id === o.stationId);
        const need = st?.needs.find((n) => n.itemId === o.itemId);
        const carrier = carriers.find((c) => c.id === o.carrierId);
        const kg = (UNIT_KG[o.itemId] ?? 1) * o.qty;
        return (
          <div key={o.id} className="rounded-2xl border bg-white p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-bold">{o.code}</span>
              {need && <UrgencyBadge level={need.urgency} />}
              <span className="ml-auto text-xs text-slate-500">{carrier?.name ?? 'Chưa gán ĐVVC'}</span>
            </div>
            <div className="mt-1.5 space-y-0.5 text-[13px] text-slate-700">
              <div><b>Lấy hàng:</b> {o.method === 'buy' ? 'Kho NPP Miền Trung, Đà Nẵng' : 'Địa chỉ người gửi (xem đơn)'} </div>
              <div><b>Giao đến:</b> {st?.name ?? o.stationId} — {st?.address}</div>
              <div><b>Hàng:</b> {o.qty} {itemById(o.itemId).unit} {itemById(o.itemId).name} • ~{kg.toLocaleString('vi-VN')} kg</div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {(o.status === 'created' || o.status === 'confirmed' || o.status === 'preparing') && (
                <button onClick={() => {
                  // Tiến tới trạng thái "Đang giao" (không nhảy thẳng sang Đã nhận)
                  for (let i = 0; i < 3; i++) {
                    const cur = useAppStore.getState().orders.find((x) => x.id === o.id)?.status;
                    if (!cur || cur === 'shipping' || cur === 'received') break;
                    advanceOrder(o.id);
                  }
                  pushToast(`Đơn ${o.code}: đã lấy hàng — đang giao`, 'success');
                }}
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-800 px-3 py-1.5 text-xs font-bold text-white">
                  <PackageOpen className="h-3.5 w-3.5" /> Đã lấy hàng
                </button>
              )}
              {o.status === 'shipping' && (
                <button onClick={() => { advanceOrder(o.id); pushToast(`Đơn ${o.code}: đã giao — chờ trạm kiểm kê xác nhận R/T`, 'success'); }}
                  className="inline-flex items-center gap-1 rounded-lg bg-green-700 px-3 py-1.5 text-xs font-bold text-white">
                  <PackageCheck className="h-3.5 w-3.5" /> Đã giao hàng
                </button>
              )}
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500"><Truck className="h-3.5 w-3.5" /> Giao xong trạm vẫn xác nhận kiểm kê ở dashboard</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
