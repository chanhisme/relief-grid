import { Link } from 'react-router-dom';
import { QrCode } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { itemById } from '../data/items';
import { orderStatusLabel } from '../lib/format';

const FLOW: string[] = ['created', 'confirmed', 'preparing', 'shipping', 'received'];

export function MyDonationsPage() {
  const orders = useAppStore((s) => s.orders);
  const stations = useAppStore((s) => s.stations);
  const advanceOrder = useAppStore((s) => s.advanceOrder);

  return (
    <div className="mx-auto max-w-3xl space-y-4 py-6">
      <h1 className="text-xl font-extrabold text-blue-950">Quyên góp của tôi</h1>
      {orders.length === 0 && <p className="text-sm">Chưa có đơn. <Link to="/quyen-gop" className="text-orange-600 underline">Quyên góp ngay</Link></p>}
      {orders.map((o) => {
        const st = stations.find((x) => x.id === o.stationId);
        const idx = FLOW.indexOf(o.status);
        return (
          <div key={o.id} className="rounded-2xl border bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold">{o.code}</span>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">{orderStatusLabel(o.status)}</span>
              <span className="ml-auto text-xs text-slate-500">{o.createdAt}</span>
            </div>
            <div className="mt-1 text-sm">
              <b>{o.qty} {itemById(o.itemId).unit} {itemById(o.itemId).name}</b> → {st?.name ?? o.stationId}
              <span className="text-slate-500"> ({o.method === 'self' ? 'Tự mang' : o.method === 'carrier' ? 'Vận chuyển' : 'Mua trực tiếp'})</span>
            </div>
            {/* timeline (đơn bị từ chối là trạng thái cuối, hiện cảnh báo thay vì tiến trình) */}
            {o.status === 'rejected' ? (
              <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                Đơn này đã bị trạm/admin từ chối. Bạn có thể tạo đơn mới hoặc chọn trạm khác.
              </div>
            ) : (
            <ol className="mt-3 flex items-center gap-0 text-[10px]">
              {FLOW.map((f, i) => (
                <li key={f} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center">
                    <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ${i <= idx ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {i + 1}
                    </span>
                    <span className="mt-0.5 hidden sm:block">{orderStatusLabel(f).split(' ')[0]}</span>
                  </div>
                  {i < FLOW.length - 1 && <span className={`mx-1 h-0.5 flex-1 ${i < idx ? 'bg-green-600' : 'bg-slate-200'}`} />}
                </li>
              ))}
            </ol>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {o.method === 'self' && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs font-bold">
                  <QrCode className="h-4 w-4" /> {o.code}
                </span>
              )}
              {o.status === 'received' && (
                <span className="rounded-lg bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                  {o.proofImg ? `Ảnh xác nhận: ${o.proofImg}` : 'Trạm đã nhận hàng'}
                </span>
              )}
              {o.status !== 'received' && o.status !== 'rejected' && (
                <button onClick={() => advanceOrder(o.id)} className="rounded-lg border px-2 py-1 text-xs font-semibold hover:border-green-500" title="Demo: diễn tiến trạng thái">
                  Demo: chuyển bước tiếp
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
