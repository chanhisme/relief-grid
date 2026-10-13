import { progressSegments } from '../../lib/needLogic';
import type { StationNeed } from '../../types/models';

export function ProgressBar3({ need, showLegend = true }: { need: StationNeed; showLegend?: boolean }) {
  const seg = progressSegments(need);
  const s = Math.max(0, need.D - need.R - need.T);
  return (
    <div>
      <div
        className="flex h-3 w-full overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-label={`Đã nhận ${need.R}, đang giao ${need.T}, nhu cầu ${need.D}`}
      >
        <div className="h-full bg-green-600" style={{ width: `${seg.r}%` }} title={`Đã nhận: ${need.R}`} />
        <div
          className="progress-stripes h-full bg-blue-400"
          style={{ width: `${seg.t}%` }}
          title={`Đang giao: ${need.T}`}
        />
        <div className="h-full bg-slate-200" style={{ width: `${seg.rest}%` }} />
      </div>
      {showLegend && (
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-600">
          <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-green-600" />Đã nhận: {need.R}</span>
          <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-blue-400" />Đang giao: {need.T}</span>
          <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-slate-300" />Còn thiếu: {s}</span>
        </div>
      )}
    </div>
  );
}
