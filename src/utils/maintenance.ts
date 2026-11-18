import type {
  AlertItem,
  AnyRecord,
  CustomRowRecord,
  CustomWorkspace,
  CustomWorkspaceTab,
  DashboardStats,
  DueItem,
  ElectricRecord,
  FacetDefinition,
  FilterRecord,
  HorizonBucket,
  HoseRecord,
  MaintenanceDB,
  MaintenanceStatus,
  MatrixItem,
  MilestoneSummary,
  SortMode,
  SubsystemBreakdown,
  SubsystemFilterState,
  SubsystemType,
  TankRecord,
} from '../types/maintenance';

const DATE_FIELDS = new Set([
  'lastInspect',
  'lastClean',
  'nextInspect',
  'nextClean',
  'lastReplace',
  'nextReplace',
  'coalescerInstall',
  'separatorInstall',
  'lastPressure',
  'nextPressure',
]);

export const SUBSYSTEM_SHORT_LABELS: Record<SubsystemType, string> = {
  tanks: 'Bể chứa',
  filters: 'Bầu lọc',
  hoses: 'Ống mềm',
  electrics: 'Hệ thống điện',
};

export function isCustomWorkspaceTab(tab: string): tab is CustomWorkspaceTab {
  return tab.startsWith('ws:');
}

export function getCustomWorkspaceId(tab: CustomWorkspaceTab): string {
  return tab.slice(3);
}

export function makeCustomWorkspaceTab(workspaceId: string): CustomWorkspaceTab {
  return `ws:${workspaceId}`;
}

