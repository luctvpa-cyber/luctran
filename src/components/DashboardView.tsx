import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Cable,
  CheckCircle2,
  CircleDot,
  Clock,
  Download,
  Filter,
  FolderKanban,
  Layers,
  Plus,
  RotateCcw,
  Search,
  Upload,
  X,
  Zap,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import type {
  AlertItem,
  AnyRecord,
  CustomRowRecord,
  CustomWorkspace,
  CustomWorkspaceTab,
  DashboardStats,
  MaintenanceStatus,
  MatrixItem,
  NavTab,
  SubsystemType,
} from '../types/maintenance';
import {
  formatDateDisplay,
  formatDaysRemaining,
  getCustomWorkspaceId,
  isCustomWorkspaceTab,
  makeCustomWorkspaceTab,
} from '../utils/maintenance';
import { DashboardChartCard } from './DashboardChartCard';
import { StatusBadge } from './StatusBadge';

interface DashboardViewProps {
  stats: DashboardStats;
  matrixItems: MatrixItem[];
  customWorkspaces: CustomWorkspace[];
  alertItems: AlertItem[];
  lastUpdatedLabel: string;
  onNavigate: (tab: NavTab) => void;
  onEditRecord: (type: SubsystemType, record: AnyRecord) => void;
  onEditCustomRow: (workspaceId: string, row: CustomRowRecord) => void;
  onAddWorkspace: () => void;
  onImportExcel: () => void;
  onExportAll: () => void;
  onRequestReset: () => void;
}

const SUBSYSTEM_ICONS: Record<SubsystemType, typeof CircleDot> = {
  tanks: CircleDot,
  filters: Filter,
  hoses: Cable,
  electrics: Zap,
};

