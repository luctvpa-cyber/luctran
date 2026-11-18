import {
  Download,
  FileSpreadsheet,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type {
  CustomRowRecord,
  CustomWorkspace,
  MaintenanceStatus,
  SortMode,
} from '../types/maintenance';
import {
  displayCustomCellValue,
  filterAndSortCustomRows,
  getCustomRowPrimaryTitle,
  getCustomRowStatus,
} from '../utils/maintenance';
import { StatusBadge } from './StatusBadge';

interface CustomWorkspaceViewProps {
  workspace: CustomWorkspace;
  onAddRow: () => void;
  onEditRow: (row: CustomRowRecord) => void;
  onConfigureWorkspace: () => void;
  onExportExcel: () => void;
  onExportPdf: () => void;
}

const STATUS_TABS: Array<{ id: MaintenanceStatus | ''; label: string }> = [
  { id: '', label: 'Tất cả' },
  { id: 'overdue', label: 'Quá hạn' },
  { id: 'soon', label: 'Sắp đến hạn' },
  { id: 'safe', label: 'Đúng hạn' },
  { id: 'unknown', label: 'Chưa xác định' },
];

export function CustomWorkspaceView({
  workspace,
  onAddRow,
  onEditRow,
  onConfigureWorkspace,
  onExportExcel,
  onExportPdf,
}: CustomWorkspaceViewProps) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | ''>('');
  const [sortMode, setSortMode] = useState<SortMode>('default');

  const statusCounts = useMemo(() => {
    const counts: Record<MaintenanceStatus | 'all', number> = {
      all: workspace.rows.length,
      overdue: 0,
      soon: 0,
      safe: 0,
      unknown: 0,
    };
    workspace.rows.forEach((row) => {
      const s = getCustomRowStatus(workspace, row);
      counts[s] += 1;
    });
    return counts;
  }, [workspace]);

  const visibleRows = useMemo(
    () =>
      filterAndSortCustomRows(workspace, query, statusFilter, sortMode),
    [workspace, query, statusFilter, sortMode]
  );

  const hasAnyFilter =
    Boolean(query.trim()) || Boolean(statusFilter) || sortMode !== 'default';

  const resetAllFilters = () => {
    setQuery('');
    setStatusFilter('');
    setSortMode('default');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <div className="text-[11px] text-amber-700 font-bold tracking-wider uppercase">
            {workspace.subtitle}
          </div>
          <h1 className="text-2xl font-extrabold text-[#172033] mt-1 tracking-tight">
            {workspace.name}
          </h1>
          <p className="text-xs text-slate-500 mt-1.5">{workspace.description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onConfigureWorkspace}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-white border border-slate-200 text-[#0b1956] hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Cấu hình cột</span>
          </button>
          <button
            type="button"
            onClick={onExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-white border border-slate-200 text-[#344256] hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Excel</span>
          </button>
          <button
            type="button"
            onClick={onExportPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-white border border-slate-200 text-[#344256] hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>PDF</span>
          </button>
          <button
            type="button"
            onClick={onAddRow}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-[#e99b20] text-[#172033] hover:bg-[#f4ad36] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Thêm dòng</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden">
        {/* Filter Toolbar */}
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <label htmlFor={`ws-${workspace.id}-search`} className="sr-only">
                Tìm kiếm trong {workspace.name}
              </label>
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id={`ws-${workspace.id}-search`}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm theo từ khóa bất kỳ..."
                className="w-full border border-[#dce3ec] rounded-lg pl-9 pr-8 py-2 text-xs bg-white text-[#172033] outline-none focus:border-[#1d39c4] focus:ring-2 focus:ring-blue-500/15"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Xóa từ khóa tìm kiếm"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div
                className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg"
                role="tablist"
                aria-label={`Lọc trạng thái ${workspace.name}`}
              >
                {STATUS_TABS.map((tab) => {
                  const count =
                    tab.id === '' ? statusCounts.all : statusCounts[tab.id];
                  const isActive = statusFilter === tab.id;
                  return (
                    <button
                      key={tab.id || 'all'}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setStatusFilter(tab.id)}
                      className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'bg-white text-[#172033] shadow-xs'
                          : 'text-slate-600 hover:text-[#172033]'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className="ml-1 text-slate-400 tabular-nums">({count})</span>
                    </button>
                  );
                })}
              </div>

              <label htmlFor={`ws-${workspace.id}-sort`} className="sr-only">
                Sắp xếp dòng dữ liệu
              </label>
              <select
                id={`ws-${workspace.id}-sort`}
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="border border-[#dce3ec] rounded-lg px-3 py-2 text-xs bg-white text-[#172033] outline-none focus:border-[#1d39c4]"
              >
                <option value="default">Sắp xếp: Mặc định</option>
                <option value="earliest_due">Hạn gần nhất trước</option>
                <option value="name_asc">Tên A → Z</option>
              </select>

              {hasAnyFilter && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#1d39c4] hover:text-blue-800 cursor-pointer whitespace-nowrap px-2"
                >
                  <RotateCcw className="w-3 h-3" aria-hidden="true" />
                  <span>Xóa lọc</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-auto max-h-[calc(100vh-370px)]">
          <table className="w-full border-collapse whitespace-nowrap text-left">
            <thead>
              <tr className="bg-[#f7f9fc] sticky top-0 z-10 border-b border-slate-200">
                <th className="py-3 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  STT
                </th>
                {workspace.columns.map((col) => (
                  <th
                    key={col.id}
                    className={`py-3 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 ${
                      col.type === 'number' ? 'text-right' : ''
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
                <th className="py-3 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Trạng thái
                </th>
                <th className="py-3 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleRows.length > 0 ? (
                visibleRows.map((row, index) => {
                  const rowStatus = getCustomRowStatus(workspace, row);
                  const rowTitle = getCustomRowPrimaryTitle(workspace, row);
                  return (
                    <tr key={row.id} className="hover:bg-[#fbfcfe] transition-colors">
                      <td className="py-3 px-3.5 text-xs text-slate-400 tabular-nums">
                        {index + 1}
                      </td>
                      {workspace.columns.map((col) => {
                        const displayVal = displayCustomCellValue(
                          col.type,
                          row.values[col.id]
                        );
                        return (
                          <td
                            key={col.id}
                            className={`py-3 px-3.5 text-xs ${
                              col.isPrimary
                                ? 'font-semibold text-[#172033]'
                                : 'text-[#344256]'
                            } ${col.type === 'number' ? 'text-right font-mono-tabular' : ''}`}
                          >
                            <span className="whitespace-pre">{displayVal}</span>
                          </td>
                        );
                      })}
                      <td className="py-3 px-3.5">
                        <StatusBadge status={rowStatus} />
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => onEditRow(row)}
                          aria-label={`Sửa dòng ${rowTitle}`}
                          className="text-xs font-bold text-amber-700 hover:text-amber-800 px-2 py-1 rounded hover:bg-amber-50 transition-colors cursor-pointer"
                        >
                          Sửa
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={workspace.columns.length + 3}
                    className="py-12 px-4 text-center"
                  >
                    <p className="text-xs text-slate-500">
                      {workspace.rows.length === 0
                        ? 'Chưa có dòng dữ liệu nào trong không gian này.'
                        : 'Không tìm thấy dòng dữ liệu phù hợp với bộ lọc.'}
                    </p>
                    <div className="mt-3 flex items-center justify-center gap-2">
                      {hasAnyFilter ? (
                        <button
                          type="button"
                          onClick={resetAllFilters}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                        >
                          Xóa bộ lọc
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={onAddRow}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#e99b20] text-[#172033] hover:bg-[#f4ad36] cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Thêm dòng đầu tiên</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-slate-100 flex flex-wrap justify-between items-center gap-2 text-[11px] text-slate-400">
          <span>
            Không gian tùy chỉnh · {workspace.columns.length} cột · Tự động đồng bộ Dashboard &amp; Cảnh báo
          </span>
          <span className="tabular-nums">{workspace.rows.length} bản ghi</span>
        </div>
      </div>
    </div>
  );
}