export function parseDate(input: unknown): Date | null {
  if (!input) return null;
  const s = String(input).trim();
  const isoMatch = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]) - 1;
    const day = Number(isoMatch[3]);
    const d = new Date(year, month, day);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const vnMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (vnMatch) {
    const day = Number(vnMatch[1]);
    const month = Number(vnMatch[2]) - 1;
    const year = Number(vnMatch[3]);
    const d = new Date(year, month, day);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function toISODate(d: Date | null): string {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function toInputDateValue(s: unknown): string {
  const raw = String(s ?? '').trim();
  const parsed = parseDate(raw);
  if (parsed) return toISODate(parsed);
  return '';
}

export function formatDateDisplay(s: unknown): string {
  if (!s) return '—';
  const raw = String(s).trim();
  if (!raw) return '—';
  const d = parseDate(raw);
  return d ? d.toLocaleDateString('vi-VN') : raw;
}

export function displayFieldValue(key: string, value: unknown): string {
  if (DATE_FIELDS.has(key)) {
    return formatDateDisplay(value);
  }
  const s = String(value ?? '').trim();
  return s || '—';
}

export function displayCustomCellValue(colType: string, value: unknown): string {
  if (colType === 'date') {
    return formatDateDisplay(value);
  }
  const s = String(value ?? '').trim();
  return s || '—';
}

export function addCycle(dateStr: unknown, cycle: unknown): string {
  const d = parseDate(dateStr);
  if (!d || !cycle) return '';
  const text = String(cycle).toLowerCase().trim();
  let months = 0;

  if (/quý|quarter/.test(text)) {
    months = 3;
  } else if (/tháng/.test(text)) {
    const n = parseInt(text.match(/\d+/)?.[0] ?? '1', 10);
    months = Number.isNaN(n) ? 1 : n;
  } else if (/năm/.test(text)) {
    const n = parseInt(text.match(/\d+/)?.[0] ?? '1', 10);
    months = 12 * (Number.isNaN(n) ? 1 : n);
  } else {
    return '';
  }

  const next = new Date(d.getFullYear(), d.getMonth() + months, d.getDate());
  return toISODate(next);
}

export function getDaysRemaining(dateStr: unknown, referenceDate?: Date): number | null {
  const d = parseDate(dateStr);
  if (!d) return null;

  const now = referenceDate ? new Date(referenceDate) : new Date();
  now.setHours(0, 0, 0, 0);

  const target = new Date(d);
  target.setHours(0, 0, 0, 0);

  return Math.ceil((target.getTime() - now.getTime()) / 86400000);
}

export function formatDaysRemaining(days: number | null): string {
  if (days === null) return 'Chưa có ngày cụ thể';
  if (days < 0) return `Quá hạn ${Math.abs(days)} ngày`;
  if (days === 0) return 'Đến hạn hôm nay';
  return `Còn ${days} ngày`;
}

export function getMaintenanceStatus(dateStr: unknown, referenceDate?: Date): MaintenanceStatus {
  const diffDays = getDaysRemaining(dateStr, referenceDate);
  if (diffDays === null) return 'unknown';
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 30) return 'soon';
  return 'safe';
}

export function getRowDueDates(type: SubsystemType, record: AnyRecord): string[] {
  if (type === 'tanks') {
    const t = record as TankRecord;
    return [t.nextInspect, t.nextClean];
  }
  if (type === 'filters') {
    const f = record as FilterRecord;
    return [f.nextInspect, f.nextReplace];
  }
  if (type === 'hoses') {
    const h = record as HoseRecord;
    return [h.plannedReplace, h.nextPressure];
  }
  const e = record as ElectricRecord;
  return [e.nextInspect];
}

export function getRowStatus(
  type: SubsystemType,
  record: AnyRecord,
  referenceDate?: Date
): MaintenanceStatus {
  const manual = record.manualStatus;
  if (manual === 'overdue' || manual === 'soon' || manual === 'safe' || manual === 'unknown') {
    return manual;
  }

  const dates = getRowDueDates(type, record);
  const statuses = dates.map((d) => getMaintenanceStatus(d, referenceDate));
  if (statuses.includes('overdue')) return 'overdue';
  if (statuses.includes('soon')) return 'soon';
  if (statuses.includes('safe')) return 'safe';
  return 'unknown';
}

export function getCustomWorkspaceDueColumns(workspace: CustomWorkspace) {
  const explicit = workspace.columns.filter((c) => c.type === 'date' && c.isDueDate);
  if (explicit.length > 0) return explicit;
  return workspace.columns.filter((c) => c.type === 'date');
}

export function getCustomRowStatus(
  workspace: CustomWorkspace,
  row: CustomRowRecord,
  referenceDate?: Date
): MaintenanceStatus {
  const manual = row.manualStatus;
  if (manual === 'overdue' || manual === 'soon' || manual === 'safe' || manual === 'unknown') {
    return manual;
  }

  const dueCols = getCustomWorkspaceDueColumns(workspace);
  const statuses = dueCols.map((c) =>
    getMaintenanceStatus(row.values[c.id], referenceDate)
  );
  if (statuses.includes('overdue')) return 'overdue';
  if (statuses.includes('soon')) return 'soon';
  if (statuses.includes('safe')) return 'safe';
  return 'unknown';
}

export function getCustomRowEarliestDueDate(
  workspace: CustomWorkspace,
  row: CustomRowRecord
): string {
  const dueCols = getCustomWorkspaceDueColumns(workspace);
  let earliestTime = Infinity;
  let earliestRaw = '';

  for (const col of dueCols) {
    const raw = row.values[col.id] ?? '';
    const d = parseDate(raw);
    if (d && d.getTime() < earliestTime) {
      earliestTime = d.getTime();
      earliestRaw = raw;
    }
  }
  if (earliestRaw) return earliestRaw;
  for (const col of dueCols) {
    const raw = String(row.values[col.id] ?? '').trim();
    if (raw && raw !== 'N/A') return raw;
  }
  return '';
}

export function getCustomRowPrimaryTitle(
  workspace: CustomWorkspace,
  row: CustomRowRecord
): string {
  const primaryCol =
    workspace.columns.find((c) => c.isPrimary) ?? workspace.columns[0];
  if (!primaryCol) return row.id;
  return String(row.values[primaryCol.id] ?? '').trim() || row.id;
}

export function getEarliestDueDate(type: SubsystemType, record: AnyRecord): string {
  const dates = getRowDueDates(type, record);
  let earliestTime = Infinity;
  let earliestRaw = '';

  for (const raw of dates) {
    const d = parseDate(raw);
    if (d && d.getTime() < earliestTime) {
      earliestTime = d.getTime();
      earliestRaw = raw;
    }
  }
  if (earliestRaw) return earliestRaw;
  return dates.find((d) => String(d ?? '').trim() && d !== 'N/A') ?? '';
}

function resolveMilestoneStatus(
  manualStatus: MaintenanceStatus | '' | undefined,
  dateStr: string,
  isPrimaryMilestone: boolean,
  referenceDate?: Date
): MaintenanceStatus {
  if (
    manualStatus === 'overdue' ||
    manualStatus === 'soon' ||
    manualStatus === 'safe' ||
    manualStatus === 'unknown'
  ) {
    if (manualStatus === 'unknown') return 'unknown';
    return isPrimaryMilestone ? manualStatus : getMaintenanceStatus(dateStr, referenceDate);
  }
  return getMaintenanceStatus(dateStr, referenceDate);
}

export function getDueItems(db: MaintenanceDB, referenceDate?: Date): DueItem[] {
  const items: DueItem[] = [];

  db.tanks.forEach((x) => {
    items.push({
      id: x.id,
      type: 'tanks',
      subsystemLabel: SUBSYSTEM_SHORT_LABELS.tanks,
      name: x.position,
      task: 'Kiểm tra bể chứa',
      date: x.nextInspect,
      status: resolveMilestoneStatus(x.manualStatus, x.nextInspect, true, referenceDate),
    });
    items.push({
      id: x.id,
      type: 'tanks',
      subsystemLabel: SUBSYSTEM_SHORT_LABELS.tanks,
      name: x.position,
      task: 'Vệ sinh bể chứa',
      date: x.nextClean,
      status: resolveMilestoneStatus(x.manualStatus, x.nextClean, false, referenceDate),
    });
  });

  db.filters.forEach((x) => {
    items.push({
      id: x.id,
      type: 'filters',
      subsystemLabel: SUBSYSTEM_SHORT_LABELS.filters,
      name: x.name,
      task: 'Kiểm tra bầu lọc',
      date: x.nextInspect,
      status: resolveMilestoneStatus(x.manualStatus, x.nextInspect, true, referenceDate),
    });
    items.push({
      id: x.id,
      type: 'filters',
      subsystemLabel: SUBSYSTEM_SHORT_LABELS.filters,
      name: x.name,
      task: 'Thay lọc',
      date: x.nextReplace,
      status: resolveMilestoneStatus(x.manualStatus, x.nextReplace, false, referenceDate),
    });
  });

  db.hoses.forEach((x) => {
    const label = [x.equipment, x.code].filter(Boolean).join(' – ');
    items.push({
      id: x.id,
      type: 'hoses',
      subsystemLabel: SUBSYSTEM_SHORT_LABELS.hoses,
      name: label,
      task: 'Thay thế ống mềm',
      date: x.plannedReplace,
      status: resolveMilestoneStatus(x.manualStatus, x.plannedReplace, true, referenceDate),
    });
    items.push({
      id: x.id,
      type: 'hoses',
      subsystemLabel: SUBSYSTEM_SHORT_LABELS.hoses,
      name: label,
      task: 'Thử áp ống mềm',
      date: x.nextPressure,
      status: resolveMilestoneStatus(x.manualStatus, x.nextPressure, false, referenceDate),
    });
  });

  db.electrics.forEach((x) => {
    items.push({
      id: x.id,
      type: 'electrics',
      subsystemLabel: SUBSYSTEM_SHORT_LABELS.electrics,
      name: x.name,
      task: 'Bảo dưỡng hệ thống',
      date: x.nextInspect,
      status: resolveMilestoneStatus(x.manualStatus, x.nextInspect, true, referenceDate),
    });
  });

  (db.customWorkspaces ?? []).forEach((ws) => {
    const dueCols = getCustomWorkspaceDueColumns(ws);
    const tab = makeCustomWorkspaceTab(ws.id);
    ws.rows.forEach((row) => {
      const title = getCustomRowPrimaryTitle(ws, row);
      if (dueCols.length === 0) {
        items.push({
          id: row.id,
          type: tab,
          subsystemLabel: ws.name,
          name: title,
          task: ws.name,
          date: '',
          status: getCustomRowStatus(ws, row, referenceDate),
        });
      } else {
        dueCols.forEach((col, idx) => {
          const val = row.values[col.id] ?? '';
          items.push({
            id: row.id,
            type: tab,
            subsystemLabel: ws.name,
            name: title,
            task: col.label,
            date: val,
            status: resolveMilestoneStatus(row.manualStatus, val, idx === 0, referenceDate),
          });
        });
      }
    });
  });

  return items;
}

export function computeSubsystemBreakdowns(
  db: MaintenanceDB,
  referenceDate?: Date
): SubsystemBreakdown[] {
  const types: SubsystemType[] = ['tanks', 'filters', 'hoses', 'electrics'];
  const builtIn = types.map((type) => {
    const records = db[type];
    const counts = { overdue: 0, soon: 0, safe: 0, unknown: 0 };
    records.forEach((rec) => {
      const s = getRowStatus(type, rec, referenceDate);
      counts[s] += 1;
    });
    return {
      type,
      label: SUBSYSTEM_SHORT_LABELS[type],
      recordCount: records.length,
      ...counts,
    };
  });

  const custom = (db.customWorkspaces ?? []).map((ws) => {
    const counts = { overdue: 0, soon: 0, safe: 0, unknown: 0 };
    ws.rows.forEach((row) => {
      const s = getCustomRowStatus(ws, row, referenceDate);
      counts[s] += 1;
    });
    return {
      type: makeCustomWorkspaceTab(ws.id),
      label: ws.name,
      recordCount: ws.rows.length,
      ...counts,
    };
  });

  return [...builtIn, ...custom];
}

export function computeHorizonBuckets(
  db: MaintenanceDB,
  referenceDate?: Date
): HorizonBucket[] {
  const allDue = getDueItems(db, referenceDate);
  const buckets: HorizonBucket[] = [
    { key: 'overdue', label: 'Quá hạn', count: 0, tone: 'overdue' },
    { key: 'd30', label: '≤ 30 ngày', count: 0, tone: 'soon' },
    { key: 'm3', label: '1–3 tháng', count: 0, tone: 'safe' },
    { key: 'm6', label: '3–6 tháng', count: 0, tone: 'safe' },
    { key: 'm12', label: '6–12 tháng', count: 0, tone: 'safe' },
    { key: 'y1plus', label: '> 1 năm', count: 0, tone: 'neutral' },
  ];

  allDue.forEach((item) => {
    const days = getDaysRemaining(item.date, referenceDate);
    if (days === null) {
      if (item.status === 'overdue') buckets[0].count += 1;
      else if (item.status === 'soon') buckets[1].count += 1;
      return;
    }
    if (days < 0 || item.status === 'overdue') buckets[0].count += 1;
    else if (days <= 30 || item.status === 'soon') buckets[1].count += 1;
    else if (days <= 90) buckets[2].count += 1;
    else if (days <= 180) buckets[3].count += 1;
    else if (days <= 365) buckets[4].count += 1;
    else buckets[5].count += 1;
  });

  return buckets;
}

export function getAllStatusMatrixItems(
  db: MaintenanceDB,
  referenceDate?: Date
): MatrixItem[] {
  const result: MatrixItem[] = [];

  db.tanks.forEach((t) => {
    const milestones: MilestoneSummary[] = [
      { label: 'KT bể', date: t.nextInspect, status: getMaintenanceStatus(t.nextInspect, referenceDate) },
      { label: 'VS bể', date: t.nextClean, status: getMaintenanceStatus(t.nextClean, referenceDate) },
    ];
    const earliestDate = getEarliestDueDate('tanks', t);
    result.push({
      id: t.id,
      type: 'tanks',
      subsystemLabel: 'Bể chứa',
      title: t.position,
      subtitle: `Chu kỳ KT ${t.inspectCycle || '—'} · VS ${t.cleanCycle || '—'}`,
      status: getRowStatus('tanks', t, referenceDate),
      earliestDate,
      daysRemaining: getDaysRemaining(earliestDate, referenceDate),
      milestones,
      record: t,
    });
  });

  db.filters.forEach((f) => {
    const milestones: MilestoneSummary[] = [
      { label: 'KT lọc', date: f.nextInspect, status: getMaintenanceStatus(f.nextInspect, referenceDate) },
      { label: 'Thay lọc', date: f.nextReplace, status: getMaintenanceStatus(f.nextReplace, referenceDate) },
    ];
    const earliestDate = getEarliestDueDate('filters', f);
    result.push({
      id: f.id,
      type: 'filters',
      subsystemLabel: 'Bầu lọc',
      title: f.name.replace(/\n/g, ' · '),
      subtitle: `Model ${f.model || '—'} · Mở lọc ${f.openCount || '0'} lần`,
      status: getRowStatus('filters', f, referenceDate),
      earliestDate,
      daysRemaining: getDaysRemaining(earliestDate, referenceDate),
      milestones,
      record: f,
    });
  });

  db.hoses.forEach((h) => {
    const milestones: MilestoneSummary[] = [
      { label: 'Thay thế', date: h.plannedReplace, status: getMaintenanceStatus(h.plannedReplace, referenceDate) },
      { label: 'Thử áp', date: h.nextPressure, status: getMaintenanceStatus(h.nextPressure, referenceDate) },
    ];
    const earliestDate = getEarliestDueDate('hoses', h);
    result.push({
      id: h.id,
      type: 'hoses',
      subsystemLabel: 'Ống mềm',
      title: `${h.equipment} (${h.position || h.location})`,
      subtitle: `${h.brand || '—'} · ${h.code.replace(/\n/g, ' ')}`,
      status: getRowStatus('hoses', h, referenceDate),
      earliestDate,
      daysRemaining: getDaysRemaining(earliestDate, referenceDate),
      milestones,
      record: h,
    });
  });

  db.electrics.forEach((e) => {
    const milestones: MilestoneSummary[] = [
      { label: 'Bảo dưỡng', date: e.nextInspect, status: getMaintenanceStatus(e.nextInspect, referenceDate) },
    ];
    const earliestDate = getEarliestDueDate('electrics', e);
    result.push({
      id: e.id,
      type: 'electrics',
      subsystemLabel: 'Hệ thống điện',
      title: e.name,
      subtitle: `Chu kỳ: ${e.cycle || '—'}`,
      status: getRowStatus('electrics', e, referenceDate),
      earliestDate,
      daysRemaining: getDaysRemaining(earliestDate, referenceDate),
      milestones,
      record: e,
    });
  });

  (db.customWorkspaces ?? []).forEach((ws) => {
    const tab = makeCustomWorkspaceTab(ws.id);
    const dueCols = getCustomWorkspaceDueColumns(ws);
    ws.rows.forEach((row) => {
      const title = getCustomRowPrimaryTitle(ws, row);
      const secondaryCols = ws.columns
        .filter((c) => !c.isPrimary && c.type !== 'date')
        .slice(0, 2)
        .map((c) => `${c.label}: ${row.values[c.id] || '—'}`)
        .join(' · ');
      const milestones: MilestoneSummary[] = dueCols.map((c) => ({
        label: c.label,
        date: row.values[c.id] ?? '',
        status: getMaintenanceStatus(row.values[c.id], referenceDate),
      }));
      const earliestDate = getCustomRowEarliestDueDate(ws, row);
      result.push({
        id: row.id,
        type: tab,
        subsystemLabel: ws.name,
        title,
        subtitle: secondaryCols || ws.subtitle || 'Không gian tùy chỉnh',
        status: getCustomRowStatus(ws, row, referenceDate),
        earliestDate,
        daysRemaining: getDaysRemaining(earliestDate, referenceDate),
        milestones,
        customRow: row,
      });
    });
  });

  const rank: Record<MaintenanceStatus, number> = {
    overdue: 0,
    soon: 1,
    safe: 2,
    unknown: 3,
  };

  return result.sort((a, b) => {
    if (rank[a.status] !== rank[b.status]) return rank[a.status] - rank[b.status];
    if (a.daysRemaining !== null && b.daysRemaining !== null) {
      return a.daysRemaining - b.daysRemaining;
    }
    if (a.daysRemaining !== null) return -1;
    if (b.daysRemaining !== null) return 1;
    return a.title.localeCompare(b.title, 'vi');
  });
}

export function getAlertItems(
  db: MaintenanceDB,
  referenceDate?: Date
): AlertItem[] {
  return getAllStatusMatrixItems(db, referenceDate)
    .filter(
      (item): item is MatrixItem & { status: 'overdue' | 'soon' } =>
        item.status === 'overdue' || item.status === 'soon'
    )
    .map((item) => ({
      id: item.id,
      tab: item.type,
      subsystemLabel: item.subsystemLabel,
      title: item.title,
      dueDate: item.earliestDate,
      daysRemaining: item.daysRemaining,
      status: item.status,
    }));
}

export function computeDashboardStats(db: MaintenanceDB, referenceDate?: Date): DashboardStats {
  const allDue = getDueItems(db, referenceDate);
  let safeCount = 0;
  let soonCount = 0;
  let overdueCount = 0;
  let unknownCount = 0;

  allDue.forEach((item) => {
    if (item.status === 'safe') safeCount += 1;
    else if (item.status === 'soon') soonCount += 1;
    else if (item.status === 'overdue') overdueCount += 1;
    else unknownCount += 1;
  });

  const knownDueTotal = safeCount + soonCount + overdueCount;
  const complianceRate =
    knownDueTotal > 0 ? Math.round(((safeCount + soonCount) / knownDueTotal) * 100) : 100;

  const priorityItems = allDue
    .filter((item) => item.status === 'overdue' || item.status === 'soon')
    .sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === 'overdue' ? -1 : 1;
      }
      const da = parseDate(a.date)?.getTime() ?? 0;
      const dbTime = parseDate(b.date)?.getTime() ?? 0;
      return da - dbTime;
    })
    .slice(0, 12);

  const customWorkspaces = db.customWorkspaces ?? [];
  const customTotal = customWorkspaces.reduce((sum, ws) => sum + ws.rows.length, 0);

  return {
    totalRecords:
      db.tanks.length +
      db.filters.length +
      db.hoses.length +
      db.electrics.length +
      customTotal,
    safeCount,
    soonCount,
    overdueCount,
    unknownCount,
    knownDueTotal,
    complianceRate,
    categoryCounts: [
      { type: 'tanks', label: 'Bể chứa', count: db.tanks.length },
      { type: 'filters', label: 'Bầu lọc', count: db.filters.length },
      { type: 'hoses', label: 'Ống mềm', count: db.hoses.length },
      { type: 'electrics', label: 'Hệ thống điện', count: db.electrics.length },
      ...customWorkspaces.map((ws) => ({
        type: makeCustomWorkspaceTab(ws.id),
        label: ws.name,
        count: ws.rows.length,
      })),
    ],
    subsystemBreakdowns: computeSubsystemBreakdowns(db, referenceDate),
    horizonBuckets: computeHorizonBuckets(db, referenceDate),
    priorityItems,
  };
}

