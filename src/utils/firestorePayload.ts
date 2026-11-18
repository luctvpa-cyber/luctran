import type {
  AnyRecord,
  CustomColumnDef,
  CustomRowRecord,
  CustomWorkspace,
  ElectricRecord,
  FilterRecord,
  HoseRecord,
  MaintenanceStatus,
  SubsystemType,
  TankRecord,
} from '../types/maintenance';

const VALID_STATUSES = new Set<MaintenanceStatus | ''>([
  '',
  'overdue',
  'soon',
  'safe',
  'unknown',
]);

export function clampStr(value: unknown, maxLen: number): string {
  return String(value ?? '').slice(0, maxLen);
}

export function sanitizeId(raw: string, fallbackPrefix: string): string {
  const cleaned = String(raw ?? '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 128);
  return cleaned || `${fallbackPrefix}-${Date.now()}`;
}

export function sanitizeManualStatus(value: unknown): MaintenanceStatus | '' {
  const s = String(value ?? '') as MaintenanceStatus | '';
  return VALID_STATUSES.has(s) ? s : '';
}

export function sanitizeEmailList(emails: string[]): string[] {
  const unique = Array.from(
    new Set(
      emails
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e.includes('@') && e.length <= 160)
    )
  );
  return unique.slice(0, 20);
}

export function buildSubsystemRecordFields(
  type: SubsystemType,
  rec: AnyRecord
): Record<string, string> {
  if (type === 'tanks') {
    const t = rec as TankRecord;
    return {
      stt: clampStr(t.stt, 32),
      position: clampStr(t.position, 200) || 'Chưa đặt tên',
      lastInspect: clampStr(t.lastInspect, 64),
      lastClean: clampStr(t.lastClean, 64),
      inspectCycle: clampStr(t.inspectCycle, 64),
      cleanCycle: clampStr(t.cleanCycle, 64),
      nextInspect: clampStr(t.nextInspect, 64),
      nextClean: clampStr(t.nextClean, 64),
      note: clampStr(t.note, 1000),
      manualStatus: sanitizeManualStatus(t.manualStatus),
    };
  }
  if (type === 'filters') {
    const f = rec as FilterRecord;
    return {
      name: clampStr(f.name, 300) || 'Chưa đặt tên',
      model: clampStr(f.model, 120),
      lastInspect: clampStr(f.lastInspect, 64),
      nextInspect: clampStr(f.nextInspect, 64),
      lastReplace: clampStr(f.lastReplace, 64),
      nextReplace: clampStr(f.nextReplace, 64),
      coalescerMfg: clampStr(f.coalescerMfg, 120),
      coalescerInstall: clampStr(f.coalescerInstall, 64),
      separatorMfg: clampStr(f.separatorMfg, 120),
      separatorInstall: clampStr(f.separatorInstall, 64),
      openCount: clampStr(f.openCount, 32),
      note: clampStr(f.note, 1000),
      manualStatus: sanitizeManualStatus(f.manualStatus),
    };
  }
  if (type === 'hoses') {
    const h = rec as HoseRecord;
    return {
      group: clampStr(h.group, 120),
      location: clampStr(h.location, 160),
      position: clampStr(h.position, 160),
      equipment: clampStr(h.equipment, 300) || 'Chưa đặt tên',
      code: clampStr(h.code, 160),
      brand: clampStr(h.brand, 120),
      mfgDate: clampStr(h.mfgDate, 64),
      type: clampStr(h.type, 120),
      quantity: clampStr(h.quantity, 32),
      installDate: clampStr(h.installDate, 64),
      installedQty: clampStr(h.installedQty, 32),
      plannedReplace: clampStr(h.plannedReplace, 64),
      stock: clampStr(h.stock, 32),
      replaceCycle: clampStr(h.replaceCycle, 64),
      lastPressure: clampStr(h.lastPressure, 64),
      nextPressure: clampStr(h.nextPressure, 64),
      pressureCycle: clampStr(h.pressureCycle, 64),
      note: clampStr(h.note, 1000),
      manualStatus: sanitizeManualStatus(h.manualStatus),
    };
  }
  const e = rec as ElectricRecord;
  return {
    name: clampStr(e.name, 300) || 'Chưa đặt tên',
    lastInspect: clampStr(e.lastInspect, 64),
    cycle: clampStr(e.cycle, 64),
    nextInspect: clampStr(e.nextInspect, 64),
    note: clampStr(e.note, 1000),
    manualStatus: sanitizeManualStatus(e.manualStatus),
  };
}

export function sanitizeCustomColumns(
  cols?: CustomColumnDef[] | null
): CustomColumnDef[] {
  const safeCols = Array.isArray(cols) ? cols : [];
  const limited = safeCols.slice(0, 30).map((col, idx) => ({
    id: sanitizeId(col?.id ?? '', `col_${idx + 1}`),
    label: clampStr(col?.label, 120) || `Cột ${idx + 1}`,
    type: (['text', 'date', 'number', 'textarea'].includes(col?.type)
      ? col.type
      : 'text') as CustomColumnDef['type'],
    required: Boolean(col?.required),
    isPrimary: Boolean(col?.isPrimary),
    isDueDate: col?.type === 'date' ? Boolean(col?.isDueDate) : false,
  }));

  if (limited.length === 0) {
    return [
      {
        id: 'col_name',
        label: 'Tên thiết bị / Hạng mục',
        type: 'text',
        required: true,
        isPrimary: true,
        isDueDate: false,
      },
    ];
  }
  if (!limited.some((c) => c.isPrimary)) {
    limited[0].isPrimary = true;
  }
  return limited;
}

export function sanitizeCustomRowValues(
  values?: Record<string, string> | null
): Record<string, string> {
  const result: Record<string, string> = {};
  Object.entries(values ?? {})
    .slice(0, 40)
    .forEach(([k, v]) => {
      const cleanKey = clampStr(k, 80);
      if (cleanKey) {
        result[cleanKey] = clampStr(v, 1000);
      }
    });
  return result;
}

export function sortByOrder<T extends { sortOrder?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function assembleCustomWorkspaces(
  wsDocs: Array<Omit<CustomWorkspace, 'rows'> & { sortOrder?: number }>,
  rowDocs: Array<CustomRowRecord & { workspaceId: string; sortOrder?: number }>
): CustomWorkspace[] {
  const sortedWs = sortByOrder(wsDocs);
  const rowsByWs = new Map<string, Array<CustomRowRecord & { sortOrder?: number }>>();
  rowDocs.forEach((row) => {
    const list = rowsByWs.get(row.workspaceId) ?? [];
    list.push(row);
    rowsByWs.set(row.workspaceId, list);
  });

  return sortedWs.map((ws) => ({
    id: ws.id,
    name: ws.name,
    subtitle: ws.subtitle,
    description: ws.description,
    columns: ws.columns,
    rows: sortByOrder(rowsByWs.get(ws.id) ?? []).map(({ id, values, manualStatus }) => ({
      id,
      values,
      manualStatus: manualStatus ?? '',
    })),
  }));
}
