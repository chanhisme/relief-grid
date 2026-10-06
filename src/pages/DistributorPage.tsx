import { useMemo, useState } from 'react';
import { AlertTriangle, MessageCircle, Wallet, TrendingUp } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { itemById } from '../data/items';
import { formatVND, orderStatusLabel } from '../lib/format';
import { ItemIcon } from '../components/ui/ItemIcon';

/** Doanh số nền mock (demo) — cộng với đơn mua-trực-tiếp thật từ store */
const BASE_SOLD: Record<string, number> = { p1: 320, p2: 410, p3: 95, p4: 180, p5: 120, p6: 150, p7: 200, p8: 260 };
const WEEK_REVENUE = [4.2, 6.8, 5.5, 9.1, 12.4, 8.7, 7.3]; // triệu đồng 7 ngày qua (mock)

interface ChatMsg { from: 'me' | 'them'; text: string }

export function DistributorPage() {
  const products = useAppStore((s) => s.products);
  const orders = useAppStore((s) => s.orders);
  const carriers = useAppStore((s) => s.carriers);
  const stations = useAppStore((s) => s.stations);
  const isLoggedIn = useAppStore((s) => s.isLoggedIn);
  const userRole = useAppStore((s) => s.userRole);
  const quickLogin = useAppStore((s) => s.quickLogin);
  const verifyStatus = useAppStore((s) => s.verifyStatus);
  // NPP đăng ký chưa được admin duyệt -> khóa các tác vụ chính
  const locked = userRole === 'distributor' && verifyStatus !== 'verified';
  const lockTitle = 'Tài khoản đang chờ admin duyệt';
  const updateProduct = useAppStore((s) => s.updateProduct);
  const advanceOrder = useAppStore((s) => s.advanceOrder);
  const setOrderCarrier = useAppStore((s) => s.setOrderCarrier);
  const returnOrder = useAppStore((s) => s.returnOrder);
  const pushToast = useAppStore((s) => s.pushToast);

  const [edits, setEdits] = useState<Record<string, { price: string; stock: string; promo: string }>>({});
  const [chat, setChat] = useState<ChatMsg[]>([
    { from: 'them', text: 'Chào shop, 50 thùng nước giao Lệ Thủy mấy ngày tới được?' },
    { from: 'me', text: 'Dạ được ạ, bên em miễn ship tuyến bão, 2-3 ngày tới nơi!' },
  ]);
  const [draft, setDraft] = useState('');

  const buyOrders = useMemo(() => orders.filter((o) => o.method === 'buy' && o.status !== 'rejected'), [orders]);
  const lowStock = useMemo(() => products.filter((p) => p.stock < 50), [products]);

  const revenue = useMemo(() => {
    let total = 0;
    for (const p of products) total += (BASE_SOLD[p.id] ?? 0) * p.price;
    for (const o of buyOrders) {
      const p = products.find((x) => x.id === o.productId);
      if (p) total += p.price * o.qty;
    }
    return total;
  }, [products, buyOrders]);

  const best = useMemo(() => {
    const sold: Record<string, number> = { ...BASE_SOLD };
    for (const o of buyOrders) if (o.productId) sold[o.productId] = (sold[o.productId] ?? 0) + o.qty;
    return products.map((p) => ({ p, qty: sold[p.id] ?? 0 })).sort((a, b) => b.qty - a.qty).slice(0, 3);
  }, [products, buyOrders]);

  function sendChat() {
    const t = draft.trim();
    if (!t) return;
    setChat((c) => [...c, { from: 'me', text: t }]);
    setDraft('');
    setTimeout(() => setChat((c) => [...c, { from: 'them', text: 'Cảm ơn shop! Em chốt đơn, giao sớm giúp trạm nhé.' }]), 900);
  }

  return (
    <div className="space-y-4 py-6">
      <h1 className="text-xl font-extrabold text-blue-950">Nhà phân phối</h1>
      {(!isLoggedIn || userRole !== 'distributor') && (
        <div className="rounded-2xl border border-yellow-300 bg-yellow-50 p-3 text-sm">
          Đăng nhập vai trò Nhà phân phối để quản lý gian hàng.{' '}
          <button onClick={() => quickLogin('distributor')} className="rounded-lg bg-blue-800 px-2 py-1 text-xs font-bold text-white">Đăng nhập nhanh: NPP</button>
        </div>
      )}
      {locked && (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-3 text-sm font-semibold text-red-800">
          Tài khoản NPP đang chờ admin duyệt — các nút Rút tiền, Lưu sản phẩm, Xử lý đơn tạm khóa.
        </div>
      )}

      {/* KPI + doanh thu */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <div className="rounded-2xl bg-blue-900 p-3 text-white"><div className="text-lg font-extrabold">{(revenue / 1e6).toFixed(1)}tr</div><div className="text-[11px] opacity-80">doanh thu cứu trợ (demo)</div></div>
        <div className="rounded-2xl bg-orange-50 p-3"><div className="text-lg font-extrabold text-orange-800">{buyOrders.length}</div><div className="text-[11px]">đơn cứu trợ</div></div>
        <div className="rounded-2xl bg-red-50 p-3"><div className="text-lg font-extrabold text-red-700">{lowStock.length}</div><div className="text-[11px]">SP sắp hết hàng</div></div>
        <button disabled={locked} title={locked ? lockTitle : 'Rút tiền về tài khoản'} onClick={() => pushToast('Đã gửi yêu cầu rút tiền (demo) — tiền về sau 1 ngày làm việc', 'success')} className="grid place-items-center rounded-2xl bg-green-700 p-3 font-bold text-white hover:bg-green-800 disabled:opacity-40">
          <span className="inline-flex items-center gap-1 text-sm"><Wallet className="h-4 w-4" /> Rút tiền</span>
        </button>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="flex items-center gap-1 text-sm font-bold"><TrendingUp className="h-4 w-4" /> Doanh thu 7 ngày (triệu đồng, mock)</div>
        <div className="mt-2 flex h-28 items-end gap-2">
          {WEEK_REVENUE.map((v, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="w-full rounded-t-lg bg-blue-700" style={{ height: `${(v / 12.4) * 96}px` }} title={`${v}tr`} />
              <span className="text-[10px] text-slate-500">T{i + 2}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 text-xs text-slate-500">Bán chạy: {best.map((b) => `${b.p.name.split('(')[0].trim()} (${b.qty})`).join(' • ')}</div>
      </div>

      {lowStock.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <span className="inline-flex items-center gap-1 font-bold"><AlertTriangle className="h-4 w-4" /> Cảnh báo sắp hết hàng:</span>{' '}
          {lowStock.map((p) => `${p.name.split('(')[0].trim()} (còn ${p.stock})`).join(' • ')}
        </div>
      )}

      {/* Sản phẩm */}
      <section className="rounded-2xl border bg-white p-4">
        <h2 className="font-bold">Quản lý sản phẩm ({products.length})</h2>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          {products.map((p) => {
            const e = edits[p.id] ?? { price: String(p.price), stock: String(p.stock), promo: p.promo ?? '' };
            return (
              <div key={p.id} className="rounded-xl border p-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="ds-media grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-800"><ItemIcon icon={itemById(p.itemId).icon} /></span>
                  <div className="min-w-0"><div className="truncate font-bold">{p.name}</div>
                    <div className="text-xs text-slate-500">{itemById(p.itemId).name} {p.freeShip ? '• Freeship' : ''}</div></div>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1 text-xs">
                  <label>Giá<input value={e.price} onChange={(ev) => setEdits((m) => ({ ...m, [p.id]: { ...e, price: ev.target.value.replace(/[^0-9]/g, '') } }))} className="mt-0.5 w-full rounded-lg border px-1.5 py-1" inputMode="numeric" /></label>
                  <label>Tồn kho<input value={e.stock} onChange={(ev) => setEdits((m) => ({ ...m, [p.id]: { ...e, stock: ev.target.value.replace(/[^0-9]/g, '') } }))} className="mt-0.5 w-full rounded-lg border px-1.5 py-1" inputMode="numeric" /></label>
                  <label>Khuyến mãi<input value={e.promo} onChange={(ev) => setEdits((m) => ({ ...m, [p.id]: { ...e, promo: ev.target.value } }))} className="mt-0.5 w-full rounded-lg border px-1.5 py-1" placeholder="VD: -10%" /></label>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <button disabled={locked} title={locked ? lockTitle : 'Lưu thay đổi sản phẩm'} onClick={() => { updateProduct(p.id, { price: Number(e.price) || 0, stock: Number(e.stock) || 0, promo: e.promo || undefined }); pushToast(`Đã lưu ${p.name}`, 'success'); }}
                    className="rounded-lg bg-slate-900 px-2 py-1 text-xs font-bold text-white disabled:opacity-40">Lưu</button>
                  <button disabled={locked} title={locked ? lockTitle : 'Bật/tắt freeship'} onClick={() => { updateProduct(p.id, { freeShip: !p.freeShip }); }} className="rounded-lg border px-2 py-1 text-xs font-semibold disabled:opacity-40">
                    {p.freeShip ? 'Tắt freeship' : 'Bật freeship'}
                  </button>
                  <span className="ml-auto text-xs font-semibold text-blue-800">{formatVND(p.price)} • tồn {p.stock}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Đơn cứu trợ */}
      <section className="rounded-2xl border bg-white p-4">
        <h2 className="font-bold">Đơn hàng cứu trợ ({buyOrders.length})</h2>
        {buyOrders.length === 0 && <p className="mt-1 text-sm text-slate-500">Chưa có đơn mua trực tiếp.</p>}
        <div className="mt-2 space-y-2">
          {buyOrders.map((o) => {
            const st = stations.find((x) => x.id === o.stationId);
            return (
              <div key={o.id} className="rounded-xl border p-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold">{o.code}</span>
                  <span>{o.qty} {itemById(o.itemId).name} → {st?.name ?? o.stationId}</span>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-800">{orderStatusLabel(o.status)}</span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <select value={o.carrierId ?? ''} onChange={(e) => setOrderCarrier(o.id, e.target.value)} className="rounded-lg border px-1.5 py-1 text-xs">
                    <option value="">Chọn ĐVVC…</option>
                    {carriers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {o.status !== 'received' && (
                    <button disabled={locked} title={locked ? lockTitle : 'Xác nhận đơn'} onClick={() => advanceOrder(o.id)} className="rounded-lg bg-green-700 px-2 py-1 text-xs font-bold text-white disabled:opacity-40">Xác nhận / chuyển bước</button>
                  )}
                  {o.status !== 'received' && (
                    <button disabled={locked} title={locked ? lockTitle : 'Hoàn trả đơn'} onClick={() => returnOrder(o.id)} className="rounded-lg border px-2 py-1 text-xs font-semibold text-red-700 disabled:opacity-40">Hoàn trả</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Chat */}
      <section className="rounded-2xl border bg-white p-4">
        <h2 className="flex items-center gap-1 font-bold"><MessageCircle className="h-4 w-4" /> Chat với khách (demo)</h2>
        <div className="mt-2 max-h-56 space-y-1.5 overflow-y-auto rounded-xl bg-slate-50 p-2 text-sm">
          {chat.map((m, i) => (
            <div key={i} className={`max-w-[85%] rounded-xl px-2.5 py-1.5 ${m.from === 'me' ? 'ml-auto bg-blue-800 text-white' : 'bg-white shadow-sm'}`}>{m.text}</div>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendChat()} placeholder="Nhắn cho khách…" className="w-full rounded-lg border px-2 py-1.5 text-sm" />
          <button onClick={sendChat} className="rounded-lg bg-blue-800 px-3 py-1.5 text-sm font-bold text-white">Gửi</button>
        </div>
      </section>
    </div>
  );
}
