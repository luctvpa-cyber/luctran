import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultCustomColumns, INITIAL_DB } from '../data/initialData';
import type { CustomWorkspace } from '../types/maintenance';
import {
  addCycle,
  applyCycleCalculations,
  computeDashboardStats,
  computeHorizonBuckets,
  computeSubsystemBreakdowns,
  filterAndSortCustomRows,
  filterAndSortRecords,
  filterRecords,
  formatDaysRemaining,
  getAlertItems,
  getAllStatusMatrixItems,
  getCustomRowStatus,
  getDaysRemaining,
  getMaintenanceStatus,
  getRowStatus,
  getSubsystemFacets,
  makeCustomWorkspaceTab,
  parseDate,
  toInputDateValue,
} from './maintenance';

test('parseDate supports ISO and DD/MM/YYYY formats and rejects non-dates', () => {
  const iso = parseDate('2026-03-19');
  assert.ok(iso);
  assert.equal(iso.getFullYear(), 2026);
  assert.equal(iso.getMonth(), 2);
  assert.equal(iso.getDate(), 19);

  const vn = parseDate('20/10/2026');
  assert.ok(vn);
  assert.equal(vn.getFullYear(), 2026);
  assert.equal(vn.getMonth(), 9);
  assert.equal(vn.getDate(), 20);

  assert.equal(parseDate('3Q27'), null);
  assert.equal(parseDate('N/A'), null);
  assert.equal(parseDate(''), null);
});

test('toInputDateValue normalizes DD/MM/YYYY to YYYY-MM-DD for HTML date inputs', () => {
  assert.equal(toInputDateValue('20/10/2026'), '2026-10-20');
  assert.equal(toInputDateValue('2026-03-19'), '2026-03-19');
  assert.equal(toInputDateValue('N/A'), '');
});

test('addCycle computes next dates accurately for Vietnamese cycle strings', () => {
  assert.equal(addCycle('2026-03-19', '01 năm'), '2027-03-19');
  assert.equal(addCycle('2025-03-19', '05 năm'), '2030-03-19');
  assert.equal(addCycle('2026-09-28', 'Hàng quý'), '2026-12-28');
  assert.equal(addCycle('2026-08-28', '4 tháng'), '2026-12-28');
  assert.equal(addCycle('2026-11-01', '6 tháng'), '2027-05-01');
  assert.equal(addCycle('20/10/2026', '01 năm'), '2027-10-20');
});

test('getDaysRemaining and formatDaysRemaining compute accurate deltas', () => {
  const ref = new Date(2026, 10, 17);
  assert.equal(getDaysRemaining('2026-11-17', ref), 0);
  assert.equal(getDaysRemaining('2026-11-12', ref), -5);
  assert.equal(getDaysRemaining('2026-11-27', ref), 10);
  assert.equal(getDaysRemaining('3Q27', ref), null);
  assert.equal(formatDaysRemaining(0), 'Đến hạn hôm nay');
  assert.equal(formatDaysRemaining(-5), 'Quá hạn 5 ngày');
  assert.equal(formatDaysRemaining(10), 'Còn 10 ngày');
  assert.equal(formatDaysRemaining(null), 'Chưa có ngày cụ thể');
});

test('getMaintenanceStatus classifies overdue, soon, safe, and unknown relative to reference date', () => {
  const ref = new Date(2026, 10, 17);
  assert.equal(getMaintenanceStatus('2026-11-10', ref), 'overdue');
  assert.equal(getMaintenanceStatus('2026-12-10', ref), 'soon');
  assert.equal(getMaintenanceStatus('2026-12-17', ref), 'soon');
  assert.equal(getMaintenanceStatus('2027-03-19', ref), 'safe');
  assert.equal(getMaintenanceStatus('3Q27', ref), 'unknown');
});

