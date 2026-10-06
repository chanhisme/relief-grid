import { urgencyLabel, statusLabel } from '../../lib/format';
import type { Urgency, NeedStatus } from '../../types/models';

const urgencyColor: Record<Urgency, string> = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-700',
};

export function UrgencyBadge({ level }: { level: Urgency }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${urgencyColor[level]}`}>
      {urgencyLabel(level)}
    </span>
  );
}

const statusColor: Record<NeedStatus, string> = {
  open: 'bg-blue-100 text-blue-800',
  partial: 'bg-yellow-100 text-yellow-800',
  fulfilled: 'bg-green-100 text-green-800',
  closed: 'bg-slate-200 text-slate-600',
};

export function NeedStatusBadge({ status }: { status: NeedStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor[status]}`}>
      {statusLabel(status)}
    </span>
  );
}

export function VerifiedBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
      ✓ Đã xác minh
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800">
      ⏳ Chờ xác minh
    </span>
  );
}
