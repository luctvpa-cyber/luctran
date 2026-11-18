export type SubsystemType = 'tanks' | 'filters' | 'hoses' | 'electrics';

export type CustomWorkspaceTab = `ws:${string}`;

export type NavTab = 'dashboard' | SubsystemType | CustomWorkspaceTab;

export type MaintenanceStatus = 'overdue' | 'soon' | 'safe' | 'unknown';

export interface TankRecord {
  id: string;
  stt?: string;
  position: string;
  lastInspect: string;
  lastClean: string;
  inspectCycle: string;
  cleanCycle: string;
  nextInspect: string;
  nextClean: string;
  note: string;
  manualStatus?: MaintenanceStatus | '';
}

export interface FilterRecord {
  id: string;
  name: string;
  model: string;
  lastInspect: string;
  nextInspect: string;
  lastReplace: string;
  nextReplace: string;
  coalescerMfg: string;
  coalescerInstall: string;
  separatorMfg: string;
  separatorInstall: string;
  openCount: string;
  note: string;
  manualStatus?: MaintenanceStatus | '';
}

export interface HoseRecord {
  id: string;
  group: string;
  location: string;
  position: string;
  equipment: string;
  code: string;
  brand: string;
  mfgDate: string;
  type: string;
  quantity: string;
  installDate: string;
  installedQty: string;
  plannedReplace: string;
  stock: string;
  replaceCycle: string;
  lastPressure: string;
  nextPressure: string;
  pressureCycle: string;
  note: string;
  manualStatus?: MaintenanceStatus | '';
}

export interface ElectricRecord {
  id: string;
  name: string;
  lastInspect: string;
  cycle: string;
  nextInspect: string;
  note: string;
  manualStatus?: MaintenanceStatus | '';
}

export type CustomColumnType = 'text' | 'date' | 'number' | 'textarea';

export interface CustomColumnDef {
  id: string;
  label: string;
  type: CustomColumnType;
  required?: boolean;
  isPrimary?: boolean;
  isDueDate?: boolean;
}

export interface CustomRowRecord {
  id: string;
  values: Record<string, string>;
  manualStatus?: MaintenanceStatus | '';
}

export interface CustomWorkspace {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  columns: CustomColumnDef[];
  rows: CustomRowRecord[];
}

export interface MaintenanceDB {
  tanks: TankRecord[];
  filters: FilterRecord[];
  hoses: HoseRecord[];
  electrics: ElectricRecord[];
  customWorkspaces: CustomWorkspace[];
}

export type AnyRecord = TankRecord | FilterRecord | HoseRecord | ElectricRecord;

export interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'textarea';
  required?: boolean;
  placeholder?: string;
}

export interface ColumnConfig {
  key: string;
  label: string;
  isPrimary?: boolean;
  isNumeric?: boolean;
}

export interface SubsystemConfig {
  type: SubsystemType;
  title: string;
  sub: string;
  desc: string;
  fields: FieldConfig[];
  cols: ColumnConfig[];
}

export interface DueItem {
  id: string;
  type: SubsystemType | CustomWorkspaceTab;
  subsystemLabel: string;
  name: string;
  task: string;
  date: string;
  status: MaintenanceStatus;
}

export interface AlertItem {
  id: string;
  tab: SubsystemType | CustomWorkspaceTab;
  subsystemLabel: string;
  title: string;
  dueDate: string;
  daysRemaining: number | null;
  status: 'overdue' | 'soon';
}

export interface SubsystemBreakdown {
  type: SubsystemType | CustomWorkspaceTab;
  label: string;
  recordCount: number;
  overdue: number;
  soon: number;
  safe: number;
  unknown: number;
}

export interface HorizonBucket {
  key: string;
  label: string;
  count: number;
  tone: 'overdue' | 'soon' | 'safe' | 'neutral';
}

export interface MilestoneSummary {
  label: string;
  date: string;
  status: MaintenanceStatus;
}

export interface MatrixItem {
  id: string;
  type: SubsystemType | CustomWorkspaceTab;
  subsystemLabel: string;
  title: string;
  subtitle: string;
  status: MaintenanceStatus;
  earliestDate: string;
  daysRemaining: number | null;
  milestones: MilestoneSummary[];
  record?: AnyRecord;
  customRow?: CustomRowRecord;
}

export interface DashboardStats {
  totalRecords: number;
  safeCount: number;
  soonCount: number;
  overdueCount: number;
  unknownCount: number;
  knownDueTotal: number;
  complianceRate: number;
  categoryCounts: Array<{
    type: SubsystemType | CustomWorkspaceTab;
    label: string;
    count: number;
  }>;
  subsystemBreakdowns: SubsystemBreakdown[];
  horizonBuckets: HorizonBucket[];
  priorityItems: DueItem[];
}

export type SortMode = 'default' | 'earliest_due' | 'name_asc';

export interface SubsystemFilterState {
  query: string;
  status: MaintenanceStatus | '';
  sort: SortMode;
  facets: Record<string, string>;
}

export interface FacetDefinition {
  key: string;
  label: string;
  options: string[];
}