test('getRowStatus prioritizes overdue over soon and safe', () => {
  const ref = new Date(2026, 10, 17);
  assert.equal(
    getRowStatus(
      'tanks',
      {
        id: 't1',
        position: 'CXR-01',
        lastInspect: '2025-11-01',
        lastClean: '2025-03-19',
        inspectCycle: '01 năm',
        cleanCycle: '05 năm',
        nextInspect: '2026-11-01',
        nextClean: '2030-03-19',
        note: '',
      },
      ref
    ),
    'overdue'
  );
  assert.equal(getRowStatus('electrics', INITIAL_DB.electrics[1], ref), 'unknown');
});

test('applyCycleCalculations updates next dates on tank, filter, and electric records', () => {
  const tank = applyCycleCalculations('tanks', {
    position: 'CXR-05',
    lastInspect: '2026-01-15',
    inspectCycle: '01 năm',
    lastClean: '2026-01-15',
    cleanCycle: '05 năm',
  });
  assert.equal(tank.nextInspect, '2027-01-15');
  assert.equal(tank.nextClean, '2031-01-15');

  const filter = applyCycleCalculations('filters', {
    name: 'Lọc test',
    lastInspect: '2026-06-01',
    lastReplace: '2026-06-01',
  });
  assert.equal(filter.nextInspect, '2027-06-01');
  assert.equal(filter.nextReplace, '2029-06-01');

  const electric = applyCycleCalculations('electrics', {
    name: 'Kiểm tra chống sét',
    lastInspect: '2026-11-01',
    cycle: '6 tháng',
  });
  assert.equal(electric.nextInspect, '2027-05-01');
});

test('computeSubsystemBreakdowns, computeHorizonBuckets, and getAllStatusMatrixItems work consistently', () => {
  const ref = new Date(2026, 11, 1); // 2026-12-01
  const breakdowns = computeSubsystemBreakdowns(INITIAL_DB, ref);
  assert.equal(breakdowns.length, 4);
  assert.equal(breakdowns[0].type, 'tanks');
  assert.equal(breakdowns[0].safe, 4);
  assert.equal(breakdowns[3].type, 'electrics');
  assert.equal(breakdowns[3].soon, 4);
  assert.equal(breakdowns[3].unknown, 1);

  const buckets = computeHorizonBuckets(INITIAL_DB, ref);
  assert.equal(buckets[0].key, 'overdue');
  assert.equal(buckets[0].count, 0);
  assert.equal(buckets[1].key, 'd30');
  assert.equal(buckets[1].count, 4);

  const matrix = getAllStatusMatrixItems(INITIAL_DB, ref);
  assert.equal(matrix.length, 20);
  assert.equal(matrix[0].status, 'soon');
});

test('computeDashboardStats aggregates initial 20 records and priority items accurately', () => {
  const ref = new Date(2026, 11, 1);
  const stats = computeDashboardStats(INITIAL_DB, ref);
  assert.equal(stats.totalRecords, 20);
  assert.equal(stats.soonCount, 4);
  assert.equal(stats.overdueCount, 0);
  assert.equal(stats.priorityItems.length, 4);
  assert.equal(stats.complianceRate, 100);
});

test('filterRecords and filterAndSortRecords support multi-facet subsystem filtering and sorting', () => {
  const ref = new Date(2026, 11, 1);
  const byQuery = filterRecords('tanks', INITIAL_DB.tanks, 'CXR-04', '', ref);
  assert.equal(byQuery.length, 1);
  assert.equal(byQuery[0].position, 'CXR-04');

  const hoseFacets = getSubsystemFacets('hoses', INITIAL_DB.hoses);
  assert.equal(hoseFacets.length, 4);
  assert.ok(hoseFacets.find((f) => f.key === 'brand')?.options.includes('ELAFLEX'));

  const elaflexHoses = filterAndSortRecords(
    'hoses',
    INITIAL_DB.hoses,
    { query: '', status: '', sort: 'default', facets: { brand: 'ELAFLEX' } },
    ref
  );
  assert.equal(elaflexHoses.length, 1);
  assert.equal(elaflexHoses[0].brand, 'ELAFLEX');

  const filterFacets = getSubsystemFacets('filters', INITIAL_DB.filters);
  assert.equal(filterFacets[0].key, 'model');
  const highOpenFilters = filterAndSortRecords(
    'filters',
    INITIAL_DB.filters,
    { query: '', status: '', sort: 'name_asc', facets: { openCountBand: '2+ lần' } },
    ref
  );
  assert.equal(highOpenFilters.length, 3);
  assert.equal(highOpenFilters[0].name, 'Lọc Vân Phong 01\nVị trí xuất P12');
});

