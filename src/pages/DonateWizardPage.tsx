import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { QrCode, Truck, ShoppingCart, HandHeart, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { ITEMS, itemById } from '../data/items';
import { ItemIcon } from '../components/ui/ItemIcon';
import { ProgressBar3 } from '../components/ui/ProgressBar3';
import { calcS } from '../lib/needLogic';
import { rankStationsForItem, scoreStation, alternativesForItem } from '../lib/suggest';
import { formatVND } from '../lib/format';
import type { DonateMethod } from '../types/models';

const STEPS = ['Hỗ trợ gì?', 'Chọn trạm & số lượng', 'Hình thức', 'Xác nhận'];

export function DonateWizardPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const stations = useAppStore((s) => s.stations);
  const products = useAppStore((s) => s.products);
  const carriers = useAppStore((s) => s.carriers);
  const wizard = useAppStore((s) => s.wizard);
  const setWizard = useAppStore((s) => s.setWizard);
  const createOrder = useAppStore((s) => s.createOrder);
  const pushToast = useAppStore((s) => s.pushToast);

  const [step, setStep] = useState(wizard.itemId || params.get('item') ? 1 : 0);
  const [qtyText, setQtyText] = useState(wizard.qty ? String(wizard.qty) : '');
  const [doneCode, setDoneCode] = useState<string | null>(null);

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

  const surplusAlts = useMemo(() => {
    if (!itemId || !stationId || !over) return [];
    return alternativesForItem(stations, itemId, stationId, 3);
  }, [stations, itemId, stationId, over]);

  const canNext1 = !!itemId;
  const canNext2 = !!stationId && qty > 0 && !over && S > 0;
  const canNext3 = !!method && (method !== 'carrier' || wizard.carrierId) && (method !== 'buy' || wizard.productId);

  function submit() {
    if (!stationId || !itemId || !method || qty <= 0 || over) return;
    const o = createOrder({
      stationId, itemId, qty, method,
      carrierId: method === 'carrier' ? wizard.carrierId : undefined,
      productId: method === 'buy' ? wizard.productId : undefined,
    });
    setDoneCode(o.code);
    setStep(3);
  }

  if (doneCode) {
    const st = stations.find((x) => x.id === stationId);
    return (
      <div className="mx-auto max-w-xl space-y-4 py-10 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-green-600" />
        <h1 className="text-2xl font-extrabold text-blue-950">Quyên góp thành công!</h1>
        <p className="text-sm text-slate-600">
          Đơn <b>{doneCode}</b> — {qty} {itemId && itemById(itemId).unit} {itemId && itemById(itemId).name} tới {st?.name}.
          T đã tăng ngay, thanh tiến độ đã cập nhật (S giảm).
        </p>
        {method === 'self' && (
          <div className="mx-auto grid h-40 w-40 place-items-center rounded-2xl border-2 border-dashed bg-white">
            <div className="text-center"><QrCode className="mx-auto h-10 w-10" /><div className="mt-1 font-mono text-sm font-bold">{doneCode}</div><div className="text-[11px] text-slate-500">Trạm quét để xác nhận</div></div>
          </div>
        )}
        <div className="flex justify-center gap-2">
          <Link to="/quyen-gop-cua-toi" className="rounded-xl bg-blue-800 px-4 py-2 text-sm font-bold text-white">Xem đơn của tôi</Link>
          <Link to={stationId ? `/tram/${stationId}` : '/'} className="rounded-xl border px-4 py-2 text-sm font-bold">Xem trạm cập nhật</Link>
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
                  Trạm chỉ còn thiếu {S}. Phần dư {qty - S} — chuyển sang trạm khác đang thiếu {itemId && itemById(itemId).name} nhé (đỡ tiếc của đã mua):
                  {surplusAlts.map((a) => (
                    <button key={a.id} onClick={() => { setWizard({ stationId: a.id }); setQtyText(String(qty - S)); pushToast(`Đã chuyển phần dư sang ${a.name}`, 'info'); }}
                      className="mt-1 block w-full rounded-lg border bg-white px-2 py-1 text-left hover:border-orange-400">
                      <b>{a.name}</b> — thiếu {calcS(a.needs.find((n) => n.itemId === itemId)!)} • {a.province}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <NavRow onBack={() => setStep(0)} onNext={() => setStep(2)} canNext={canNext2} nextLabel="Tiếp tục" />
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
              <div className="text-sm font-semibold">Sản phẩm tương ứng ({itemId && itemById(itemId).name}):</div>
              <div className="mt-2 grid gap-1">
                {products.filter((p) => !itemId || p.itemId === itemId).map((p) => (
                  <button key={p.id} onClick={() => setWizard({ productId: p.id })}
                    className={`rounded-lg border px-2 py-1.5 text-left text-sm ${wizard.productId === p.id ? 'border-orange-500 bg-orange-50' : ''}`}>
                    <b>{p.name}</b> — {formatVND(p.price)} • tồn {p.stock}{p.promo ? ` • ${p.promo}` : ''}
                  </button>
                ))}
              </div>
              <div className="mt-2 text-xs text-slate-500">Thanh toán giả lập: Momo / ZaloPay / ngân hàng — bấm là thành công.</div>
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="rounded-xl border px-4 py-2 text-sm font-bold">Quay lại</button>
            <button onClick={submit} disabled={!canNext3} title={!canNext3 ? 'Chọn đủ thông tin hình thức' : ''}
              className="flex-1 rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">
              Xác nhận & hoàn tất ({qty} {itemId && itemById(itemId).unit})
            </button>
          </div>
        </div>
      )}

      {step === 3 && !doneCode && (
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
