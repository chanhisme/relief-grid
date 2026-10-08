import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, HandHeart, Store, Zap } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { checkDevCode } from '../config/dev';
import type { Role } from '../types/models';

const ROLES: { id: Exclude<Role, null>; title: string; desc: string; icon: typeof Building2 }[] = [
  { id: 'station', title: 'Trạm cứu trợ', desc: 'Cập nhật nhu cầu, duyệt đơn, xác nhận hàng đến', icon: Building2 },
  { id: 'donor', title: 'Cá nhân quyên góp', desc: 'Chọn đúng món đang thiếu, theo dõi đơn', icon: HandHeart },
  { id: 'distributor', title: 'Nhà phân phối', desc: 'Bán hàng cứu trợ, giao thẳng trạm', icon: Store },
];

const QUICK_LABEL: Record<string, string> = {
  station: 'Trạm',
  donor: 'Người quyên góp',
  distributor: 'Nhà phân phối',
};

export function AuthPage() {
  const navigate = useNavigate();
  const isLoggedIn = useAppStore((s) => s.isLoggedIn);
  const userRole = useAppStore((s) => s.userRole);
  const userName = useAppStore((s) => s.userName);
  const verifyStatus = useAppStore((s) => s.verifyStatus);
  const quickLogin = useAppStore((s) => s.quickLogin);
  const registerDemo = useAppStore((s) => s.registerDemo);
  const logout = useAppStore((s) => s.logout);

  const [role, setRole] = useState<Exclude<Role, null>>('donor');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [proof, setProof] = useState('');
  const [params] = useSearchParams();
  const devChecked = useRef(false);

  // Cổng admin nội bộ (giấu kín): /dang-nhap?dev=<MÃ> -> login admin.
  // Sai/thiếu mã: trang hiện y hệt bình thường, không dấu vết.
  useEffect(() => {
    if (devChecked.current) return;
    devChecked.current = true;
    const code = params.get('dev');
    if (code && checkDevCode(code)) {
      quickLogin('admin');
      navigate('/admin/xac-minh', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    registerDemo(role, name.trim() || `Tài khoản ${role} (demo)`, proof.trim(), phone.trim());
    navigate(role === 'station' ? '/tram-quan-ly' : '/');
  }

  if (isLoggedIn) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-10 text-center">
        <h1 className="text-xl font-extrabold text-blue-950">Đã đăng nhập demo</h1>
        <p className="text-sm text-slate-600">
          {userName} • vai trò <b>{userRole}</b>
          {(userRole === 'station' || userRole === 'distributor') && verifyStatus === 'pending' && (
            <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-bold text-yellow-800">Chờ admin duyệt</span>
          )}
          {(userRole === 'station' || userRole === 'distributor') && verifyStatus === 'verified' && (
            <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-800">Đã duyệt (demo)</span>
          )}
        </p>
        <div className="flex justify-center gap-2">
          {userRole === 'station' && (
            <Link to="/tram-quan-ly" className="rounded-xl bg-blue-800 px-4 py-2 text-sm font-bold text-white">Vào dashboard trạm</Link>
          )}
          {userRole === 'distributor' && (
            <Link to="/nha-phan-phoi" className="rounded-xl bg-blue-800 px-4 py-2 text-sm font-bold text-white">Vào gian hàng NPP</Link>
          )}
          <button onClick={logout} className="rounded-xl border px-4 py-2 text-sm font-bold">Đăng xuất</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 py-6">
      <h1 className="text-xl font-extrabold text-blue-950">Đăng ký / Đăng nhập</h1>
      <p className="text-sm text-slate-600">Chọn 1 trong 3 vai trò. Trạm và Nhà phân phối cần admin duyệt sau khi đăng ký.</p>

      <div className="grid gap-2 sm:grid-cols-3">
        {ROLES.map((r) => (
          <button
            key={r.id}
            onClick={() => setRole(r.id)}
            className={`rounded-2xl border p-3 text-left ${role === r.id ? 'border-blue-700 bg-blue-50 ring-1 ring-blue-600' : 'bg-white'}`}
          >
            <r.icon className="h-5 w-5 text-blue-800" />
            <div className="mt-1 text-sm font-bold">{r.title}</div>
            <div className="text-xs text-slate-500">{r.desc}</div>
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-2 rounded-2xl border bg-white p-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-sm font-semibold">Tên hiển thị
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Trạm Con Cuông" className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm font-normal" />
          </label>
          <label className="text-sm font-semibold">Số điện thoại
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xx xxx xxx" className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm font-normal" />
          </label>
        </div>
        {role === 'station' && (
          <label className="block text-sm font-semibold">Minh chứng pháp lý / xác nhận địa phương
            <input value={proof} onChange={(e) => setProof(e.target.value)} placeholder="VD: Công văn UBND xã số 12/CV-UBND" className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm font-normal" />
            <span className="mt-1 block text-xs font-normal text-slate-500">Demo: nhập text thay vì upload file. Sau khi gửi, tài khoản ở trạng thái “Chờ admin duyệt”.</span>
          </label>
        )}
        {role === 'distributor' && (
          <label className="block text-sm font-semibold">Giấy phép kinh doanh / minh chứng
            <input value={proof} onChange={(e) => setProof(e.target.value)} placeholder="VD: GPKD số 0101234567" className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm font-normal" />
            <span className="mt-1 block text-xs font-normal text-slate-500">Demo: nhập text thay vì upload file. Sau khi gửi, tài khoản ở trạng thái “Chờ admin duyệt”.</span>
          </label>
        )}
        <button className="w-full rounded-xl bg-blue-800 px-4 py-2 text-sm font-bold text-white">
          Đăng ký vai trò {ROLES.find((r) => r.id === role)?.title}
        </button>
      </form>

      <div className="rounded-2xl border border-dashed bg-slate-50 p-4">
        <div className="flex items-center gap-1 text-sm font-bold"><Zap className="h-4 w-4" /> Đăng nhập nhanh demo (để trình diễn)</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {(Object.keys({ station: 1, donor: 1, distributor: 1 }) as Exclude<Role, null>[]).map((r) => (
            <button
              key={r}
              onClick={() => { quickLogin(r); navigate(r === 'station' ? '/tram-quan-ly' : '/'); }}
              className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white"
            >
              Vào ngay: {QUICK_LABEL[r] ?? r}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