test('manualStatus overrides automatic date status in row status and dashboard stats', () => {
  const ref = new Date(2026, 10, 17);
  const customDb = structuredClone(INITIAL_DB);
  customDb.tanks[0].manualStatus = 'overdue';
  customDb.hoses[0].manualStatus = 'soon';

  assert.equal(getRowStatus('tanks', customDb.tanks[0], ref), 'overdue');
  assert.equal(getRowStatus('hoses', customDb.hoses[0], ref), 'soon');

  const stats = computeDashboardStats(customDb, ref);
  assert.equal(stats.overdueCount, 1);
  assert.equal(stats.soonCount, 1);
  assert.equal(stats.subsystemBreakdowns[0].overdue, 1);
  assert.equal(stats.subsystemBreakdowns[2].soon, 1);
});

test('custom workspaces integrate with row status, filtering, dashboard stats, and alert notifications', () => {
  const ref = new Date(2026, 10, 17);
  const ws: CustomWorkspace = {
    id: 'pumps',
    name: 'Cụm bơm & Van',
    subtitle: 'THIẾT BỊ ĐỘNG LỰC',
    description: 'Theo dõi cụm bơm cấp nhiên liệu',
    columns: createDefaultCustomColumns(),
    rows: [
      {
        id: 'row-1',
        values: {
          col_name: 'Bơm P-01',
          col_last_date: '2025-11-01',
          col_cycle: '01 năm',
          col_next_date: '2026-11-05',
          col_note: 'Cần kiểm tra phớt',
        },
      },
      {
        id: 'row-2',
        values: {
          col_name: 'Bơm P-02',
          col_last_date: '2026-10-01',
          col_cycle: '01 năm',
          col_next_date: '2027-10-01',
          col_note: '',
        },
      },
    ],
  };

  assert.equal(getCustomRowStatus(ws, ws.rows[0], ref), 'overdue');
  assert.equal(getCustomRowStatus(ws, ws.rows[1], ref), 'safe');

  const overdueOnly = filterAndSortCustomRows(ws, '', 'overdue', 'default', ref);
  assert.equal(overdueOnly.length, 1);
  assert.equal(overdueOnly[0].id, 'row-1');

  const byQuery = filterAndSortCustomRows(ws, 'P-02', '', 'name_asc', ref);
  assert.equal(byQuery.length, 1);
  assert.equal(byQuery[0].id, 'row-2');

  const dbWithCustom = {
    ...structuredClone(INITIAL_DB),
    customWorkspaces: [ws],
  };
  const stats = computeDashboardStats(dbWithCustom, ref);
  assert.equal(stats.totalRecords, 22);
  assert.equal(stats.overdueCount, 1);
  assert.equal(stats.subsystemBreakdowns.length, 5);
  assert.equal(stats.subsystemBreakdowns[4].type, makeCustomWorkspaceTab('pumps'));

  const alerts = getAlertItems(dbWithCustom, ref);
  assert.equal(alerts[0].id, 'row-1');
  assert.equal(alerts[0].tab, 'ws:pumps');
  assert.equal(alerts[0].status, 'overdue');
  assert.equal(alerts[0].daysRemaining, -12);
});

