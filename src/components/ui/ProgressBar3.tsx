import { progressSegments } from '../../lib/needLogic';
import type { StationNeed } from '../../types/models';

export function ProgressBar3({ need, showLegend = true }: { need: StationNeed; showLegend?: boolean }) {
  const seg = progressSegments(need);
  return (
    <div>
      <div
        className="flex h-3 w-full overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-label={`Đã nhận ${need.R}, đang giao ${need.T}, nhu cầu ${need.D}`}
      >
        <div className="h-full bg-green-600" style={{ width: `${seg.r}%` }} title={`Đã nhận R=${need.R}`} />
        <div
          className="progress-stripes h-full bg-blue-400"
          style={{ width: `${seg.t}%` }}
          title={`Đang vận chuyển T=${need.T}`}
        />
        <div className="h-full bg-slate-200" style={{ width: `${seg.rest}%` }} />
      </div>
      {showLegend && (
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-600">
          <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-green-600" />R đã nhận: {need.R}</span>
          <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-blue-400" />T đang giao: {need.T}</span>
          <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-slate-300" />Còn thiếu S</span>
        </div>
      )}
    </div>
  );
}
