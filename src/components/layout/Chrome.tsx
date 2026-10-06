import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HeartHandshake, WifiOff, Leaf, Menu, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { HERO_STATS } from '../../data/extras';

const NAV: { to: string; label: string; adminOnly?: boolean }[] = [
  { to: '/', label: 'Hiện trạng' },
  { to: '/quyen-gop', label: 'Quyên góp' },
  { to: '/nha-phan-phoi', label: 'Mua sắm' },
  { to: '/thong-ke', label: 'Thống kê' },
  { to: '/quyen-gop-cua-toi', label: 'Đơn của tôi' },
  { to: '/tram-quan-ly', label: 'Trạm quản lý' },
  { to: '/van-chuyen', label: 'Vận chuyển' },
  { to: '/admin/xac-minh', label: 'Admin', adminOnly: true },
];

/** Link nav: mục admin chỉ hiện với admin, còn lại bỏ hẳn */
function visibleNav(userRole: string | null) {
  return NAV.filter((n) => !n.adminOnly || userRole === 'admin');
}

export function Header() {
  const dataSaver = useAppStore((s) => s.dataSaver);
  const toggleDataSaver = useAppStore((s) => s.toggleDataSaver);
  const offline = useAppStore((s) => s.offline);
  const toggleOffline = useAppStore((s) => s.toggleOffline);
  const isLoggedIn = useAppStore((s) => s.isLoggedIn);
  const userRole = useAppStore((s) => s.userRole);
  const logout = useAppStore((s) => s.logout);
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-extrabold text-blue-900">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-800 text-white">
            <HeartHandshake className="h-5 w-5" />
          </span>
          <span className="leading-tight">
            ReliefGrid
            <span className="block text-[11px] font-medium text-slate-500">Trạm cứu trợ số</span>
          </span>
        </Link>
        <nav className="ml-2 hidden items-center gap-4 text-sm font-medium text-slate-700 lg:flex">
          {visibleNav(userRole).map((n) => (
            <Link key={n.to} to={n.to} className="hover:text-blue-800">{n.label}</Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1.5 text-xs sm:gap-2">
          <button
            onClick={() => setOpen((v) => !v)}
            className="grid h-8 w-8 place-items-center rounded-full border text-slate-700 lg:hidden"
            aria-label="Mở menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <button
            onClick={toggleOffline}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 font-semibold ${offline ? 'border-red-300 bg-red-50 text-red-700' : 'text-slate-600'}`}
            title="Demo chế độ offline"
          >
            <WifiOff className="h-3.5 w-3.5" /> {offline ? 'Offline (demo)' : 'Online'}
          </button>
          <button
            onClick={toggleDataSaver}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 font-semibold ${dataSaver ? 'border-green-300 bg-green-50 text-green-700' : 'text-slate-600'}`}
            title="Bật thì ẩn ảnh, giảm hiệu ứng"
          >
            <Leaf className="h-3.5 w-3.5" /> Tiết kiệm DL {dataSaver ? 'Bật' : 'Tắt'}
          </button>
          {isLoggedIn ? (
            <button onClick={logout} className="rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-700">
              Thoát ({userRole})
            </button>
          ) : (
            <Link
              to="/dang-nhap"
              className="rounded-full bg-blue-800 px-3 py-1.5 font-semibold text-white hover:bg-blue-900"
            >
              Đăng nhập / Đăng ký
            </Link>
          )}
        </div>
      </div>
      {offline && (
        <div className="bg-amber-100 px-4 py-1.5 text-center text-xs font-medium text-amber-900">
          Bạn đang offline, dữ liệu sẽ đồng bộ khi có mạng (demo).
        </div>
      )}
      {open && (
        <nav className="grid gap-1 border-t bg-white px-4 py-2 text-sm font-medium lg:hidden">
          {visibleNav(userRole).map((n) => (
            <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="rounded-lg px-2 py-2 hover:bg-slate-100">
              {n.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

export function StatusBar() {
  return (
    <div className="grid grid-cols-3 gap-2 rounded-2xl bg-blue-900 p-4 text-center text-white">
      <div><div className="text-xl font-extrabold md:text-2xl">{HERO_STATS.stations}</div><div className="text-[11px] md:text-xs opacity-80">trạm đang hoạt động</div></div>
      <div><div className="text-xl font-extrabold md:text-2xl">{HERO_STATS.needs}</div><div className="text-[11px] md:text-xs opacity-80">nhu cầu cần hỗ trợ</div></div>
      <div><div className="text-xl font-extrabold md:text-2xl">{HERO_STATS.missing.toLocaleString('vi-VN')}</div><div className="text-[11px] md:text-xs opacity-80">vật phẩm còn thiếu</div></div>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="mt-12 border-t bg-white">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-sm text-slate-600 md:grid-cols-3">
        <div>
          <div className="font-bold text-blue-900">ReliefGrid — Đừng để lòng tốt bị lãng phí</div>
          <p className="mt-1">Demo giao diện thi AISC'26. Không backend, dữ liệu mock, reload sẽ reset.</p>
        </div>
        <div>
          <div className="font-semibold">Liên hệ demo</div>
          <p>Email: hotro@reliefgrid.vn • Hotline: 1900 xxxx</p>
        </div>
        <div>
          <div className="font-semibold">Khám phá</div>
          <p className="mt-1 space-x-3">
            <Link to="/nha-phan-phoi" className="hover:text-blue-800">Mua sắm</Link>
            <Link to="/thong-ke" className="hover:text-blue-800">Thống kê</Link>
            <Link to="/van-chuyen" className="hover:text-blue-800">Vận chuyển</Link>
            <Link to="/tram-quan-ly" className="hover:text-blue-800">Trạm quản lý</Link>
          </p>
        </div>
        <div>
          <div className="font-semibold">Ghi chú</div>
          <p>S = max(0, D − R − T). S = 0 thì khóa quyên góp.</p>
        </div>
      </div>
    </footer>
  );
}

export function Toasts() {
  const toasts = useAppStore((s) => s.toasts);
  const dismiss = useAppStore((s) => s.dismissToast);
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex flex-col gap-2 sm:left-auto sm:w-80 sm:right-4">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={`rounded-xl px-3 py-2 text-left text-sm font-medium shadow-lg ${
            t.kind === 'success' ? 'bg-green-700 text-white' : t.kind === 'warn' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'
          }`}
        >
          {t.msg}
        </button>
      ))}
    </div>
  );
}
