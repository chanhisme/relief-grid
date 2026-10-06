import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { StatusBar } from '../components/layout/Chrome';
import { StationMap } from '../components/home/StationMap';
import { StationCard } from '../components/station/StationCard';
import { ITEMS, itemById } from '../data/items';
import { PROVINCES_NEW } from '../data/provinces';
import { calcS } from '../lib/needLogic';

const PROVINCES = PROVINCES_NEW;

export function HomePage() {
  const stations = useAppStore((s) => s.stations);
  const filters = useAppStore((s) => s.filters);
  const setFilters = useAppStore((s) => s.setFilters);
  const [selected, setSelected] = useState<string | undefined>(undefined);

  const filtered = useMemo(() => {
    const kw = filters.keyword.trim().toLowerCase();
    return stations.filter((st) => {
      if (filters.province !== 'all' && st.province !== filters.province) return false;
      if (st.distanceKm > filters.maxKm) return false;
      if (filters.itemId !== 'all') {
        const n = st.needs.find((x) => x.itemId === filters.itemId);
        if (!n || calcS(n) <= 0) return false;
      }
      if (filters.urgency !== 'all' && !st.needs.some((n) => n.urgency === filters.urgency && calcS(n) > 0)) return false;
      if (kw) {
        const hay = `${st.name} ${st.address} ${st.province} ${st.provinceOld} ${st.needs.map((n) => itemById(n.itemId).name).join(' ')}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  }, [stations, filters]);

  const urgentToday = useMemo(() => {
    const rows: { sid: string; sname: string; prov: string; itemId: string; s: number; d: number; urg: string }[] = [];
    for (const st of stations) {
      for (const n of st.needs) {
        const s = calcS(n);
        if (s > 0 && (n.urgency === 'critical' || n.urgency === 'high')) {
          rows.push({ sid: st.id, sname: st.name, prov: st.province, itemId: n.itemId, s, d: n.D, urg: n.urgency });
        }
      }
    }
    return rows.sort((a, b) => b.s - a.s).slice(0, 6);
  }, [stations]);

  return (
    <div className="space-y-6 py-6">
      {/* Hero */}
      <section className="grid gap-4 rounded-3xl bg-gradient-to-r from-blue-900 to-blue-700 p-6 text-white md:grid-cols-2 md:p-8">
        <div>
          <h1 className="text-2xl font-extrabold leading-tight md:text-4xl">Đừng để lòng tốt bị lãng phí</h1>
          <p className="mt-2 text-sm text-blue-100 md:text-base">
            Trạm cập nhật nhu cầu theo từng mặt hàng — bạn chọn đúng thứ đang thiếu. Đủ hàng là hệ thống tự khóa.
          </p>
          <div className="mt-4 flex gap-2">
            <Link to="/quyen-gop" className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-600">
              Quyên góp ngay
            </Link>
            <a href="#map" className="rounded-xl bg-white/15 px-5 py-2.5 text-sm font-bold hover:bg-white/25">Xem bản đồ</a>
          </div>
        </div>
        <StatusBar />
      </section>

      {/* Search */}
      <div className="flex items-center gap-2 rounded-2xl border-2 border-[#e71d36] bg-white px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-[#e71d36]/30">
        <Search className="h-5 w-5 shrink-0 text-[#e71d36]" />
        <input
          value={filters.keyword}
          onChange={(e) => setFilters({ keyword: e.target.value })}
          placeholder="Nhập tỉnh thành… (VD: Quảng Trị, Huế, Quảng Bình)"
          aria-label="Tìm theo tỉnh thành"
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
        {filters.keyword && (
          <button onClick={() => setFilters({ keyword: '' })} className="shrink-0 rounded-full bg-[#e71d36] px-3 py-1 text-xs font-bold text-white hover:brightness-110">
            Xóa
          </button>
        )}
      </div>

      {/* Map + filter */}
      <section id="map" className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <StationMap stations={filtered} selectedId={selected} onSelect={setSelected} />
        <div className="space-y-3 rounded-2xl border bg-white p-4">
          <div className="font-bold">Bộ lọc</div>
          <label className="block text-xs font-semibold text-slate-600">Tỉnh/thành
            <select value={filters.province} onChange={(e) => setFilters({ province: e.target.value })} className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm">
              <option value="all">Tất cả</option>
              {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-600">Loại hàng
            <select value={filters.itemId} onChange={(e) => setFilters({ itemId: e.target.value })} className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm">
              <option value="all">Tất cả</option>
              {ITEMS.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-600">Mức khẩn cấp
            <select value={filters.urgency} onChange={(e) => setFilters({ urgency: e.target.value })} className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm">
              <option value="all">Tất cả</option>
              <option value="critical">Rất khẩn cấp</option>
              <option value="high">Cao</option>
              <option value="medium">Trung bình</option>
              <option value="low">Thấp</option>
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-600">Khoảng cách tối đa: {filters.maxKm} km
            <input type="range" min={800} max={2000} step={50} value={filters.maxKm} onChange={(e) => setFilters({ maxKm: Number(e.target.value) })} className="w-full" />
          </label>
          <div className="text-xs text-slate-500">Tìm thấy {filtered.length} trạm</div>
        </div>
      </section>

      {/* Urgent today */}
      <section>
        <h2 className="mb-2 text-lg font-extrabold text-blue-950">Nhu cầu khẩn cấp hôm nay</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {urgentToday.map((r, i) => (
            <Link key={i} to={`/tram/${r.sid}`} className="rounded-2xl border bg-white p-3 shadow-sm hover:border-orange-400">
              <div className="text-xs text-slate-500">{r.sname} • {r.prov}</div>
              <div className="text-sm font-bold">{itemById(r.itemId).name}</div>
              <div className="text-sm">còn thiếu <b className="text-orange-700">{r.s}/{r.d} {itemById(r.itemId).unit}</b></div>
            </Link>
          ))}
        </div>
      </section>

      {/* Station list */}
      <section>
        <h2 className="mb-2 text-lg font-extrabold text-blue-950">Tất cả trạm ({filtered.length})</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((st) => <StationCard key={st.id} station={st} compact />)}
        </div>
      </section>

      {/* How it works */}
      <section className="rounded-3xl bg-white p-6">
        <h2 className="text-lg font-extrabold text-blue-950">Cách hoạt động</h2>
        <ol className="mt-3 grid gap-3 text-sm md:grid-cols-4">
          {['Trạm cập nhật nhu cầu', 'Bạn chọn đúng món cần', 'Hàng được giao / kiểm kê', 'Trạm đăng ảnh minh chứng'].map((t, i) => (
            <li key={i} className="rounded-2xl bg-slate-50 p-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-800 text-sm font-bold text-white">{i + 1}</div>
              <div className="mt-2 font-semibold">{t}</div>
            </li>
          ))}
        </ol>
        <Link to="/quyen-gop" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-orange-600">
          Bắt đầu quyên góp <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
