import { useAppStore } from '../../store/useAppStore';
import { maskPhone } from '../../lib/format';

export function MaskedPhone({ phone, compact = false }: { phone: string; compact?: boolean }) {
  const isLoggedIn = useAppStore((s) => s.isLoggedIn);
  const revealed = useAppStore((s) => s.phoneRevealed);
  const grantPhone = useAppStore((s) => s.grantPhone);
  const quickLogin = useAppStore((s) => s.quickLogin);

  if (isLoggedIn && revealed) {
    return <span className="font-mono font-semibold">{phone}</span>;
  }
  return (
    <span className={`inline-flex items-center gap-2 ${compact ? 'text-sm' : ''}`}>
      <span className="font-mono">{maskPhone(phone)}</span>
      <button
        className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
        onClick={() => (isLoggedIn ? grantPhone() : quickLogin('donor'))}
        title={isLoggedIn ? 'Hiện số đầy đủ' : 'Cần đăng nhập để hiện số'}
      >
        Hiện số
      </button>
    </span>
  );
}
