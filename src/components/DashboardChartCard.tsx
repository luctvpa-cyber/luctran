import { BarChart2, Layers, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import type {
  CustomWorkspaceTab,
  HorizonBucket,
  MaintenanceStatus,
  SubsystemBreakdown,
  SubsystemType,
} from '../types/maintenance';

type ChartMode = 'stacked' | 'grouped' | 'horizon';

interface DashboardChartCardProps {
  breakdowns: SubsystemBreakdown[];
  horizonBuckets: HorizonBucket[];
  activeStatusFilter: MaintenanceStatus | '';
  onToggleStatusFilter: (status: MaintenanceStatus | '') => void;
  onSelectSubsystem: (type: SubsystemType | CustomWorkspaceTab) => void;
}

const STATUS_SERIES: Array<{
  key: MaintenanceStatus;
  label: string;
  color: string;
  bgClass: string;
  dotClass: string;
}> = [
  {
    key: 'overdue',
    label: 'Quá hạn',
    color: '#dc2626',
    bgClass: 'bg-red-50 border-red-200 text-red-700',
    dotClass: 'bg-red-600',
  },
  {
    key: 'soon',
    label: 'Sắp đến hạn',
    color: '#d97706',
    bgClass: 'bg-amber-50 border-amber-200 text-amber-800',
    dotClass: 'bg-amber-500',
  },
  {
    key: 'safe',
    label: 'Đúng hạn',
    color: '#16a34a',
    bgClass: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    dotClass: 'bg-emerald-600',
  },
  {
    key: 'unknown',
    label: 'Chưa xác định',
    color: '#94a3b8',
    bgClass: 'bg-slate-100 border-slate-200 text-slate-700',
    dotClass: 'bg-slate-400',
  },
];

export function DashboardChartCard({
  breakdowns,
  horizonBuckets,
  activeStatusFilter,
  onToggleStatusFilter,
  onSelectSubsystem,
}: DashboardChartCardProps) {
  const [mode, setMode] = useState<ChartMode>('stacked');
  const [hoveredSubsystem, setHoveredSubsystem] = useState<SubsystemBreakdown | null>(null);
  const [hoveredHorizon, setHoveredHorizon] = useState<HorizonBucket | null>(null);

  const totalByStatus = {
    overdue: breakdowns.reduce((s, b) => s + b.overdue, 0),
    soon: breakdowns.reduce((s, b) => s + b.soon, 0),
    safe: breakdowns.reduce((s, b) => s + b.safe, 0),
    unknown: breakdowns.reduce((s, b) => s + b.unknown, 0),
  };

  const maxStacked = Math.max(1, ...breakdowns.map((b) => b.recordCount));
  const maxGrouped = Math.max(
    1,
    ...breakdowns.flatMap((b) => [b.overdue, b.soon, b.safe, b.unknown])
  );
  const maxHorizon = Math.max(1, ...horizonBuckets.map((h) => h.count));

  // SVG layout geometry
  const svgW = 640;
  const svgH = 228;
  const padL = 36;
  const padR = 20;
  const padT = 18;
  const padB = 34;
  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;

  const horizonPoints = horizonBuckets.map((bucket, idx) => {
    const x =
      padL +
      (horizonBuckets.length > 1
        ? (idx / (horizonBuckets.length - 1)) * chartW
        : chartW / 2);
    const y = padT + chartH - (bucket.count / maxHorizon) * chartH;
    return { ...bucket, x, y };
  });

  const linePath = horizonPoints
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(' ');
  const areaPath =
    horizonPoints.length > 0
      ? `${linePath} L ${horizonPoints[horizonPoints.length - 1].x.toFixed(1)} ${(padT + chartH).toFixed(1)} L ${horizonPoints[0].x.toFixed(1)} ${(padT + chartH).toFixed(1)} Z`
      : '';

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 flex flex-col justify-between">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-[#172033]">
              Biểu đồ trạng thái các hệ thống &amp; kỳ hạn
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Nhấn vào trạng thái bên dưới để lọc nhanh bảng chi tiết toàn bộ thiết bị
            </p>
          </div>

          <div
            className="inline-flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200/70 shrink-0"
            role="group"
            aria-label="Chế độ biểu đồ"
          >
            <button
              type="button"
              onClick={() => setMode('stacked')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                mode === 'stacked'
                  ? 'bg-white text-[#172033] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Cột chồng</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('grouped')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                mode === 'grouped'
                  ? 'bg-white text-[#172033] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Cột</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('horizon')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                mode === 'horizon'
                  ? 'bg-white text-[#172033] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Theo kỳ hạn</span>
            </button>
          </div>
        </div>

        {/* Clickable Legend / Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 mt-3.5">
          {STATUS_SERIES.map((s) => {
            const count = totalByStatus[s.key];
            const isSelected = activeStatusFilter === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() =>
                  onToggleStatusFilter(isSelected ? '' : s.key)
                }
                aria-pressed={isSelected}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? `${s.bgClass} ring-2 ring-offset-1 ring-slate-300`
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${s.dotClass}`} aria-hidden="true" />
                <span>{s.label}</span>
                <span className="font-bold tabular-nums">{count}</span>
              </button>
            );
          })}
          {activeStatusFilter && (
            <button
              type="button"
              onClick={() => onToggleStatusFilter('')}
              className="text-[11px] font-semibold text-blue-700 hover:text-blue-800 px-2 py-1 cursor-pointer whitespace-nowrap"
            >
              Bỏ lọc
            </button>
          )}
        </div>
      </div>

      {/* Chart Area */}
      <div className="mt-3 relative rounded-xl border border-slate-100 bg-[#fbfcfe] p-3">
        {mode !== 'horizon' ? (
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            className="w-full h-44 overflow-visible"
            role="img"
            aria-label="Biểu đồ trạng thái bảo dưỡng theo các phân hệ và không gian làm việc"
          >
            {/* Horizontal grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
              const y = padT + chartH - t * chartH;
              const maxVal = mode === 'stacked' ? maxStacked : maxGrouped;
              const labelVal = Math.round(t * maxVal);
              return (
                <g key={i}>
                  <line
                    x1={padL}
                    x2={svgW - padR}
                    y1={y}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeDasharray={i === 0 ? undefined : '3 3'}
                    strokeWidth="1"
                  />
                  <text
                    x={padL - 8}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="10"
                    fill="#64748b"
                    className="tabular-nums"
                  >
                    {labelVal}
                  </text>
                </g>
              );
            })}

            {breakdowns.map((b, idx) => {
              const slotW = chartW / Math.max(1, breakdowns.length);
              const centerX = padL + slotW * idx + slotW / 2;
              const shortLabel =
                b.label.length > 14 ? `${b.label.slice(0, 12)}…` : b.label;

              if (mode === 'stacked') {
                const barW = Math.min(54, slotW * 0.48);
                let currentY = padT + chartH;
                const segments = [
                  { key: 'safe', val: b.safe, color: '#16a34a' },
                  { key: 'soon', val: b.soon, color: '#d97706' },
                  { key: 'overdue', val: b.overdue, color: '#dc2626' },
                  { key: 'unknown', val: b.unknown, color: '#94a3b8' },
                ];

                return (
                  <g
                    key={b.type}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredSubsystem(b)}
                    onMouseLeave={() => setHoveredSubsystem(null)}
                    onClick={() => onSelectSubsystem(b.type)}
                  >
                    <title>{b.label}</title>
                    {segments.map((seg) => {
                      if (seg.val <= 0) return null;
                      const h = (seg.val / maxStacked) * chartH;
                      const y = currentY - h;
                      currentY = y;
                      return (
                        <rect
                          key={seg.key}
                          x={centerX - barW / 2}
                          y={y}
                          width={barW}
                          height={Math.max(h - 1, 2)}
                          rx="3"
                          fill={seg.color}
                        />
                      );
                    })}
                    <text
                      x={centerX}
                      y={currentY - 6}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="700"
                      fill="#172033"
                      className="tabular-nums"
                    >
                      {b.recordCount}
                    </text>
                    <text
                      x={centerX}
                      y={svgH - 10}
                      textAnchor="middle"
                      fontSize={breakdowns.length > 5 ? '10' : '11'}
                      fontWeight="600"
                      fill="#334155"
                    >
                      {shortLabel}
                    </text>
                  </g>
                );
              }

              // Grouped mode
              const items = [
                { val: b.overdue, color: '#dc2626' },
                { val: b.soon, color: '#d97706' },
                { val: b.safe, color: '#16a34a' },
                { val: b.unknown, color: '#94a3b8' },
              ];
              const singleW = Math.min(14, Math.max(7, (slotW * 0.6) / 4));
              const gap = 3;
              const groupTotalW = items.length * singleW + (items.length - 1) * gap;
              const startX = centerX - groupTotalW / 2;

              return (
                <g
                  key={b.type}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredSubsystem(b)}
                  onMouseLeave={() => setHoveredSubsystem(null)}
                  onClick={() => onSelectSubsystem(b.type)}
                >
                  <title>{b.label}</title>
                  {items.map((item, sIdx) => {
                    const h = (item.val / maxGrouped) * chartH;
                    const x = startX + sIdx * (singleW + gap);
                    const y = padT + chartH - h;
                    return (
                      <g key={sIdx}>
                        <rect
                          x={x}
                          y={item.val > 0 ? y : padT + chartH - 2}
                          width={singleW}
                          height={item.val > 0 ? h : 2}
                          rx="3"
                          fill={item.val > 0 ? item.color : '#e2e8f0'}
                        />
                        {item.val > 0 && (
                          <text
                            x={x + singleW / 2}
                            y={y - 4}
                            textAnchor="middle"
                            fontSize="9.5"
                            fontWeight="700"
                            fill="#334155"
                            className="tabular-nums"
                          >
                            {item.val}
                          </text>
                        )}
                      </g>
                    );
                  })}
                  <text
                    x={centerX}
                    y={svgH - 10}
                    textAnchor="middle"
                    fontSize={breakdowns.length > 5 ? '10' : '11'}
                    fontWeight="600"
                    fill="#334155"
                  >
                    {shortLabel}
                  </text>
                </g>
              );
            })}
          </svg>
        ) : (
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            className="w-full h-44 overflow-visible"
            role="img"
            aria-label="Biểu đồ phân bổ các mốc bảo dưỡng theo kỳ hạn"
          >
            <defs>
              <linearGradient id="paHorizonArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.24" />
                <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
              const y = padT + chartH - t * chartH;
              return (
                <g key={i}>
                  <line
                    x1={padL}
                    x2={svgW - padR}
                    y1={y}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeDasharray={i === 0 ? undefined : '3 3'}
                    strokeWidth="1"
                  />
                  <text
                    x={padL - 8}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="10"
                    fill="#64748b"
                    className="tabular-nums"
                  >
                    {Math.round(t * maxHorizon)}
                  </text>
                </g>
              );
            })}

            {areaPath && <path d={areaPath} fill="url(#paHorizonArea)" />}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke="#1d39c4"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {horizonPoints.map((pt) => {
              const dotColor =
                pt.tone === 'overdue'
                  ? '#dc2626'
                  : pt.tone === 'soon'
                    ? '#d97706'
                    : '#1d39c4';
              return (
                <g
                  key={pt.key}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredHorizon(pt)}
                  onMouseLeave={() => setHoveredHorizon(null)}
                >
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="5"
                    fill="#ffffff"
                    stroke={dotColor}
                    strokeWidth="2.5"
                  />
                  <text
                    x={pt.x}
                    y={pt.y - 10}
                    textAnchor="middle"
                    fontSize="10.5"
                    fontWeight="700"
                    fill="#172033"
                    className="tabular-nums"
                  >
                    {pt.count}
                  </text>
                  <text
                    x={pt.x}
                    y={svgH - 10}
                    textAnchor="middle"
                    fontSize="10.5"
                    fontWeight="600"
                    fill="#475569"
                  >
                    {pt.label}
                  </text>
                </g>
              );
            })}
          </svg>
        )}

        {/* Contextual hover bar */}
        <div className="mt-1 min-h-[20px] flex items-center justify-between text-[11px] text-slate-500 px-1">
          {mode !== 'horizon' && hoveredSubsystem ? (
            <span className="font-medium text-slate-700">
              <strong>{hoveredSubsystem.label}</strong>: {hoveredSubsystem.recordCount} hồ sơ
              {' · '}Đúng hạn {hoveredSubsystem.safe}, Sắp đến hạn {hoveredSubsystem.soon},
              Quá hạn {hoveredSubsystem.overdue}, Chưa xác định {hoveredSubsystem.unknown}
            </span>
          ) : mode === 'horizon' && hoveredHorizon ? (
            <span className="font-medium text-slate-700">
              Kỳ hạn <strong>{hoveredHorizon.label}</strong>: {hoveredHorizon.count} đầu việc có ngày xác định
            </span>
          ) : (
            <span>
              {mode === 'horizon'
                ? 'Phân bổ các đầu việc kiểm tra / thay thế / bảo dưỡng theo khoảng thời gian tới'
                : 'Di chuột hoặc nhấn vào từng cột phân hệ để xem chi tiết'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
