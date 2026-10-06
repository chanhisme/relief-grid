import { useMemo, useState } from 'react';
import { FileCheck, ShieldCheck, ShieldX, PackageCheck } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { itemById } from '../data/items';
import { orderStatusLabel } from '../lib/format';

const MOCK_PAPERS: Record<string, string[]> = {
  'caobang-1': ['Công văn UBND xã Bảo Lạc số 08/CV-UBND', 'Biên bản xác nhận địa điểm kho'],
  'danang-1': ['Quyết định thành lập Đội Cứu hộ Hòa Vang', 'Ảnh kho hàng Hòa Ninh'],
};

export function AdminVerifyPage() {
  const stations = useAppStore((s) => s.stations);
  const orders = useAppStore((s) => s.orders);
  const verifyStation = useAppStore((s) => s.verifyStation);
  const rejectStation = useAppStore((s) => s.rejectStation);
  const advanceOrder = useAppStore((s) => s.advanceOrder);
  const rejectOrder = useAppStore((s) => s.rejectOrder);
  const approvals = useAppStore((s) => s.approvals);
  const approveAccount = useAppStore((s) => s.approveAccount);
  const rejectAccount = useAppStore((s) => s.rejectAccount);
  const [tab, setTab] = useState<'stations' | 'orders' | 'accounts'>('stations');

  const pending = useMemo(() => stations.filter((s) => !s.verified), [stations]);
  const verifiedCount = stations.length - pending.length;
  // Admin toàn quyền: thấy + duyệt mọi đơn mọi trạm
  const pendingOrders = useMemo(() => orders.filter((o) => o.status === 'created'), [orders]);
  const activeOrders = useMemo(
    () => orders.filter((o) => o.status !== 'received' && o.status !== 'rejected'),
    [orders],
  );

  return (
    <div className="mx-auto max-w-3xl space-y-4 py-6">
      <h1 className="text-xl font-extrabold text-blue-950">Admin — toàn quyền giám sát & duyệt</h1>
      <div className="grid grid-cols-3 gap-1 rounded-2xl border bg-white p-1 text-sm font-bold">
        <button onClick={() => setTab('stations')} className={`rounded-xl px-2 py-2 ${tab === 'stations' ? 'bg-blue-800 text-white' : 'text-slate-600'}`}>
          Duyệt trạm ({pending.length})
        </button>
        <button onClick={() => setTab('orders')} className={`rounded-xl px-2 py-2 ${tab === 'orders' ? 'bg-blue-800 text-white' : 'text-slate-600'}`}>
          Duyệt đơn ({pendingOrders.length})
        </button>
        <button onClick={() => setTab('accounts')} className={`rounded-xl px-2 py-2 ${tab === 'accounts' ? 'bg-blue-800 text-white' : 'text-slate-600'}`}>
          Duyệt tài khoản ({approvals.length})
        </button>
      </div>

      {tab === 'stations' && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-yellow-50 p-3"><div className="text-xl font-extrabold text-yellow-800">{pending.length}</div><div className="text-xs">trạm chờ duyệt</div></div>
            <div className="rounded-2xl bg-green-50 p-3"><div className="text-xl font-extrabold text-green-800">{verifiedCount}</div><div className="text-xs">trạm đã xác minh</div></div>
          </div>

          {pending.length === 0 && (
            <p className="rounded-2xl border bg-white p-4 text-sm text-green-700">Không còn hồ sơ chờ duyệt. Đăng ký trạm mới ở trang Đăng nhập để thấy ở đây.</p>
          )}
          {pending.map((st) => (
            <div key={st.id} className="rounded-2xl border bg-white p-4 text-sm">
              <div className="font-bold text-blue-950">{st.name}</div>
              <div className="text-xs text-slate-500">{st.org} • {st.address} • Liên hệ {st.contact}</div>
              <div className="mt-2 rounded-xl bg-slate-50 p-2">
                <div className="flex items-center gap-1 text-xs font-bold"><FileCheck className="h-3.5 w-3.5" /> Giấy tờ đính kèm (demo)</div>
                <ul className="mt-1 list-disc pl-5 text-xs text-slate-600">
                  {(MOCK_PAPERS[st.id] ?? ['Giấy giới thiệu đơn vị', 'Xác nhận địa điểm nhận hàng']).map((p) => <li key={p}>{p}</li>)}
                </ul>
              </div>
              <div className="mt-2 flex gap-2">
                <button onClick={() => verifyStation(st.id)} className="inline-flex items-center gap-1 rounded-lg bg-green-700 px-3 py-1.5 text-xs font-bold text-white">
                  <ShieldCheck className="h-3.5 w-3.5" /> Duyệt
                </button>
                <button onClick={() => rejectStation(st.id)} className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-bold text-red-700">
                  <ShieldX className="h-3.5 w-3.5" /> Từ chối
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {tab === 'orders' && (
        <>
          <p className="rounded-2xl border bg-slate-50 p-3 text-xs text-slate-600">
            Admin thấy mọi đơn mọi trạm. Đơn mới (`Đã tạo`) cần duyệt để đi tiếp; đơn đang đi có thể chuyển bước hoặc từ chối.
          </p>
          {activeOrders.length === 0 && (
            <p className="rounded-2xl border bg-white p-4 text-sm text-slate-500">Không có đơn nào đang xử lý.</p>
          )}
          {activeOrders.map((o) => {
            const st = stations.find((x) => x.id === o.stationId);
            return (
              <div key={o.id} className="rounded-2xl border bg-white p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold">{o.code}</span>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-800">{orderStatusLabel(o.status)}</span>
                  <span className="ml-auto text-xs text-slate-500">{o.createdAt}</span>
                </div>
                <div className="mt-1 text-[13px]">
                  <b>{o.qty} {itemById(o.itemId).unit} {itemById(o.itemId).name}</b> → {st?.name ?? o.stationId}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button onClick={() => advanceOrder(o.id)} className="inline-flex items-center gap-1 rounded-lg bg-green-700 px-3 py-1.5 text-xs font-bold text-white">
                    <PackageCheck className="h-3.5 w-3.5" /> Duyệt / chuyển bước
                  </button>
                  <button onClick={() => rejectOrder(o.id)} className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-bold text-red-700">
                    <ShieldX className="h-3.5 w-3.5" /> Từ chối
                  </button>
                </div>
              </div>
            );
          })}
        </>
      )}
      {tab === 'accounts' && (
        <>
          <p className="rounded-2xl border bg-slate-50 p-3 text-xs text-slate-600">
            Tài khoản Trạm/NPP mới đăng ký phải chờ duyệt. Donor đăng ký dùng ngay, không qua đây.
          </p>
          {approvals.length === 0 && (
            <p className="rounded-2xl border bg-white p-4 text-sm text-slate-500">Không có hồ sơ chờ duyệt.</p>
          )}
          {approvals.map((a) => (
            <div key={a.id} className="rounded-2xl border bg-white p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-blue-950">{a.name}</span>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-800">
                  {a.role === 'station' ? 'Trạm cứu trợ' : 'Nhà phân phối'}
                </span>
                <span className="ml-auto text-xs text-slate-500">{a.date}</span>
              </div>
              {a.proof && <div className="mt-1 text-xs text-slate-600">Minh chứng: {a.proof}</div>}
              <div className="mt-2 flex gap-2">
                <button onClick={() => approveAccount(a.id)} className="inline-flex items-center gap-1 rounded-lg bg-green-700 px-3 py-1.5 text-xs font-bold text-white">
                  <ShieldCheck className="h-3.5 w-3.5" /> Duyệt
                </button>
                <button onClick={() => rejectAccount(a.id)} className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-bold text-red-700">
                  <ShieldX className="h-3.5 w-3.5" /> Từ chối
                </button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
