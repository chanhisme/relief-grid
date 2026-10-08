import { useMemo, useState } from 'react';
import { AlertTriangle, MessageCircle, Search, TrendingUp, Users, Wallet, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { itemById } from '../data/items';
import { formatVND, orderStatusLabel } from '../lib/format';
import { ItemIcon } from '../components/ui/ItemIcon';

/** Doanh số nền mock (demo) — cộng với đơn mua-trực-tiếp thật từ store */
const BASE_SOLD: Record<string, number> = { p1: 320, p2: 410, p3: 95, p4: 180, p5: 120, p6: 150, p7: 200, p8: 260 };
const WEEK_REVENUE = [4.2, 6.8, 5.5, 9.1, 12.4, 8.7, 7.3]; // triệu đồng 7 ngày qua (nền mock)
/** Biên lợi nhuận giả định (demo): cost = 80% giá */
const COST_RATIO = 0.8;

const BANK_KEY = 'reliefgrid-bank';

type RevRange = 'today' | '7d' | 'month';

function loadBank(): { bankName: string; acc: string } {
  try {
    const p = JSON.parse(localStorage.getItem(BANK_KEY) ?? '{}') as { bankName?: string; acc?: string };
    return { bankName: p.bankName ?? '', acc: p.acc ?? '' };
  } catch {
    return { bankName: '', acc: '' };
  }
}

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

  const [edits, setEdits] = useState<Record<string, { price: string; stock: string; promo: string; imageUrl: string; variant: string }>>({});
  const [pq, setPq] = useState('');
  const [revRange, setRevRange] = useState<RevRange>('7d');
  const [bank, setBank] = useState(loadBank);
  const [bankDraft, setBankDraft] = useState(loadBank);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState('');
  const messages = useAppStore((s) => s.messages);
  const sendMessage = useAppStore((s) => s.sendMessage);
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

  const soldOf = useMemo(() => {
    const sold: Record<string, number> = { ...BASE_SOLD };
    for (const o of buyOrders) if (o.productId) sold[o.productId] = (sold[o.productId] ?? 0) + o.qty;
    return sold;
  }, [buyOrders]);

  const best = useMemo(() => {
    return products.map((p) => ({ p, qty: soldOf[p.id] ?? 0 })).sort((a, b) => b.qty - a.qty).slice(0, 3);
  }, [products, soldOf]);

  const mostStocked = useMemo(() => [...products].sort((a, b) => b.stock - a.stock).slice(0, 3), [products]);

  const profit = useMemo(() => {
    let total = 0;
    for (const p of products) total += (soldOf[p.id] ?? 0) * p.price * (1 - COST_RATIO);
    return total;
  }, [products, soldOf]);

  const promoEffect = useMemo(() => {
    let withPromo = 0, withoutPromo = 0;
    for (const p of products) {
      if (p.promo) withPromo += soldOf[p.id] ?? 0;
      else withoutPromo += soldOf[p.id] ?? 0;
    }
    return { withPromo, withoutPromo };
  }, [products, soldOf]);

  // Doanh thu thật theo kỳ từ đơn buy (createdAt YYYY-MM-DD)
  const todayStr = new Date().toISOString().slice(0, 10);
  const realByDate = useMemo(() => {
    const m: Record<string, number> = {};
    for (const o of buyOrders) {
      const p = products.find((x) => x.id === o.productId);
      if (!p) continue;
      m[o.createdAt] = (m[o.createdAt] ?? 0) + p.price * o.qty;
    }
    return m;
  }, [buyOrders, products]);

  const revChart = useMemo(() => {
    if (revRange === 'today') {
      return [{ label: 'Hôm nay', value: realByDate[todayStr] ?? 0, hint: 'đơn thật trong ngày (demo)' }];
    }
    if (revRange === 'month') {
      const buckets = [0, 0, 0, 0];
      const month = todayStr.slice(0, 7);
      for (const [ds, v] of Object.entries(realByDate)) {
        if (!ds.startsWith(month)) continue;
        const week = Math.min(3, Math.floor((Number(ds.slice(8, 10)) - 1) / 7));
        buckets[week] += v;
      }
      const mockWeek = (WEEK_REVENUE.reduce((a, b) => a + b, 0) * 1e6) / 4;
      return buckets.map((v, i) => ({ label: `Tuần ${i + 1}`, value: mockWeek + v, hint: 'nền mock + đơn thật (demo)' }));
    }
    // 7 ngày qua (mặc định): nền mock theo ngày + đơn thật cộng dồn
    const out: { label: string; value: number; hint: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      out.push({
        label: ds.slice(8, 10) + '/' + ds.slice(5, 7),
        value: WEEK_REVENUE[6 - i] * 1e6 + (realByDate[ds] ?? 0),
        hint: 'nền mock + đơn thật (demo)',
      });
    }
    return out;
  }, [revRange, realByDate, todayStr]);
  const revMax = Math.max(1, ...revChart.map((c) => c.value));

  const customers = useMemo(() => {
    const m = new Map<string, { name: string; count: number; spent: number; lastDate: string }>();
    for (const o of buyOrders) {
      const name = o.buyerName || 'Khách vãng lai (demo)';
      const p = products.find((x) => x.id === o.productId);
      const e = m.get(name) ?? { name, count: 0, spent: 0, lastDate: '' };
      e.count += 1;
      if (p) e.spent += p.price * o.qty;
      if (o.createdAt > e.lastDate) e.lastDate = o.createdAt;
      m.set(name, e);
    }
    return [...m.values()].sort((a, b) => b.spent - a.spent);
  }, [buyOrders, products]);

  const filteredProducts = useMemo(() => {
    const kw = pq.trim().toLowerCase();
    if (!kw) return products;
    return products.filter((p) =>
      `${p.name} ${itemById(p.itemId).name} ${p.promo ?? ''} ${p.variant ?? ''}`.toLowerCase().includes(kw),
    );
  }, [products, pq]);

  function sendChat() {
    sendMessage(draft);
    setDraft('');
  }

  function saveBank() {
    const v = { bankName: bankDraft.bankName.trim(), acc: bankDraft.acc.trim().replace(/\s/g, '') };
    if (!v.bankName || !v.acc) {
      pushToast('Nhập đủ tên ngân hàng + số tài khoản', 'warn');
      return;
    }
    try {
      localStorage.setItem(BANK_KEY, JSON.stringify(v));
    } catch {
      /* bỏ qua */
    }
    setBank(v);
    pushToast('Đã lưu tài khoản nhận tiền', 'success');
  }

  function openWithdraw() {
    if (!bank.acc) {
      pushToast('Hãy lưu tài khoản nhận tiền trước khi rút', 'warn');
      return;
    }
    setAmount(String(Math.round(revenue)));
    setShowWithdraw(true);
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
        <button disabled={locked} title={locked ? lockTitle : 'Rút tiền về tài khoản'} onClick={openWithdraw} className="grid place-items-center rounded-2xl bg-green-700 p-3 font-bold text-white hover:bg-green-800 disabled:opacity-40">
          <span className="inline-flex items-center gap-1 text-sm"><Wallet className="h-4 w-4" /> Rút tiền</span>
        </button>
      </div>

      {/* Doanh thu theo kỳ */}
      <div className="rounded-2xl border bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-sm font-bold"><TrendingUp className="h-4 w-4" /> Doanh thu</div>
          <div className="ml-auto flex gap-1 text-xs font-bold">
            {([['today', 'Hôm nay'], ['7d', '7 ngày'], ['month', 'Tháng']] as [RevRange, string][]).map(([r, label]) => (
              <button key={r} onClick={() => setRevRange(r)}
                className={`rounded-lg px-2 py-1 ${revRange === r ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-2 flex h-28 items-end gap-2">
          {revChart.map((c, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="w-full rounded-t-lg bg-blue-700" style={{ height: `${Math.max(4, (c.value / revMax) * 96)}px` }} title={`${c.label}: ${formatVND(Math.round(c.value))}`} />
              <span className="text-[10px] text-slate-500">{c.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-1 text-[11px] text-slate-500">{revChart[0]?.hint} — tạo đơn mua mới để thấy cột nhảy.</div>
        <div className="mt-2 grid gap-1 text-xs sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 px-2.5 py-1.5">Bán chạy: <b>{best.map((b) => `${b.p.name.split('(')[0].trim()} (${b.qty})`).join(' • ')}</b></div>
          <div className="rounded-xl bg-slate-50 px-2.5 py-1.5">Tồn nhiều nhất: <b>{mostStocked.map((p) => `${p.name.split('(')[0].trim()} (${p.stock})`).join(' • ')}</b></div>
          <div className="rounded-xl bg-slate-50 px-2.5 py-1.5">
            Lợi nhuận (cost 80% giá, demo): <b className="text-green-700">{formatVND(Math.round(profit))}</b>
            {' '}• KM hiệu quả: <b>có KM {promoEffect.withPromo}</b> / không KM {promoEffect.withoutPromo}
          </div>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <span className="inline-flex items-center gap-1 font-bold"><AlertTriangle className="h-4 w-4" /> Cảnh báo sắp hết hàng:</span>{' '}
          {lowStock.map((p) => `${p.name.split('(')[0].trim()} (còn ${p.stock})`).join(' • ')}
        </div>
      )}

      {/* Sản phẩm */}
      <section className="rounded-2xl border bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-bold">Quản lý sản phẩm ({filteredProducts.length}/{products.length})</h2>
          <div className="relative ml-auto">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input value={pq} onChange={(e) => setPq(e.target.value)} placeholder="Tìm theo tên, loại hàng, KM…"
              className="w-52 rounded-lg border py-1.5 pl-7 pr-2 text-xs" />
          </div>
        </div>
        {filteredProducts.length === 0 && <p className="mt-2 text-sm text-slate-500">Không tìm thấy sản phẩm với từ khóa này.</p>}
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          {filteredProducts.map((p) => {
            const e = edits[p.id] ?? { price: String(p.price), stock: String(p.stock), promo: p.promo ?? '', imageUrl: p.imageUrl ?? '', variant: p.variant ?? '' };
            const set = (patch: Partial<typeof e>) => setEdits((m) => ({ ...m, [p.id]: { ...e, ...patch } }));
            const preview = e.imageUrl.trim() || p.imageUrl;
            return (
              <div key={p.id} className="rounded-xl border p-2 text-sm">
                <div className="flex items-center gap-2">
                  {preview ? (
                    <img src={preview} alt={p.name} onError={(ev) => { (ev.target as HTMLImageElement).style.display = 'none'; }}
                      className="h-9 w-9 shrink-0 rounded-xl border object-cover" />
                  ) : (
                    <span className="ds-media grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-800"><ItemIcon icon={itemById(p.itemId).icon} /></span>
                  )}
                  <div className="min-w-0"><div className="truncate font-bold">{p.name}</div>
                    <div className="text-xs text-slate-500">{itemById(p.itemId).name}{p.variant ? ` • ${p.variant}` : ''} {p.freeShip ? '• Freeship' : ''}</div></div>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1 text-xs">
                  <label>Giá<input value={e.price} onChange={(ev) => set({ price: ev.target.value.replace(/[^0-9]/g, '') })} className="mt-0.5 w-full rounded-lg border px-1.5 py-1" inputMode="numeric" /></label>
                  <label>Tồn kho<input value={e.stock} onChange={(ev) => set({ stock: ev.target.value.replace(/[^0-9]/g, '') })} className="mt-0.5 w-full rounded-lg border px-1.5 py-1" inputMode="numeric" /></label>
                  <label>Khuyến mãi<input value={e.promo} onChange={(ev) => set({ promo: ev.target.value })} className="mt-0.5 w-full rounded-lg border px-1.5 py-1" placeholder="VD: -10%" /></label>
                  <label className="col-span-2">Ảnh (URL demo)<input value={e.imageUrl} onChange={(ev) => set({ imageUrl: ev.target.value })} className="mt-0.5 w-full rounded-lg border px-1.5 py-1" placeholder="https://…" inputMode="url" /></label>
                  <label>Mẫu mã<input value={e.variant} onChange={(ev) => set({ variant: ev.target.value })} className="mt-0.5 w-full rounded-lg border px-1.5 py-1" placeholder="VD: thùng 30 gói" /></label>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <button disabled={locked} title={locked ? lockTitle : 'Lưu thay đổi sản phẩm'} onClick={() => {
                    updateProduct(p.id, {
                      price: Number(e.price) || 0, stock: Number(e.stock) || 0,
                      promo: e.promo.trim() || undefined,
                      imageUrl: e.imageUrl.trim() || undefined, variant: e.variant.trim() || undefined,
                    });
                    pushToast(`Đã lưu ${p.name}`, 'success');
                  }}
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

      {/* Khách hàng */}
      <section className="rounded-2xl border bg-white p-4">
        <h2 className="flex items-center gap-1 font-bold"><Users className="h-4 w-4" /> Khách hàng ({customers.length})</h2>
        {customers.length === 0 && <p className="mt-1 text-sm text-slate-500">Chưa có đơn mua trực tiếp.</p>}
        <div className="mt-2 space-y-2">
          {customers.map((c) => (
            <div key={c.name} className="rounded-xl border p-2 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-blue-950">{c.name}</span>
                <span className="ml-auto text-xs text-slate-500">{c.count} đơn • gần nhất {c.lastDate || '—'}</span>
              </div>
              <div className="mt-0.5 text-xs text-slate-600">Tổng đã mua: <b className="text-blue-800">{formatVND(c.spent)}</b></div>
            </div>
          ))}
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
                {o.buyerName && <div className="mt-0.5 text-xs text-slate-500">Khách: {o.buyerName}{o.trackingCode ? ` • ${o.trackingCode}` : ''}</div>}
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

      {/* Tài khoản nhận tiền */}
      <section className="rounded-2xl border bg-white p-4">
        <h2 className="font-bold">Tài khoản nhận tiền (demo)</h2>
        <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-600">Ngân hàng
            <input value={bankDraft.bankName} onChange={(e) => setBankDraft((b) => ({ ...b, bankName: e.target.value }))}
              placeholder="VD: Vietcombank" className="mt-0.5 w-full rounded-lg border px-2 py-1.5 text-sm font-normal" />
          </label>
          <label className="text-xs font-semibold text-slate-600">Số tài khoản
            <input value={bankDraft.acc} onChange={(e) => setBankDraft((b) => ({ ...b, acc: e.target.value.replace(/[^0-9]/g, '') }))}
              placeholder="VD: 0123456789" inputMode="numeric" className="mt-0.5 w-full rounded-lg border px-2 py-1.5 font-mono text-sm font-normal" />
          </label>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <button onClick={saveBank} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white">Lưu tài khoản</button>
          {bank.acc && <span className="text-xs text-slate-500">Đang dùng: {bank.bankName} • {bank.acc}</span>}
        </div>
      </section>

      {/* Chat */}
      <section className="rounded-2xl border bg-white p-4">
        <h2 className="flex items-center gap-1 font-bold"><MessageCircle className="h-4 w-4" /> Chat với khách (demo, chung với bên mua)</h2>
        <div className="mt-2 max-h-56 space-y-1.5 overflow-y-auto rounded-xl bg-slate-50 p-2 text-sm">
          {messages.map((m) => {
            const mine = m.fromRole === 'distributor';
            return (
              <div key={m.id} className={`max-w-[85%] rounded-xl px-2.5 py-1.5 ${mine ? 'ml-auto bg-blue-800 text-white' : 'bg-white shadow-sm'}`}>
                {!mine && <div className="text-[10px] font-bold text-slate-400">{m.fromName} • {m.at}</div>}
                {m.text}
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex gap-2">
          <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendChat()} placeholder="Nhắn cho khách…" className="w-full rounded-lg border px-2 py-1.5 text-sm" />
          <button onClick={sendChat} className="rounded-lg bg-blue-800 px-3 py-1.5 text-sm font-bold text-white">Gửi</button>
        </div>
      </section>

      {/* Modal rút tiền */}
      {showWithdraw && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setShowWithdraw(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <h3 className="font-bold">Rút tiền (demo)</h3>
              <button onClick={() => setShowWithdraw(false)} className="ml-auto rounded-full border p-1" aria-label="Đóng">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">Về {bank.bankName} • {bank.acc} sau 1 ngày làm việc.</p>
            <label className="mt-2 block text-xs font-semibold text-slate-600">Số tiền (VND)
              <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                inputMode="numeric" className="mt-0.5 w-full rounded-lg border px-2 py-1.5 font-mono text-sm" />
            </label>
            <button
              disabled={!Number(amount)}
              onClick={() => {
                pushToast(`Đã gửi yêu cầu rút ${formatVND(Number(amount))} (demo) — tiền về sau 1 ngày làm việc`, 'success');
                setShowWithdraw(false);
              }}
              className="mt-3 w-full rounded-xl bg-green-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">
              Xác nhận rút
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