export function applyCycleCalculations(
  type: SubsystemType,
  draft: Record<string, string>
): Record<string, string> {
  const next = { ...draft };
  if (type === 'tanks') {
    next.nextInspect = addCycle(next.lastInspect, next.inspectCycle) || next.nextInspect || '';
    next.nextClean = addCycle(next.lastClean, next.cleanCycle) || next.nextClean || '';
  } else if (type === 'filters') {
    next.nextInspect = addCycle(next.lastInspect, '1 năm') || next.nextInspect || '';
    next.nextReplace = addCycle(next.lastReplace, '3 năm') || next.nextReplace || '';
  } else if (type === 'electrics') {
    next.nextInspect = addCycle(next.lastInspect, next.cycle) || next.nextInspect || '';
  }
  return next;
}

function uniqueSortedValues(records: AnyRecord[], key: string): string[] {
  const set = new Set<string>();
  records.forEach((rec) => {
    const val = String((rec as unknown as Record<string, unknown>)[key] ?? '').trim();
    if (val) set.add(val);
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'vi'));
}

export function getSubsystemFacets(
  type: SubsystemType,
  records: AnyRecord[]
): FacetDefinition[] {
  if (type === 'tanks') {
    return [
      { key: 'inspectCycle', label: 'Chu kỳ kiểm tra', options: uniqueSortedValues(records, 'inspectCycle') },
      { key: 'cleanCycle', label: 'Chu kỳ vệ sinh', options: uniqueSortedValues(records, 'cleanCycle') },
    ];
  }
  if (type === 'filters') {
    return [
      { key: 'model', label: 'Model bầu lọc', options: uniqueSortedValues(records, 'model') },
      { key: 'openCountBand', label: 'Số lần mở lọc', options: ['0–1 lần', '2+ lần'] },
    ];
  }
  if (type === 'hoses') {
    return [
      { key: 'location', label: 'Vị trí giàn', options: uniqueSortedValues(records, 'location') },
      { key: 'brand', label: 'Hãng sản xuất', options: uniqueSortedValues(records, 'brand') },
      { key: 'type', label: 'Phân loại (Type)', options: uniqueSortedValues(records, 'type') },
      { key: 'pressureCycle', label: 'Chu kỳ thử áp', options: uniqueSortedValues(records, 'pressureCycle') },
    ];
  }
  return [
    { key: 'cycle', label: 'Chu kỳ bảo dưỡng', options: uniqueSortedValues(records, 'cycle') },
  ];
}

