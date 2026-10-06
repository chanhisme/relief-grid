import { Link, useParams } from 'react-router-dom';
import { MapPin, Clock, Flag } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { VerifiedBadge } from '../components/ui/Badges';
import { MaskedPhone } from '../components/ui/MaskedPhone';
import { NeedItem } from '../components/station/NeedItem';
import { VietnamBase } from '../components/home/VietnamMap';
import { project } from '../lib/geo';
import { NEW_FEATURE_NAME } from '../data/provinces';
import { calcS } from '../lib/needLogic';

export function StationDetailPage() {
  const { id } = useParams();
  const st = useAppStore((s) => s.stations.find((x) => x.id === id));
  const pushToast = useAppStore((s) => s.pushToast);

  if (!st) return <div className="py-10">Không tìm thấy trạm. <Link to="/" className="text-blue-700 underline">Về trang chủ</Link></div>;

  const totalR = st.needs.reduce((a, n) => a + n.R, 0);
  const totalS = st.needs.reduce((a, n) => a + calcS(n), 0);

  return (
    <div className="space-y-4 py-6">
      <Link to="/" className="text-sm text-blue-700">← Về bản đồ</Link>
      <div className="grid gap-4 md:grid-cols-[1fr_220px]">
        <div className="rounded-3xl border bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <VerifiedBadge verified={st.verified} />
          <span className="text-xs text-slate-500">{st.distanceKm} km từ TP.HCM</span>
        </div>
        <h1 className="mt-2 text-xl font-extrabold text-blue-950 md:text-2xl">{st.name}</h1>
        <div className="mt-1 text-sm text-slate-600">Đơn vị: {st.org} • Liên hệ: {st.contact}</div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-700">
          <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{st.address}</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" />{st.pickupHours}</span>
          <span>SĐT: <MaskedPhone phone={st.phone} /></span>
        </div>
        {st.provinceOld !== st.province && (
          <div className="mt-1 text-xs text-slate-500">Địa chỉ cũ (trước sáp nhập): {st.address.replace(st.province, st.provinceOld)}</div>
        )}
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-green-50 p-2"><div className="text-lg font-extrabold text-green-800">{totalR}</div><div className="text-[11px]">đã nhận</div></div>
          <div className="rounded-xl bg-orange-50 p-2"><div className="text-lg font-extrabold text-orange-700">{totalS}</div><div className="text-[11px]">đang thiếu</div></div>
          <div className="rounded-xl bg-blue-50 p-2"><div className="text-lg font-extrabold text-blue-800">{st.servedAreas.length}</div><div className="text-[11px]">khu vực đã hỗ trợ</div></div>
        </div>
        </div>
        <div className="rounded-2xl border bg-white p-3">
          <div className="text-xs font-semibold text-slate-600">Bản đồ vị trí (sau sáp nhập · 34)</div>
          <VietnamBase
            era="new"
            highlightNames={new Set([NEW_FEATURE_NAME[st.province] ?? st.province])}
            showReadout={false}
            className="mt-1 h-36 w-full"
          >
            {(() => {
              const [x, y] = project(st.lat, st.lng);
              return <circle cx={x} cy={y} r={2} fill="#dc2626" stroke="#fff" strokeWidth={0.5} />;
            })()}
          </VietnamBase>
          <div className="mt-1 text-[11px] text-slate-500">{st.address}</div>
          {st.provinceOld !== st.province && (
            <div className="text-[11px] text-slate-400">Địa chỉ cũ: {st.address.replace(st.province, st.provinceOld)}</div>
          )}
        </div>
      </div>

      <h2 className="text-lg font-extrabold text-blue-950">Nhu cầu từng mặt hàng</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {st.needs.map((n) => <NeedItem key={n.itemId} stationId={st.id} need={n} />)}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4">
          <h3 className="font-bold">Cập nhật mới nhất</h3>
          {st.proofs.length === 0 ? <p className="text-sm text-slate-500">Chưa có minh chứng.</p> :
            st.proofs.map((p) => (
              <div key={p.id} className="mt-2 rounded-xl bg-slate-50 p-2 text-sm">
                <div className="ds-media mx-auto grid h-20 w-full place-items-center rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 text-xs text-slate-500">
                  {p.imageLabel}
                </div>
                <div className="mt-1 font-semibold">{p.title}</div>
                <div className="text-xs text-slate-500">{p.date}</div>
              </div>
            ))}
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <h3 className="font-bold">Khu vực đã hỗ trợ & minh bạch</h3>
          <p className="mt-1 text-sm text-slate-600">Để trạm khác tránh trùng: {st.servedAreas.join(', ') || '—'}</p>
          <p className="mt-1 text-sm">Tổng lượt quyên góp: <b>{st.totalDonations}</b> • Đơn thành công: <b>{st.successOrders}</b></p>
          <div className="mt-2 flex gap-2">
            <button onClick={() => pushToast('Đã ghi nhận báo cáo, cảm ơn bạn!', 'info')} className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold">
              <Flag className="h-3.5 w-3.5" /> Báo cáo sai lệch
            </button>
            <button onClick={() => pushToast('Đã gửi liên hệ tới trạm (không lộ SĐT).', 'success')} className="rounded-lg bg-blue-800 px-2 py-1 text-xs font-semibold text-white">
              Liên hệ nhanh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