export function DashboardView({
  stats,
  matrixItems,
  customWorkspaces,
  alertItems,
  lastUpdatedLabel,
  onNavigate,
  onEditRecord,
  onEditCustomRow,
  onAddWorkspace,
  onImportExcel,
  onExportAll,
  onRequestReset,
}: DashboardViewProps) {
  const [matrixSubsystem, setMatrixSubsystem] = useState<
    SubsystemType | CustomWorkspaceTab | 'all'
  >('all');
  const [matrixStatus, setMatrixStatus] = useState<MaintenanceStatus | ''>('');
  const [matrixQuery, setMatrixQuery] = useState('');
  const matrixSectionRef = useRef<HTMLDivElement | null>(null);

  const totalSpacesCount = 4 + customWorkspaces.length;
  const attentionCount = stats.overdueCount + stats.soonCount;

  const alertOverdue = alertItems.filter((a) => a.status === 'overdue').length;
  const alertSoon = alertItems.filter((a) => a.status === 'soon').length;

  const filterTabs = useMemo<
    Array<{ id: SubsystemType | CustomWorkspaceTab | 'all'; label: string }>
  >(
    () => [
      { id: 'all', label: 'Tất cả hệ thống' },
      { id: 'tanks', label: 'Bể chứa' },
      { id: 'filters', label: 'Bầu lọc' },
      { id: 'hoses', label: 'Ống mềm' },
      { id: 'electrics', label: 'Hệ thống điện' },
      ...customWorkspaces.map((ws) => ({
        id: makeCustomWorkspaceTab(ws.id),
        label: ws.name,
      })),
    ],
    [customWorkspaces]
  );

  const filteredMatrix = useMemo(() => {
    const q = matrixQuery.trim().toLowerCase();
    return matrixItems.filter((item) => {
      if (matrixSubsystem !== 'all' && item.type !== matrixSubsystem) return false;
      if (matrixStatus && item.status !== matrixStatus) return false;
      if (q) {
        const hay = `${item.subsystemLabel} ${item.title} ${item.subtitle}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [matrixItems, matrixSubsystem, matrixStatus, matrixQuery]);

  const handleFilterAttention = (targetStatus: 'overdue' | 'soon') => {
    setMatrixSubsystem('all');
    setMatrixStatus(targetStatus);
    matrixSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-4">
      {/* Top Action Strip */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="text-xs text-slate-500">
          <span className="font-semibold text-slate-700">Tổng hợp trạng thái kỹ thuật</span>
          <span className="mx-1.5" aria-hidden="true">·</span>
          <span>
            {String(totalSpacesCount).padStart(2, '0')} không gian làm việc
          </span>
          <span className="mx-1.5" aria-hidden="true">·</span>
          <span>Cập nhật {lastUpdatedLabel}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onAddWorkspace}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#e99b20] text-[#172033] hover:bg-[#f4ad36] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Thêm không gian</span>
          </button>
          <button
            type="button"
            onClick={onImportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Nhập Excel</span>
          </button>
          <button
            type="button"
            onClick={onExportAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#101d31] text-white hover:bg-[#1c304b] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Xuất tổng hợp</span>
          </button>
          <button
            type="button"
            onClick={onRequestReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Khôi phục</span>
          </button>
        </div>
      </div>

      {/* Live Alert Strip for Overdue / Due-Soon Items */}
      {alertItems.length > 0 && (
        <div
          role="region"
          aria-label="Cảnh báo hạng mục sắp đến hạn hoặc quá hạn"
          data-testid="dashboard-alert-banner"
          className={`rounded-xl border px-4 py-3 flex flex-wrap items-center justify-between gap-3 ${
            alertOverdue > 0
              ? 'bg-red-50/90 border-red-200 text-red-900'
              : 'bg-amber-50/90 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-start sm:items-center gap-2.5 min-w-0">
            <AlertTriangle
              className={`w-4 h-4 shrink-0 mt-0.5 sm:mt-0 ${
                alertOverdue > 0 ? 'text-red-600' : 'text-amber-600'
              }`}
              aria-hidden="true"
            />
            <div className="text-xs leading-relaxed">
              <span className="font-bold">Thông báo hạn kiểm tra / bảo dưỡng: </span>
              <span>
                Hiện có{' '}
                {alertOverdue > 0 && (
                  <strong className="text-red-700 tabular-nums">
                    {alertOverdue} hạng mục quá hạn
                  </strong>
                )}
                {alertOverdue > 0 && alertSoon > 0 && ' và '}
                {alertSoon > 0 && (
                  <strong className="text-amber-800 tabular-nums">
                    {alertSoon} hạng mục sắp đến hạn (≤ 30 ngày)
                  </strong>
                )}
                . Mục gần nhất:{' '}
                <span className="font-semibold">{alertItems[0].title}</span> (
                {formatDaysRemaining(alertItems[0].daysRemaining)}).
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {alertOverdue > 0 && (
              <button
                type="button"
                onClick={() => handleFilterAttention('overdue')}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-red-600 text-white hover:bg-red-700 transition-colors whitespace-nowrap cursor-pointer"
              >
                Lọc mục quá hạn ({alertOverdue})
              </button>
            )}
            {alertSoon > 0 && (
              <button
                type="button"
                onClick={() => handleFilterAttention('soon')}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 transition-colors whitespace-nowrap cursor-pointer"
              >
                Lọc sắp đến hạn ({alertSoon})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Row 1: 3 Hero KPI Cards with Bottom Accent Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-xs font-medium text-slate-500">
                Tỉ lệ mốc kiểm tra đạt chuẩn
              </div>
              <div
                className="text-3xl font-extrabold text-[#172033] mt-2 tabular-nums"
                data-testid="stat-compliance"
              >
                {stats.complianceRate}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1 tabular-nums">
                {stats.safeCount + stats.soonCount}/{stats.knownDueTotal} mốc chưa quá hạn
              </div>
            </div>
            <span className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 grid place-items-center shrink-0">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-4 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#1d39c4] transition-all duration-300"
              style={{ width: `${stats.complianceRate}%` }}
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-xs font-medium text-slate-500">
                Hồ sơ thiết bị đang theo dõi
              </div>
              <div
                className="text-3xl font-extrabold text-[#172033] mt-2 tabular-nums"
                data-testid="stat-total"
              >
                {stats.totalRecords}/{stats.totalRecords}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Đầy đủ trên {String(totalSpacesCount).padStart(2, '0')} không gian làm việc
              </div>
            </div>
            <span className="w-9 h-9 rounded-lg bg-indigo-50 text-[#1d39c4] grid place-items-center shrink-0">
              <Layers className="w-4 h-4" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-4 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-[#1d39c4] w-full" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-xs font-medium text-slate-500">
                Mốc cần chú ý (Quá hạn / ≤ 30 ngày)
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span
                  className={`text-3xl font-extrabold tabular-nums ${
                    stats.overdueCount > 0
                      ? 'text-red-600'
                      : stats.soonCount > 0
                        ? 'text-amber-600'
                        : 'text-[#172033]'
                  }`}
                  data-testid="stat-attention"
                >
                  {attentionCount}
                </span>
                <span className="text-xs text-slate-500 tabular-nums">
                  ({stats.overdueCount} quá hạn · {stats.soonCount} sắp hạn)
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 tabular-nums">
                {stats.safeCount} mốc an toàn &gt; 30 ngày
              </div>
            </div>
            <span
              className={`w-9 h-9 rounded-lg grid place-items-center shrink-0 ${
                stats.overdueCount > 0
                  ? 'bg-red-50 text-red-600'
                  : 'bg-amber-50 text-amber-600'
              }`}
            >
              {stats.overdueCount > 0 ? (
                <AlertCircle className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Clock className="w-4 h-4" aria-hidden="true" />
              )}
            </span>
          </div>
          <div className="mt-4 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden flex">
            {stats.knownDueTotal > 0 ? (
              <>
                <div
                  className="bg-red-500 h-full"
                  style={{ width: `${(stats.overdueCount / stats.knownDueTotal) * 100}%` }}
                />
                <div
                  className="bg-amber-400 h-full"
                  style={{ width: `${(stats.soonCount / stats.knownDueTotal) * 100}%` }}
                />
                <div
                  className="bg-emerald-500 h-full"
                  style={{ width: `${(stats.safeCount / stats.knownDueTotal) * 100}%` }}
                />
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Row 2: 2/3 Interactive Chart + 1/3 Subsystem Health Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <DashboardChartCard
            breakdowns={stats.subsystemBreakdowns}
            horizonBuckets={stats.horizonBuckets}
            activeStatusFilter={matrixStatus}
            onToggleStatusFilter={setMatrixStatus}
            onSelectSubsystem={(sub) => setMatrixSubsystem(sub)}
          />
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 mb-4">
              <div>
                <h2 className="text-sm font-bold text-[#172033]">
                  Tình trạng từng phân hệ
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Sức khỏe hồ sơ theo {String(totalSpacesCount).padStart(2, '0')} không gian làm việc
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('tanks')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#1d39c4] hover:text-blue-800 whitespace-nowrap cursor-pointer"
              >
                <span>Chi tiết</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {stats.subsystemBreakdowns.map((b) => {
                const Icon =
                  SUBSYSTEM_ICONS[b.type as SubsystemType] ?? FolderKanban;
                const total = b.recordCount || 1;
                return (
                  <button
                    key={b.type}
                    type="button"
                    onClick={() => onNavigate(b.type)}
                    className="w-full text-left group rounded-lg p-2 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="flex items-center gap-2 text-xs font-semibold text-[#172033] min-w-0">
                        <Icon
                          className="w-4 h-4 text-slate-500 group-hover:text-[#1d39c4] shrink-0"
                          aria-hidden="true"
                        />
                        <span className="truncate">{b.label}</span>
                      </span>
                      <span className="text-sm font-extrabold text-[#172033] tabular-nums shrink-0">
                        {b.recordCount}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full"
                        style={{ width: `${(b.safe / total) * 100}%` }}
                      />
                      <div
                        className="bg-amber-400 h-full"
                        style={{ width: `${(b.soon / total) * 100}%` }}
                      />
                      <div
                        className="bg-red-500 h-full"
                        style={{ width: `${(b.overdue / total) * 100}%` }}
                      />
                      <div
                        className="bg-slate-300 h-full"
                        style={{ width: `${(b.unknown / total) * 100}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5 text-[11px] text-slate-500 tabular-nums">
                      <span className="text-emerald-700 font-medium">Đúng hạn {b.safe}</span>
                      {b.soon > 0 && (
                        <span className="text-amber-700 font-medium">Sắp hạn {b.soon}</span>
                      )}
                      {b.overdue > 0 && (
                        <span className="text-red-600 font-semibold">Quá hạn {b.overdue}</span>
                      )}
                      {b.unknown > 0 && (
                        <span>Chưa XĐ {b.unknown}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Nhấn vào phân hệ để mở bảng chi tiết</span>
            <span className="font-semibold text-slate-700 tabular-nums">
              {stats.totalRecords} thiết bị
            </span>
          </div>
        </div>
      </div>

      {/* Row 3: Visual All-Items Status Matrix */}
      <div
        ref={matrixSectionRef}
        className="bg-white border border-slate-200/90 rounded-xl overflow-hidden"
      >
        <div className="p-5 border-b border-slate-100 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[#172033]">
                Bảng tổng hợp trực quan trạng thái toàn bộ hạng mục
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Theo dõi đồng thời mọi thiết bị, mốc kiểm tra/thay thế và số ngày còn lại trên toàn bộ không gian làm việc
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 tabular-nums" data-testid="matrix-count">
              Hiển thị {filteredMatrix.length}/{matrixItems.length} hạng mục
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg"
              role="tablist"
              aria-label="Lọc bảng tổng hợp theo phân hệ"
            >
              {filterTabs.map((tab) => {
                const isActive = matrixSubsystem === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setMatrixSubsystem(tab.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-white text-[#172033] shadow-xs'
                        : 'text-slate-600 hover:text-[#172033]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2 flex-1 sm:flex-initial justify-end">
              <div className="relative min-w-[200px] flex-1 sm:w-64">
                <label htmlFor="matrix-search" className="sr-only">
                  Tìm trong bảng tổng hợp trạng thái
                </label>
                <Search
                  className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="matrix-search"
                  type="text"
                  value={matrixQuery}
                  onChange={(e) => setMatrixQuery(e.target.value)}
                  placeholder="Tìm thiết bị, model, mã số..."
                  className="w-full border border-slate-200 rounded-lg pl-8 pr-7 py-1.5 text-xs bg-white text-[#172033] outline-none focus:border-[#1d39c4] focus:ring-2 focus:ring-blue-500/15"
                />
                {matrixQuery && (
                  <button
                    type="button"
                    onClick={() => setMatrixQuery('')}
                    aria-label="Xóa tìm kiếm bảng tổng hợp"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <label htmlFor="matrix-status" className="sr-only">
                Lọc trạng thái trên bảng tổng hợp
              </label>
              <select
                id="matrix-status"
                value={matrixStatus}
                onChange={(e) => setMatrixStatus(e.target.value as MaintenanceStatus | '')}
                className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white text-[#172033] outline-none focus:border-[#1d39c4]"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="overdue">Quá hạn</option>
                <option value="soon">Sắp đến hạn</option>
                <option value="safe">Đúng hạn</option>
                <option value="unknown">Chưa xác định</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[440px]">
          <table className="w-full border-collapse text-left whitespace-nowrap">
            <thead>
              <tr className="bg-[#f7f9fc] sticky top-0 z-10 border-b border-slate-200">
                <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Phân hệ
                </th>
                <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Hạng mục / Thiết bị
                </th>
                <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Các mốc đến hạn
                </th>
                <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Hạn gần nhất
                </th>
                <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Trạng thái
                </th>
                <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMatrix.length > 0 ? (
                filteredMatrix.map((item) => (
                  <tr key={`${item.type}-${item.id}`} className="hover:bg-[#fbfcfe] transition-colors">
                    <td className="py-3 px-4 text-xs font-semibold text-slate-600">
                      <button
                        type="button"
                        onClick={() => onNavigate(item.type)}
                        className="hover:text-[#1d39c4] hover:underline cursor-pointer"
                      >
                        {item.subsystemLabel}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs font-bold text-[#172033]">{item.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{item.subtitle}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {item.milestones.length > 0 ? (
                          item.milestones.map((m, mIdx) => (
                            <span
                              key={mIdx}
                              className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-50 border border-slate-200/80 rounded px-2 py-0.5 font-mono-tabular"
                            >
                              <span className="font-sans text-slate-500">{m.label}:</span>
                              <span
                                className={`font-semibold ${
                                  m.status === 'overdue'
                                    ? 'text-red-600'
                                    : m.status === 'soon'
                                      ? 'text-amber-700'
                                      : 'text-[#172033]'
                                }`}
                              >
                                {formatDateDisplay(m.date)}
                              </span>
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs font-mono-tabular font-semibold text-[#172033]">
                        {formatDateDisplay(item.earliestDate)}
                      </div>
                      <div
                        className={`text-[11px] mt-0.5 ${
                          item.status === 'overdue'
                            ? 'text-red-600 font-semibold'
                            : item.status === 'soon'
                              ? 'text-amber-700 font-medium'
                              : 'text-slate-500'
                        }`}
                      >
                        {formatDaysRemaining(item.daysRemaining)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          if (item.customRow && isCustomWorkspaceTab(item.type)) {
                            onEditCustomRow(
                              getCustomWorkspaceId(item.type),
                              item.customRow
                            );
                          } else if (item.record) {
                            onEditRecord(item.type as SubsystemType, item.record);
                          }
                        }}
                        className="text-xs font-bold text-[#1d39c4] hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Cập nhật
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 px-4 text-center">
                    <p className="text-xs text-slate-500">
                      Không có hạng mục nào khớp với điều kiện lọc hiện tại.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setMatrixSubsystem('all');
                        setMatrixStatus('');
                        setMatrixQuery('');
                      }}
                      className="mt-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                    >
                      Xóa bộ lọc
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="pt-1 pb-2 text-left">
        <span className="text-[11px] font-medium text-slate-400">
          Design by luctv.pa
        </span>
      </footer>
    </div>
  );
}