function getRecordPrimaryName(type: SubsystemType, rec: AnyRecord): string {
  if (type === 'tanks') return (rec as TankRecord).position;
  if (type === 'filters') return (rec as FilterRecord).name;
  if (type === 'hoses') return (rec as HoseRecord).equipment;
  return (rec as ElectricRecord).name;
}

export function filterRecords<T extends AnyRecord>(
  type: SubsystemType,
  records: T[],
  query: string,
  statusFilter: MaintenanceStatus | '',
  referenceDate?: Date
): T[] {
  return filterAndSortRecords(
    type,
    records,
    { query, status: statusFilter, sort: 'default', facets: {} },
    referenceDate
  );
}

export function filterAndSortRecords<T extends AnyRecord>(
  type: SubsystemType,
  records: T[],
  filterState: SubsystemFilterState,
  referenceDate?: Date
): T[] {
  const q = filterState.query.trim().toLowerCase();

  const filtered = records.filter((record) => {
    if (q) {
      const hay = Object.values(record)
        .map((v) => String(v ?? '').toLowerCase())
        .join(' ');
      if (!hay.includes(q)) return false;
    }

    if (filterState.status) {
      if (getRowStatus(type, record, referenceDate) !== filterState.status) {
        return false;
      }
    }

    const rowMap = record as unknown as Record<string, unknown>;
    for (const [facetKey, facetVal] of Object.entries(filterState.facets)) {
      if (!facetVal) continue;
      if (facetKey === 'openCountBand') {
        const countNum = Number(rowMap.openCount ?? 0);
        if (facetVal === '0–1 lần' && countNum > 1) return false;
        if (facetVal === '2+ lần' && countNum < 2) return false;
      } else {
        const actual = String(rowMap[facetKey] ?? '').trim();
        if (actual !== facetVal) return false;
      }
    }

    return true;
  });

  if (filterState.sort === 'name_asc') {
    return [...filtered].sort((a, b) =>
      getRecordPrimaryName(type, a).localeCompare(getRecordPrimaryName(type, b), 'vi')
    );
  }

  if (filterState.sort === 'earliest_due') {
    return [...filtered].sort((a, b) => {
      const da = getDaysRemaining(getEarliestDueDate(type, a), referenceDate);
      const dbDays = getDaysRemaining(getEarliestDueDate(type, b), referenceDate);
      if (da !== null && dbDays !== null) return da - dbDays;
      if (da !== null) return -1;
      if (dbDays !== null) return 1;
      return 0;
    });
  }

  return filtered;
}

