import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { QrCode, Truck, ShoppingCart, HandHeart, CheckCircle2, MessageCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { ITEMS, itemById } from '../data/items';
import { ItemIcon } from '../components/ui/ItemIcon';
import { ProgressBar3 } from '../components/ui/ProgressBar3';
import { calcS } from '../lib/needLogic';
import { rankStationsForItem, scoreStation, allocateSupply } from '../lib/suggest';
import { formatVND, urgencyLabel } from '../lib/format';
import type { DonateMethod, PayMethod } from '../types/models';

const STEPS = ['Hỗ trợ gì?', 'Chọn trạm & số lượng', 'Hình thức', 'Xác nhận'];

const PAY_METHODS: { id: PayMethod; label: string }[] = [
  { id: 'momo', label: 'Ví Momo' },
  { id: 'zalopay', label: 'ZaloPay' },
  { id: 'bank', label: 'Chuyển khoản ngân hàng' },
];

export function DonateWizardPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const stations = useAppStore((s) => s.stations);
  const products = useAppStore((s) => s.products);
  const carriers = useAppStore((s) => s.carriers);
  const wizard = useAppStore((s) => s.wizard);
  const setWizard = useAppStore((s) => s.setWizard);
  const createOrder = useAppStore((s) => s.createOrder);
  const queueOfflineOrder = useAppStore((s) => s.queueOfflineOrder);
  const offline = useAppStore((s) => s.offline);

  const [step, setStep] = useState(wizard.itemId || params.get('item') ? 1 : 0);
  const [qtyText, setQtyText] = useState(wizard.qty ? String(wizard.qty) : '');
  const [pqBuy, setPqBuy] = useState('');
  const [msgDraft, setMsgDraft] = useState('');
  const messages = useAppStore((s) => s.messages);
  const sendMessage = useAppStore((s) => s.sendMessage);
  const [doneOrders, setDoneOrders] = useState<{ code: string; stationId: string; qty: number }[] | null>(null);

  // prefill từ query 1 lần
  useMemo(() => {
    const qi = params.get('item');
    const qs = params.get('station');
    if (qi && !wizard.itemId) setWizard({ itemId: qi });
    if (qs && !wizard.stationId) setWizard({ stationId: qs });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const itemId = wizard.itemId;
  const stationId = wizard.stationId;
  const method: DonateMethod | undefined = wizard.method;

  const ranked = useMemo(() => (itemId ? rankStationsForItem(stations, itemId) : []), [stations, itemId]);
  const bestId = ranked[0]?.id;

  const curNeed = useMemo(() => {
    const st = stations.find((x) => x.id === stationId);
    return st?.needs.find((n) => n.itemId === itemId);
  }, [stations, stationId, itemId]);
  const S = curNeed ? calcS(curNeed) : 0;
  const qty = Number(qtyText) || 0;
  const over = curNeed != null && qty > S;

  const surplusPlan = useMemo(() => {
    if (!itemId || !stationId || !over || qty <= 0) return null;
    return allocateSupply(stations, itemId, qty, stationId);
  }, [stations, itemId, stationId, over, qty]);
  /** Nhập vượt S nhưng tổng S các trạm đủ chứa -> cho đi tiếp, submit sẽ tạo nhiều đơn */
  const canSplit = !!surplusPlan && surplusPlan.unmet === 0 && surplusPlan.allocated === qty && surplusPlan.allocations.length > 0;

  const canNext1 = !!itemId;
  const canNext2 = !!stationId && qty > 0 && ((!over && S > 0) || canSplit);
  const canNext3 = !!method
    && (method !== 'carrier' || wizard.carrierId)
    && (method !== 'buy' || (wizard.productId && wizard.payMethod));

  function submit() {
    if (!stationId || !itemId || !method || qty <= 0) return;
    if (over && !canSplit) return;
    if (method === 'buy' && (!wizard.productId || !wizard.payMethod)) return;
    // Đơn chia theo phương án min-cost: cùng hình thức cho mọi chân đơn
    const legs = canSplit && surplusPlan
      ? surplusPlan.allocations.map((a) => ({ stationId: a.stationId, qty: a.allocQty }))
      : [{ stationId, qty }];
    const payloads = legs.map((l) => ({
      stationId: l.stationId, itemId, qty: l.qty, method,
      carrierId: method === 'carrier' ? wizard.carrierId : undefined,
      productId: method === 'buy' ? wizard.productId : undefined,
      payMethod: method === 'buy' ? wizard.payMethod : undefined,
    }));
    if (offline) {
      // Đang offline: xếp hàng chờ, sang trang đơn để thấy + đồng bộ sau
      payloads.forEach((p) => queueOfflineOrder(p));
      navigate('/quyen-gop-cua-toi');
      return;
    }
    const made = payloads.map((p) => createOrder(p));
    setDoneOrders(made.map((o) => ({ code: o.code, stationId: o.stationId, qty: o.qty })));
    setStep(3);
  }

  if (doneOrders) {
    const multi = doneOrders.length > 1;
    return (
      <div className="mx-auto max-w-xl space-y-4 py-10 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-green-600" />
        <h1 className="text-2xl font-extrabold text-blue-950">Quyên góp thành công!</h1>
        {multi ? (
          <p className="text-sm text-slate-600">
            Đã chia <b>{qty} {itemId && itemById(itemId).unit} {itemId && itemById(itemId).name}</b> thành{' '}
            <b>{doneOrders.length} đơn</b> theo phương án chi phí thấp nhất (trạm bạn chọn nhận trước, phần dôi
            rót tiếp nơi rẻ nhất). T đã tăng ở các trạm, thanh tiến độ đã cập nhật.
          </p>
        ) : (
          <p className="text-sm text-slate-600">
            Đơn <b>{doneOrders[0].code}</b> — {doneOrders[0].qty} {itemId && itemById(itemId).unit}{' '}
            {itemId && itemById(itemId).name} tới {stations.find((x) => x.id === doneOrders[0].stationId)?.name}.
            T đã tăng ngay, thanh tiến độ đã cập nhật (S giảm).
          </p>
        )}
        <div className="space-y-2 text-left">
          {doneOrders.map((o) => (
            <div key={o.code} className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm">
              {method === 'self' && <QrCode className="h-4 w-4 shrink-0 text-slate-500" />}
              <span className="font-mono font-bold">{o.code}</span>
              <span className="text-slate-600">— {o.qty} {itemId && itemById(itemId).unit} → {stations.find((x) => x.id === o.stationId)?.name}</span>
            </div>
          ))}
        </div>
        {method === 'self' && !multi && (
          <div className="mx-auto grid h-40 w-40 place-items-center rounded-2xl border-2 border-dashed bg-white">
            <div className="text-center"><QrCode className="mx-auto h-10 w-10" /><div className="mt-1 font-mono text-sm font-bold">{doneOrders[0].code}</div><div className="text-[11px] text-slate-500">Trạm quét để xác nhận</div></div>
          </div>
        )}
        <div className="flex justify-center gap-2">
          <Link to="/quyen-gop-cua-toi" className="rounded-xl bg-blue-800 px-4 py-2 text-sm font-bold text-white">Xem đơn của tôi</Link>
          <Link to={`/tram/${doneOrders[0].stationId}`} className="rounded-xl border px-4 py-2 text-sm font-bold">Xem trạm cập nhật</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 py-6">
      <h1 className="text-xl font-extrabold text-blue-950">Quyên góp (tối đa 4 bước)</h1>
      <ol className="flex gap-1 text-[10px] sm:text-xs">
        {STEPS.map((t, i) => (
          <li key={i} className={`min-w-0 flex-1 truncate rounded-lg px-1.5 py-1.5 text-center font-semibold sm:px-2 ${i === step ? 'bg-blue-800 text-white' : i < step ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-500'}`}>
            {i + 1}. {t}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div>
          <h2 className="font-bold">Bạn muốn hỗ trợ gì?</h2>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ITEMS.map((it) => (
              <button
                key={it.id}
                onClick={() => { setWizard({ itemId: it.id, stationId: undefined }); setQtyText(''); }}
                className={`rounded-2xl border p-3 text-left hover:border-orange-400 ${itemId === it.id ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-400' : 'bg-white'}`}
              >
                <ItemIcon icon={it.icon} />
                <div className="mt-1 text-sm font-bold">{it.name}</div>
                <div className="text-xs text-slate-500">đơn vị: {it.unit}</div>
              </button>
            ))}
          </div>
          <NavRow onBack={null} onNext={() => setStep(1)} canNext={canNext1} nextLabel="Tiếp tục" />
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <h2 className="font-bold">Chọn trạm đang thiếu {itemId && itemById(itemId).name}</h2>
          {!itemId && <p className="text-sm text-red-600">Hãy quay lại bước 1 chọn mặt hàng.</p>}
          {ranked.length === 0 && itemId && <p className="text-sm">Tất cả trạm đã đủ mặt hàng này. Hãy chọn mặt hàng khác.</p>}
          {ranked.map((st) => {
            const n = st.needs.find((x) => x.itemId === itemId)!;
            const s = calcS(n);
            const info = scoreStation(st, itemId!);
            const active = stationId === st.id;
            return (
              <div key={st.id} className={`rounded-2xl border p-3 ${active ? 'border-orange-500 bg-orange-50' : 'bg-white'}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => setWizard({ stationId: st.id })} className="text-left font-bold text-blue-950 hover:underline">
                    {st.name}
                  </button>
                  {st.id === bestId && <span className="rounded-full bg-green-600 px-2 py-0.5 text-[11px] font-bold text-white">Gợi ý phù hợp nhất</span>}
                  <span className="ml-auto text-xs text-slate-500">{st.distanceKm} km • {st.province}</span>
                </div>
                <div className="mt-1 text-xs text-slate-600">Vì sao gợi ý: {info.reasons.join(' • ') || '—'}</div>
                <div className="mt-2"><ProgressBar3 need={n} /></div>
                <div className="mt-1 text-xs">còn thiếu <b className="text-orange-700">{s}/{n.D}</b></div>
              </div>
            );
          })}
          {stationId && curNeed && (
            <div className="rounded-2xl border bg-white p-3">
              <label className="text-sm font-semibold">Số lượng ({itemId && itemById(itemId).unit}) — trạm còn thiếu {S}
                <input value={qtyText} onChange={(e) => setQtyText(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric"
                  placeholder={`Tối đa ${S}`} className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm" />
              </label>
              {over && (
                <div className="mt-2 rounded-xl bg-red-50 p-2 text-xs text-red-800">
                  Trạm chỉ còn thiếu {S}. Đừng bỏ cuộc vì đã lỡ mua — hệ thống chia phần dư sang trạm khác đang thiếu{' '}
                  {itemId && itemById(itemId).name} theo phương án chi phí thấp nhất:
                  {surplusPlan && surplusPlan.allocations.length > 0 && (
                    <div className="mt-1 rounded-lg bg-white p-2 text-slate-700">
                      {surplusPlan.allocations.map((a, i) => {
                        const ast = stations.find((x) => x.id === a.stationId);
                        const aneed = ast?.needs.find((n) => n.itemId === itemId);
                        return (
                          <div key={a.stationId} className="flex flex-wrap items-center gap-1 border-b py-1 last:border-0">
                            <span className="font-bold text-blue-950">{i === 0 ? 'Trạm bạn chọn' : `Trạm ${i + 1}`}: {ast?.name}</span>
                            <span className="ml-auto font-bold text-orange-700">nhận {a.allocQty}</span>
                            <span className="w-full text-[11px] text-slate-500">
                              {ast?.province} • {ast?.distanceKm} km • khẩn cấp {aneed ? urgencyLabel(aneed.urgency) : '—'}
                            </span>
                          </div>
                        );
                      })}
                      {surplusPlan.unmet > 0 ? (
                        <div className="mt-1 font-semibold text-red-700">
                          Còn dôi {surplusPlan.unmet} — mọi trạm đã đầy, hãy giảm số lượng.
                        </div>
                      ) : (
                        <div className="mt-1 font-semibold text-green-700">
                          Vừa khít {surplusPlan.allocated}/{qty} — bấm Tiếp tục để tạo {surplusPlan.allocations.length} đơn
                          cùng hình thức ở bước sau.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <NavRow
            onBack={() => setStep(0)}
            onNext={() => setStep(2)}
            canNext={canNext2}
            nextLabel={over && canSplit ? `Tiếp tục với ${surplusPlan!.allocations.length} đơn` : 'Tiếp tục'}
          />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-2">
          <h2 className="font-bold">Chọn hình thức</h2>
          <div className="grid gap-2">
            <button onClick={() => setWizard({ method: 'self' })} className={`rounded-2xl border p-3 text-left ${method === 'self' ? 'border-orange-500 bg-orange-50' : 'bg-white'}`}>
              <div className="flex items-center gap-2 font-bold"><HandHeart className="h-5 w-5" /> Tự mang đến điểm tập kết</div>
              <div className="text-xs text-slate-500">Hiện địa chỉ, giờ nhận + sinh MÃ ĐƠN + MÃ QR để trạm quét.</div>
            </button>
            <button onClick={() => setWizard({ method: 'carrier' })} className={`rounded-2xl border p-3 text-left ${method === 'carrier' ? 'border-orange-500 bg-orange-50' : 'bg-white'}`}>
              <div className="flex items-center gap-2 font-bold"><Truck className="h-5 w-5" /> Đặt đơn vị vận chuyển</div>
              <div className="text-xs text-slate-500">Nhập địa chỉ lấy hàng, chọn đối tác, xem phí/ETA tham khảo.</div>
            </button>
            <button onClick={() => setWizard({ method: 'buy' })} className={`rounded-2xl border p-3 text-left ${method === 'buy' ? 'border-orange-500 bg-orange-50' : 'bg-white'}`}>
              <div className="flex items-center gap-2 font-bold"><ShoppingCart className="h-5 w-5" /> Mua trực tiếp từ nhà phân phối</div>
              <div className="text-xs text-slate-500">Giỏ hàng + thanh toán giả lập, giao thẳng đến trạm.</div>
            </button>
          </div>
          {method === 'carrier' && (
            <div className="rounded-2xl border bg-white p-3">
              <input placeholder="Địa chỉ lấy hàng của bạn" value={wizard.pickupAddress ?? ''} onChange={(e) => setWizard({ pickupAddress: e.target.value })}
                className="w-full rounded-lg border px-2 py-1.5 text-sm" />
              <div className="mt-2 grid gap-1">
                {carriers.map((c) => (
                  <button key={c.id} onClick={() => setWizard({ carrierId: c.id })}
                    className={`rounded-lg border px-2 py-1.5 text-left text-sm ${wizard.carrierId === c.id ? 'border-orange-500 bg-orange-50' : ''}`}>
                    <b>{c.name}</b> — {c.fee === 0 ? 'miễn phí' : formatVND(c.fee)} • {c.eta}
                  </button>
                ))}
              </div>
            </div>
          )}
          {method === 'buy' && (
            <div className="rounded-2xl border bg-white p-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold">Sản phẩm tương ứng ({itemId && itemById(itemId).name}):</div>
                <input value={pqBuy} onChange={(e) => setPqBuy(e.target.value)} placeholder="Tìm SP…"
                  className="ml-auto w-36 rounded-lg border px-2 py-1 text-xs" />
              </div>
              <div className="mt-2 grid gap-1">
                {products
                  .filter((p) => !itemId || p.itemId === itemId)
                  .filter((p) => {
                    const kw = pqBuy.trim().toLowerCase();
                    return !kw || `${p.name} ${p.promo ?? ''} ${p.variant ?? ''}`.toLowerCase().includes(kw);
                  })
                  .map((p) => {
                    const out = p.stock <= 0;
                    return (
                      <button key={p.id} disabled={out} title={out ? 'Sản phẩm đã hết hàng' : 'Chọn sản phẩm'}
                        onClick={() => setWizard({ productId: p.id })}
                        className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-sm disabled:cursor-not-allowed disabled:opacity-40 ${wizard.productId === p.id ? 'border-orange-500 bg-orange-50' : ''}`}>
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} onError={(ev) => { (ev.target as HTMLImageElement).style.display = 'none'; }}
                            className="h-8 w-8 shrink-0 rounded-lg border object-cover" />
                        ) : (
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-800"><ItemIcon icon={itemById(p.itemId).icon} /></span>
                        )}
                        <span>
                          <b>{p.name}</b> — {formatVND(p.price)} • {out ? 'hết hàng' : `tồn ${p.stock}`}
                          {p.variant ? ` • ${p.variant}` : ''}{p.promo ? ` • ${p.promo}` : ''}
                        </span>
                      </button>
                    );
                  })}
              </div>
              <div className="mt-2 text-sm font-semibold">Thanh toán giả lập (bấm là thành công):</div>
              <div className="mt-1 grid grid-cols-3 gap-1">
                {PAY_METHODS.map((m) => (
                  <button key={m.id} onClick={() => setWizard({ payMethod: m.id })}
                    className={`rounded-lg border px-2 py-1.5 text-xs font-semibold ${wizard.payMethod === m.id ? 'border-orange-500 bg-orange-50' : ''}`}>
                    {m.label}
                  </button>
                ))}
              </div>
              <div className="mt-2 rounded-xl bg-slate-50 p-2">
                <div className="flex items-center gap-1 text-xs font-bold">
                  <MessageCircle className="h-3.5 w-3.5" /> Nhắn NPP tư vấn (demo, chung với gian hàng)
                </div>
                <div className="mt-1 max-h-32 space-y-1 overflow-y-auto text-xs">
                  {messages.map((m) => {
                    const mine = m.fromRole !== 'distributor';
                    return (
                      <div key={m.id} className={`max-w-[90%] rounded-lg px-2 py-1 ${mine ? 'ml-auto bg-orange-500 text-white' : 'bg-white shadow-sm'}`}>
                        {!mine && <div className="text-[10px] font-bold text-slate-400">{m.fromName}</div>}
                        {m.text}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-1 flex gap-1">
                  <input value={msgDraft} onChange={(e) => setMsgDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { sendMessage(msgDraft); setMsgDraft(''); } }}
                    placeholder="Hỏi NPP về sản phẩm…" className="w-full rounded-lg border px-2 py-1 text-xs" />
                  <button onClick={() => { sendMessage(msgDraft); setMsgDraft(''); }}
                    className="shrink-0 rounded-lg bg-blue-800 px-2.5 py-1 text-xs font-bold text-white">Gửi</button>
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="rounded-xl border px-4 py-2 text-sm font-bold">Quay lại</button>
            <button onClick={submit} disabled={!canNext3} title={!canNext3 ? 'Chọn đủ thông tin hình thức' : ''}
              className="flex-1 rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">
              {offline ? 'Lưu offline' : 'Xác nhận & hoàn tất'} ({qty} {itemId && itemById(itemId).unit}{over && canSplit ? ` → ${surplusPlan!.allocations.length} đơn` : ''})
            </button>
          </div>
        </div>
      )}

      {step === 3 && !doneOrders && (
        <div className="text-sm">Đang xử lý… <button className="underline" onClick={() => navigate('/')}>Về trang chủ</button></div>
      )}
    </div>
  );
}

function NavRow({ onBack, onNext, canNext, nextLabel }: { onBack: (() => void) | null; onNext: () => void; canNext: boolean; nextLabel: string }) {
  return (
    <div className="mt-3 flex gap-2">
      {onBack && <button onClick={onBack} className="rounded-xl border px-4 py-2 text-sm font-bold">Quay lại</button>}
      <button onClick={onNext} disabled={!canNext} className="flex-1 rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">
        {nextLabel}
      </button>
    </div>
  );
}
