import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BellRing, QrCode, FlaskConical, Plus } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { ITEMS, itemById } from '../data/items';
import { calcS } from '../lib/needLogic';
import { ProgressBar3 } from '../components/ui/ProgressBar3';
import { VerifiedBadge } from '../components/ui/Badges';
import type { Urgency } from '../types/models';

export function StationDashboardPage() {
  const stations = useAppStore((s) => s.stations);
  const orders = useAppStore((s) => s.orders);
  const managedStationId = useAppStore((s) => s.managedStationId);
  const setManagedStation = useAppStore((s) => s.setManagedStation);
  const isLoggedIn = useAppStore((s) => s.isLoggedIn);
  const userRole = useAppStore((s) => s.userRole);
  const quickLogin = useAppStore((s) => s.quickLogin);
  const confirmReceipt = useAppStore((s) => s.confirmReceipt);
  const advanceOrder = useAppStore((s) => s.advanceOrder);
  const rejectOrder = useAppStore((s) => s.rejectOrder);
  const updateNeed = useAppStore((s) => s.updateNeed);
  const addNeed = useAppStore((s) => s.addNeed);
  const updateStationProfile = useAppStore((s) => s.updateStationProfile);
  const addServedArea = useAppStore((s) => s.addServedArea);
  const addProof = useAppStore((s) => s.addProof);
  const simulateIncoming = useAppStore((s) => s.simulateIncoming);
  const verifyStatus = useAppStore((s) => s.verifyStatus);
  // Trạm đăng ký chưa được admin duyệt -> khóa các tác vụ chính
  const locked = userRole === 'station' && verifyStatus !== 'verified';
  const lockTitle = 'Tài khoản đang chờ admin duyệt';

  const st = stations.find((x) => x.id === managedStationId) ?? stations[0];
  const [qr, setQr] = useState('');
  const [recv, setRecv] = useState<Record<string, string>>({});
  const [newArea, setNewArea] = useState('');
  const [newProof, setNewProof] = useState('');
  const [addItem, setAddItem] = useState('');
  const [addD, setAddD] = useState('100');
  const [addUrg, setAddUrg] = useState<Urgency>('medium');

  const incoming = useMemo(
    () => orders.filter((o) => o.stationId === st.id && o.status !== 'received' && o.status !== 'rejected'),
    [orders, st.id],
  );
  const kpi = useMemo(() => {
    const open = st.needs.filter((n) => calcS(n) > 0 && !n.closed).length;
    const done = st.needs.filter((n) => calcS(n) === 0 || n.closed).length;
    const shipping = incoming.length;
    const distributed = st.needs.reduce((a, n) => a + n.R, 0);
    return { open, done, shipping, distributed };
  }, [st, incoming]);

  const notices = useMemo(() => {
    const out: { msg: string; kind: 'ok' | 'warn' }[] = [];
    for (const n of st.needs) {
      const s = calcS(n);
      const name = itemById(n.itemId).name;
      if (s === 0 && !n.closed) out.push({ msg: `${name} đã đủ, hệ thống đã đóng nhận quyên góp`, kind: 'ok' });
      else if (n.D > 0 && s > 0) {
        const pct = Math.round((s / n.D) * 100);
        if (pct >= 50) out.push({ msg: `${name} còn thiếu ${pct}%`, kind: 'warn' });
      }
    }
    return out;
  }, [st]);

  const qrOrder = useMemo(() => {
    const code = qr.trim().toUpperCase();
    if (!code) return undefined;
    return orders.find((o) => o.code.toUpperCase() === code && o.stationId === st.id && o.status !== 'received' && o.status !== 'rejected');
  }, [orders, qr, st.id]);

  const missingItems = ITEMS.filter((i) => !st.needs.some((n) => n.itemId === i.id));

  return (
    <div className="space-y-4 py-6">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-extrabold text-blue-950">Dashboard trạm</h1>
        <VerifiedBadge verified={st.verified} />
        <select value={st.id} onChange={(e) => setManagedStation(e.target.value)} className="rounded-lg border px-2 py-1 text-sm" title="Chọn trạm đang quản lý (demo)">
          {stations.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
        <Link to={`/tram/${st.id}`} className="rounded-lg border px-2 py-1 text-xs font-bold text-blue-800">Xem trang công khai (C) →</Link>
        <button onClick={() => simulateIncoming(st.id)} title="Demo: giả lập đơn mới đến để trình diễn toast realtime"
          className="ml-auto inline-flex items-center gap-1 rounded-lg border border-dashed border-slate-400 px-2 py-1 text-xs font-semibold text-slate-600 hover:border-orange-500 hover:text-orange-700">
          <FlaskConical className="h-3.5 w-3.5" /> Demo: giả lập đơn mới đến
        </button>
      </div>

      {(!isLoggedIn || userRole !== 'station') && (
        <div className="rounded-2xl border border-yellow-300 bg-yellow-50 p-3 text-sm">
          Bạn đang xem demo chưa đăng nhập vai trò Trạm.{' '}
          <button onClick={() => quickLogin('station')} className="rounded-lg bg-blue-800 px-2 py-1 text-xs font-bold text-white">Đăng nhập nhanh: Trạm</button>
          <span className="text-slate-500"> (vẫn cho xem trước để tiện demo)</span>
        </div>
      )}
      {locked && (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-3 text-sm font-semibold text-red-800">
          Tài khoản trạm đang chờ admin duyệt — các nút Duyệt đơn, Xác nhận hàng, Sửa nhu cầu, Đăng minh chứng tạm khóa.
        </div>
      )}

      {/* 4 KPI */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Kpi label="Nhu cầu đang mở" value={kpi.open} sub="mặt hàng S > 0" color="bg-blue-50 text-blue-900" />
        <Kpi label="Mặt hàng đã đủ" value={kpi.done} sub="S = 0 / đã đóng" color="bg-green-50 text-green-900" />
        <Kpi label="Đơn đang vận chuyển" value={kpi.shipping} sub="chưa xác nhận nhận" color="bg-orange-50 text-orange-900" />
        <Kpi label="Đã phân phát" value={kpi.distributed} sub="tổng R" color="bg-slate-100 text-slate-900" />
      </div>

      {/* Thông báo */}
      {notices.length > 0 && (
        <div className="rounded-2xl border bg-white p-3">
          <div className="flex items-center gap-1 text-sm font-bold"><BellRing className="h-4 w-4" /> Thông báo trạm</div>
          <ul className="mt-1 space-y-1 text-xs">
            {notices.map((n, i) => (
              <li key={i} className={`rounded-lg px-2 py-1 ${n.kind === 'ok' ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'}`}>{n.msg}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Đơn đang đến — trạm toàn quyền duyệt đơn về trạm mình */}
      <section className="rounded-2xl border bg-white p-4">
        <h2 className="font-bold">Đơn đang đến — duyệt đơn ({incoming.length})</h2>
        {incoming.length === 0 && <p className="mt-1 text-sm text-slate-500">Không có đơn nào đang đến. Bấm “Demo: giả lập đơn mới đến” để trình diễn.</p>}
        <div className="mt-2 space-y-2">
          {incoming.map((o) => (
            <div key={o.id} className="rounded-xl border p-2 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono font-bold">{o.code}</span>
                <span>{o.qty} {itemById(o.itemId).unit} {itemById(o.itemId).name}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px]">{o.method === 'self' ? 'Tự mang' : o.method === 'carrier' ? 'Vận chuyển' : 'Mua trực tiếp'} • {o.status}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {o.status !== 'shipping' && (
                  <button
                    onClick={() => advanceOrder(o.id)}
                    disabled={locked} title={locked ? lockTitle : 'Duyệt: cho đơn đi tiếp 1 bước'}
                    className="rounded-lg bg-blue-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-900 disabled:opacity-40"
                  >
                    Duyệt đơn
                  </button>
                )}
                <button
                  onClick={() => rejectOrder(o.id)}
                  disabled={locked} title={locked ? lockTitle : 'Từ chối đơn này'}
                  className="rounded-lg border px-3 py-1.5 text-xs font-bold text-red-700 disabled:opacity-40"
                >
                  Từ chối
                </button>
                <label className="text-xs font-semibold">Số lượng thực nhận
                  <input value={recv[o.id] ?? String(o.qty)} onChange={(e) => setRecv((m) => ({ ...m, [o.id]: e.target.value.replace(/[^0-9]/g, '') }))}
                    className="ml-1 w-24 rounded-lg border px-2 py-1 text-sm" inputMode="numeric" />
                </label>
                <button
                  onClick={() => confirmReceipt(st.id, o.itemId, Number(recv[o.id] ?? o.qty), o.id)}
                  disabled={locked} title={locked ? lockTitle : 'Xác nhận đã nhận hàng'}
                  className="rounded-lg bg-green-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-800 disabled:opacity-40"
                >
                  Xác nhận đã nhận
                </button>
                <span className="text-[11px] text-slate-500">Giao thiếu → phần thiếu quay lại S (xem ngay ở trang C)</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quét QR */}
      <section className="rounded-2xl border bg-white p-4">
        <h2 className="flex items-center gap-1 font-bold"><QrCode className="h-4 w-4" /> Quét / nhập mã QR đơn tự mang</h2>
        <div className="mt-2 flex gap-2">
          <input value={qr} onChange={(e) => setQr(e.target.value)} placeholder="VD: RG-1001" className="w-full rounded-lg border px-2 py-1.5 font-mono text-sm" />
          <button
            disabled={!qrOrder || locked} title={locked ? lockTitle : 'Xác nhận mã QR'}
            onClick={() => qrOrder && confirmReceipt(st.id, qrOrder.itemId, qrOrder.qty, qrOrder.id)}
            className="rounded-lg bg-blue-800 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
          >
            Xác nhận
          </button>
        </div>
        {qr.trim() !== '' && !qrOrder && <p className="mt-1 text-xs text-slate-500">Không thấy đơn tự mang nào của trạm với mã này (hoặc đã nhận).</p>}
        {qrOrder && <p className="mt-1 text-xs text-green-700">Tìm thấy: {qrOrder.qty} {itemById(qrOrder.itemId).name} — bấm Xác nhận để R tăng, T giảm.</p>}
      </section>

      {/* Nhu cầu */}
      <section className="rounded-2xl border bg-white p-4">
        <h2 className="font-bold">Tạo / sửa nhu cầu theo mặt hàng (D, mức khẩn cấp)</h2>
        <div className="mt-2 space-y-2">
          {st.needs.map((n) => (
            <NeedEditor
              key={n.itemId} stationId={st.id} itemId={n.itemId}
              D={n.D} R={n.R} T={n.T} urgency={n.urgency} closed={!!n.closed}
              locked={locked} lockTitle={lockTitle}
              onSave={(patch) => updateNeed(st.id, n.itemId, patch)}
            />
          ))}
        </div>
        {missingItems.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-2 text-sm">
            <Plus className="h-4 w-4" />
            <select value={addItem} onChange={(e) => setAddItem(e.target.value)} className="rounded-lg border px-2 py-1 text-sm">
              <option value="">+ Thêm mặt hàng…</option>
              {missingItems.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
            <input value={addD} onChange={(e) => setAddD(e.target.value.replace(/[^0-9]/g, ''))} className="w-20 rounded-lg border px-2 py-1 text-sm" placeholder="D" />
            <select value={addUrg} onChange={(e) => setAddUrg(e.target.value as Urgency)} className="rounded-lg border px-2 py-1 text-sm">
              <option value="low">Thấp</option><option value="medium">Trung bình</option><option value="high">Cao</option><option value="critical">Rất khẩn cấp</option>
            </select>
            <button disabled={!addItem || locked} title={locked ? lockTitle : 'Tạo nhu cầu mới'} onClick={() => { addNeed(st.id, addItem, Number(addD) || 0, addUrg); setAddItem(''); }}
              className="rounded-lg bg-blue-800 px-2 py-1 text-xs font-bold text-white disabled:opacity-40">Tạo nhu cầu</button>
          </div>
        )}
      </section>

      {/* Hồ sơ + khu vực + minh chứng */}
      <div className="grid gap-3 md:grid-cols-2">
        <section className="rounded-2xl border bg-white p-4">
          <h2 className="font-bold">Hồ sơ / địa chỉ nhận hàng</h2>
          <ProfileForm stationId={st.id} address={st.address} pickupHours={st.pickupHours} contact={st.contact} phone={st.phone}
            onSave={(p) => updateStationProfile(st.id, p)} />
          <h3 className="mt-3 font-bold">Khu vực đã phân phát</h3>
          <p className="text-xs text-slate-500">{st.servedAreas.join(', ') || '—'}</p>
          <div className="mt-1 flex gap-2">
            <input value={newArea} onChange={(e) => setNewArea(e.target.value)} placeholder="VD: Xã Lộc An" className="w-full rounded-lg border px-2 py-1 text-sm" />
            <button onClick={() => { addServedArea(st.id, newArea); setNewArea(''); }} className="rounded-lg border px-2 py-1 text-xs font-bold">Thêm</button>
          </div>
        </section>
        <section className="rounded-2xl border bg-white p-4">
          <h2 className="font-bold">Đăng ảnh / bài minh chứng</h2>
          <div className="mt-1 flex gap-2">
            <input value={newProof} onChange={(e) => setNewProof(e.target.value)} placeholder="VD: Phát 100 thùng nước thôn A" className="w-full rounded-lg border px-2 py-1 text-sm" />
            <button disabled={locked} title={locked ? lockTitle : 'Đăng minh chứng'} onClick={() => { addProof(st.id, newProof); setNewProof(''); }} className="rounded-lg bg-blue-800 px-2 py-1 text-xs font-bold text-white disabled:opacity-40">Đăng</button>
          </div>
          <ul className="mt-2 space-y-1 text-sm">
            {st.proofs.map((p) => <li key={p.id} className="rounded-lg bg-slate-50 px-2 py-1"><b>{p.title}</b> <span className="text-xs text-slate-500">• {p.date}</span></li>)}
            {st.proofs.length === 0 && <li className="text-xs text-slate-500">Chưa có minh chứng.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, color }: { label: string; value: number; sub: string; color: string }) {
  return (
    <div className={`rounded-2xl p-3 ${color}`}>
      <div className="text-2xl font-extrabold">{value}</div>
      <div className="text-xs font-bold">{label}</div>
      <div className="text-[11px] opacity-70">{sub}</div>
    </div>
  );
}

function NeedEditor({ stationId: _sid, itemId, D, R, T, urgency, closed, locked, lockTitle, onSave }: {
  stationId: string; itemId: string; D: number; R: number; T: number; urgency: Urgency; closed: boolean;
  locked?: boolean; lockTitle?: string;
  onSave: (p: { D?: number; urgency?: Urgency; closed?: boolean }) => void;
}) {
  const [d, setD] = useState(String(D));
  const [u, setU] = useState<Urgency>(urgency);
  void _sid;
  return (
    <div className="rounded-xl border p-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <b>{itemById(itemId).name}</b>
        <span className="text-xs text-slate-500">R {R} • T {T} • S {calcS({ D, R, T })}</span>
        {closed && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-bold">Đã đóng</span>}
      </div>
      <div className="mt-1"><ProgressBar3 need={{ itemId, D, R, T, urgency }} showLegend={false} /></div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label className="text-xs">D <input value={d} onChange={(e) => setD(e.target.value.replace(/[^0-9]/g, ''))} className="ml-1 w-20 rounded-lg border px-2 py-1" inputMode="numeric" /></label>
        <select value={u} onChange={(e) => setU(e.target.value as Urgency)} className="rounded-lg border px-2 py-1 text-xs">
          <option value="low">Thấp</option><option value="medium">Trung bình</option><option value="high">Cao</option><option value="critical">Rất khẩn cấp</option>
        </select>
        <button disabled={locked} title={locked ? lockTitle : 'Lưu D và mức khẩn cấp'} onClick={() => onSave({ D: Number(d) || 0, urgency: u })} className="rounded-lg bg-slate-900 px-2 py-1 text-xs font-bold text-white disabled:opacity-40">Lưu D/khẩn cấp</button>
        <button disabled={locked} title={locked ? lockTitle : 'Đóng/mở nhận quyên góp'} onClick={() => onSave({ closed: !closed })} className="rounded-lg border px-2 py-1 text-xs font-bold disabled:opacity-40">{closed ? 'Mở lại' : 'Đóng nhận'}</button>
      </div>
    </div>
  );
}

function ProfileForm({ address, pickupHours, contact, phone, onSave }: {
  stationId: string; address: string; pickupHours: string; contact: string; phone: string;
  onSave: (p: { address: string; pickupHours: string; contact: string; phone: string }) => void;
}) {
  const [a, setA] = useState(address);
  const [h, setH] = useState(pickupHours);
  const [c, setC] = useState(contact);
  const [p, setP] = useState(phone);
  return (
    <div className="mt-1 space-y-1 text-sm">
      <input value={a} onChange={(e) => setA(e.target.value)} className="w-full rounded-lg border px-2 py-1" placeholder="Địa chỉ" />
      <div className="grid grid-cols-2 gap-1">
        <input value={h} onChange={(e) => setH(e.target.value)} className="rounded-lg border px-2 py-1" placeholder="Giờ nhận" />
        <input value={c} onChange={(e) => setC(e.target.value)} className="rounded-lg border px-2 py-1" placeholder="Người liên hệ" />
      </div>
      <div className="flex gap-1">
        <input value={p} onChange={(e) => setP(e.target.value)} className="w-full rounded-lg border px-2 py-1" placeholder="SĐT" />
        <button onClick={() => onSave({ address: a, pickupHours: h, contact: c, phone: p })} className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-bold text-white">Lưu</button>
      </div>
    </div>
  );
}