export function filterAndSortCustomRows(
  workspace: CustomWorkspace,
  query: string,
  statusFilter: MaintenanceStatus | '',
  sortMode: SortMode,
  referenceDate?: Date
): CustomRowRecord[] {
  const q = query.trim().toLowerCase();

  const filtered = workspace.rows.filter((row) => {
    if (q) {
      const hay = Object.values(row.values)
        .map((v) => String(v ?? '').toLowerCase())
        .join(' ');
      if (!hay.includes(q)) return false;
    }
    if (statusFilter) {
      if (getCustomRowStatus(workspace, row, referenceDate) !== statusFilter) {
        return false;
      }
    }
    return true;
  });

  if (sortMode === 'name_asc') {
    return [...filtered].sort((a, b) =>
      getCustomRowPrimaryTitle(workspace, a).localeCompare(
        getCustomRowPrimaryTitle(workspace, b),
        'vi'
      )
    );
  }

  if (sortMode === 'earliest_due') {
    return [...filtered].sort((a, b) => {
      const da = getDaysRemaining(getCustomRowEarliestDueDate(workspace, a), referenceDate);
      const dbDays = getDaysRemaining(getCustomRowEarliestDueDate(workspace, b), referenceDate);
      if (da !== null && dbDays !== null) return da - dbDays;
      if (da !== null) return -1;
      if (dbDays !== null) return 1;
      return 0;
    });
  }

  return filtered;
}
