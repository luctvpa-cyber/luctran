import {
  Download,
  FileSpreadsheet,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { SUBSYSTEM_CONFIGS } from '../data/initialData';
import type {
  AnyRecord,
  MaintenanceStatus,
  SortMode,
  SubsystemType,
} from '../types/maintenance';
import {
  displayFieldValue,
  filterAndSortRecords,
  getRowStatus,
  getSubsystemFacets,
} from '../utils/maintenance';
import { StatusBadge } from './StatusBadge';

interface SubsystemTableViewProps {
  type: SubsystemType;
  records: AnyRecord[];
  onAddNew: (type: SubsystemType) => void;
  onEditRecord: (type: SubsystemType, record: AnyRecord) => void;
  onExportExcel: (type: SubsystemType) => void;
  onExportPdf: (type: SubsystemType) => void;
}

const STATUS_TABS: Array<{ id: MaintenanceStatus | ''; label: string }> = [
  { id: '', label: 'Tất cả' },
  { id: 'overdue', label: 'Quá hạn' },
  { id: 'soon', label: 'Sắp đến hạn' },
  { id: 'safe', label: 'Đúng hạn' },
  { id: 'unknown', label: 'Chưa xác định' },
];

export function SubsystemTableView({
  type,
  records,
  onAddNew,
  onEditRecord,
  onExportExcel,
  onExportPdf,
}: SubsystemTableViewProps) {
  const cfg = SUBSYSTEM_CONFIGS[type];
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | ''>('');
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [facets, setFacets] = useState<Record<string, string>>({});

  const facetDefinitions = useMemo(
    () => getSubsystemFacets(type, records),
    [type, records]
  );

  const statusCounts = useMemo(() => {
    const counts: Record<MaintenanceStatus | 'all', number> = {
      all: records.length,
      overdue: 0,
      soon: 0,
      safe: 0,
      unknown: 0,
    };
    records.forEach((rec) => {
      const s = getRowStatus(type, rec);
      counts[s] += 1;
    });
    return counts;
  }, [type, records]);

  const visibleRecords = useMemo(
    () =>
      filterAndSortRecords(type, records, {
        query,
        status: statusFilter,
        sort: sortMode,
        facets,
      }),
    [type, records, query, statusFilter, sortMode, facets]
  );

  const activeFacetCount = Object.values(facets).filter(Boolean).length;
  const hasAnyFilter =
    Boolean(query.trim()) ||
    Boolean(statusFilter) ||
    sortMode !== 'default' ||
    activeFacetCount > 0;

  const resetAllFilters = () => {
    setQuery('');
    setStatusFilter('');
    setSortMode('default');
    setFacets({});
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <div className="text-[11px] text-amber-700 font-bold tracking-wider uppercase">
            {cfg.sub}
          </div>
          <h1 className="text-2xl font-extrabold text-[#172033] mt-1 tracking-tight">
            {cfg.title}
          </h1>
          <p className="text-xs text-slate-500 mt-1.5">{cfg.desc}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onExportExcel(type)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-white border border-slate-200 text-[#344256] hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Excel</span>
          </button>
          <button
            type="button"
            onClick={() => onExportPdf(type)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-white border border-slate-200 text-[#344256] hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>PDF</span>
          </button>
          <button
            type="button"
            onClick={() => onAddNew(type)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-[#e99b20] text-[#172033] hover:bg-[#f4ad36] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Thêm hồ sơ</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden">
        {/* Filter Toolbar */}
        <div className="p-4 border-b border-slate-100 space-y-3">
          {/* Row 1: Search + Status Segmented Tabs + Sort */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <label htmlFor={`${type}-search`} className="sr-only">
                Tìm kiếm hồ sơ {cfg.title}
              </label>
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id={`${type}-search`}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm theo tên, vị trí, mã số..."
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
                aria-label={`Lọc trạng thái ${cfg.title}`}
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

              <label htmlFor={`${type}-sort`} className="sr-only">
                Sắp xếp hồ sơ
              </label>
              <select
                id={`${type}-sort`}
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="border border-[#dce3ec] rounded-lg px-3 py-2 text-xs bg-white text-[#172033] outline-none focus:border-[#1d39c4]"
              >
                <option value="default">Sắp xếp: Mặc định</option>
                <option value="earliest_due">Hạn gần nhất trước</option>
                <option value="name_asc">Tên / Vị trí A → Z</option>
              </select>
            </div>
          </div>

          {/* Row 2: Subsystem-specific Facet Filters */}
          {facetDefinitions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mr-1">
                <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Bộ lọc phân hệ:</span>
              </span>

              {facetDefinitions.map((facet) => (
                <div key={facet.key} className="inline-flex items-center">
                  <label htmlFor={`${type}-facet-${facet.key}`} className="sr-only">
                    {facet.label}
                  </label>
                  <select
                    id={`${type}-facet-${facet.key}`}
                    value={facets[facet.key] ?? ''}
                    onChange={(e) =>
                      setFacets((prev) => ({
                        ...prev,
                        [facet.key]: e.target.value,
                      }))
                    }
                    className={`border rounded-lg px-2.5 py-1.5 text-xs outline-none transition-colors ${
                      facets[facet.key]
                        ? 'border-[#1d39c4] bg-blue-50/50 text-[#1d39c4] font-semibold'
                        : 'border-[#dce3ec] bg-white text-[#344256]'
                    }`}
                  >
                    <option value="">{facet.label}: Tất cả</option>
                    {facet.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {facet.label}: {opt.replace(/\n/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              <div className="ml-auto flex items-center gap-3">
                {hasAnyFilter && (
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#1d39c4] hover:text-blue-800 cursor-pointer whitespace-nowrap"
                  >
                    <RotateCcw className="w-3 h-3" aria-hidden="true" />
                    <span>Xóa bộ lọc</span>
                  </button>
                )}
                <span
                  className="text-[11px] font-semibold text-slate-500 tabular-nums"
                  data-testid="table-count"
                >
                  {visibleRecords.length}/{records.length} hồ sơ
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Data Table */}
        <div className="overflow-auto max-h-[calc(100vh-370px)]">
          <table className="w-full border-collapse whitespace-nowrap text-left">
            <thead>
              <tr className="bg-[#f7f9fc] sticky top-0 z-10 border-b border-slate-200">
                <th className="py-3 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  STT
                </th>
                {cfg.cols.map((col) => (
                  <th
                    key={col.key}
                    className={`py-3 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 ${
                      col.isNumeric ? 'text-right' : ''
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
              {visibleRecords.length > 0 ? (
                visibleRecords.map((rec, index) => {
                  const rowMap = rec as unknown as Record<string, string>;
                  const rowStatus = getRowStatus(type, rec);
                  const rowLabel =
                    rowMap.name || rowMap.position || rowMap.equipment || rec.id;

                  return (
                    <tr key={rec.id} className="hover:bg-[#fbfcfe] transition-colors">
                      <td className="py-3 px-3.5 text-xs text-slate-400 tabular-nums">
                        {index + 1}
                      </td>
                      {cfg.cols.map((col) => {
                        const rawVal = displayFieldValue(col.key, rowMap[col.key]);
                        return (
                          <td
                            key={col.key}
                            className={`py-3 px-3.5 text-xs ${
                              col.isPrimary
                                ? 'font-semibold text-[#172033]'
                                : 'text-[#344256]'
                            } ${col.isNumeric ? 'text-right font-mono-tabular' : ''}`}
                          >
                            <span className="whitespace-pre">{rawVal}</span>
                          </td>
                        );
                      })}
                      <td className="py-3 px-3.5">
                        <StatusBadge status={rowStatus} />
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => onEditRecord(type, rec)}
                          aria-label={`Sửa hồ sơ ${rowLabel}`}
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
                    colSpan={cfg.cols.length + 3}
                    className="py-12 px-4 text-center"
                  >
                    <p className="text-xs text-slate-500">
                      Không tìm thấy hồ sơ phù hợp với bộ lọc hiện tại.
                    </p>
                    {hasAnyFilter && (
                      <button
                        type="button"
                        onClick={resetAllFilters}
                        className="mt-3 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                      >
                        Xóa tất cả bộ lọc
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-slate-100 flex flex-wrap justify-between items-center gap-2 text-[11px] text-slate-400">
          <span>Dữ liệu hiển thị theo hồ sơ đã lưu • Cuộn ngang để xem đầy đủ cột</span>
          <span className="tabular-nums">{records.length} bản ghi</span>
        </div>
      </div>
    </div>
  );
}
