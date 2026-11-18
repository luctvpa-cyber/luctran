import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assembleCustomWorkspaces,
  buildSubsystemRecordFields,
  clampStr,
  sanitizeCustomColumns,
  sanitizeCustomRowValues,
  sanitizeEmailList,
  sanitizeId,
  sanitizeManualStatus,
  sortByOrder,
} from './firestorePayload';

test('clampStr and sanitizeId enforce safe lengths and Firestore document ID characters', () => {
  assert.equal(clampStr('abcdef', 3), 'abc');
  assert.equal(clampStr(null, 5), '');
  assert.equal(sanitizeId('tank/01 test!', 't'), 'tank_01_test_');
  assert.ok(sanitizeId('   ', 'ws').startsWith('ws-'));
});

test('sanitizeManualStatus validates allowed maintenance statuses', () => {
  assert.equal(sanitizeManualStatus('overdue'), 'overdue');
  assert.equal(sanitizeManualStatus('soon'), 'soon');
  assert.equal(sanitizeManualStatus('safe'), 'safe');
  assert.equal(sanitizeManualStatus('unknown'), 'unknown');
  assert.equal(sanitizeManualStatus(''), '');
  assert.equal(sanitizeManualStatus('invalid_status'), '');
});

test('sanitizeEmailList normalizes, deduplicates, filters invalid emails, and caps at 20', () => {
  const input = [
    '  Admin@Example.com ',
    'admin@example.com',
    'not-an-email',
    ...Array.from({ length: 25 }, (_, i) => `user${i}@example.com`),
  ];
  const result = sanitizeEmailList(input);
  assert.equal(result.length, 20);
  assert.equal(result[0], 'admin@example.com');
  assert.ok(!result.includes('not-an-email'));
});

test('buildSubsystemRecordFields clamps lengths and provides default names', () => {
  const tankFields = buildSubsystemRecordFields('tanks', {
    id: 't1',
    position: '',
    lastInspect: '2026-01-01',
    lastClean: '2026-01-01',
    inspectCycle: '01 năm',
    cleanCycle: '05 năm',
    nextInspect: '2027-01-01',
    nextClean: '2031-01-01',
    note: 'x'.repeat(1200),
    manualStatus: 'safe',
  });
  assert.equal(tankFields.position, 'Chưa đặt tên');
  assert.equal(tankFields.note.length, 1000);
  assert.equal(tankFields.manualStatus, 'safe');

  const hoseFields = buildSubsystemRecordFields('hoses', {
    id: 'h1',
    group: 'G1',
    location: 'Loc',
    position: 'Pos',
    equipment: 'Ống mềm A',
    code: 'C1',
    brand: 'ELAFLEX',
    mfgDate: '2025-01-01',
    type: 'T1',
    quantity: '2',
    installDate: '2025-02-01',
    installedQty: '2',
    plannedReplace: '2028-02-01',
    stock: '1',
    replaceCycle: '03 năm',
    lastPressure: '2026-01-01',
    nextPressure: '2026-07-01',
    pressureCycle: '6 tháng',
    note: '',
    manualStatus: 'invalid' as never,
  });
  assert.equal(hoseFields.brand, 'ELAFLEX');
  assert.equal(hoseFields.manualStatus, '');
});

test('sanitizeCustomColumns ensures valid column types, at least one primary column, and clears isDueDate on non-date columns', () => {
  const emptyCols = sanitizeCustomColumns([]);
  assert.equal(emptyCols.length, 1);
  assert.equal(emptyCols[0].isPrimary, true);
  assert.equal(sanitizeCustomColumns(undefined).length, 1);

  const sanitized = sanitizeCustomColumns([
    {
      id: 'col 1',
      label: '',
      type: 'text',
      required: true,
      isPrimary: false,
      isDueDate: true,
    },
    {
      id: 'col_2',
      label: 'Hạn kiểm tra',
      type: 'date',
      required: false,
      isPrimary: false,
      isDueDate: true,
    },
  ]);

  assert.equal(sanitized[0].id, 'col_1');
  assert.equal(sanitized[0].label, 'Cột 1');
  assert.equal(sanitized[0].isPrimary, true);
  assert.equal(sanitized[0].isDueDate, false);
  assert.equal(sanitized[1].isDueDate, true);
});

test('sanitizeCustomRowValues clamps keys and values', () => {
  const values = sanitizeCustomRowValues({
    col_name: 'a'.repeat(1500),
    '': 'ignored',
  });
  assert.equal(values.col_name.length, 1000);
  assert.equal('' in values, false);
  assert.deepEqual(sanitizeCustomRowValues(undefined), {});
});

test('sortByOrder and assembleCustomWorkspaces group and order workspaces and rows deterministically', () => {
  const sorted = sortByOrder([
    { id: 'b', sortOrder: 2 },
    { id: 'a', sortOrder: 1 },
  ]);
  assert.deepEqual(
    sorted.map((x) => x.id),
    ['a', 'b']
  );

  const assembled = assembleCustomWorkspaces(
    [
      {
        id: 'ws2',
        name: 'WS 2',
        subtitle: '',
        description: '',
        columns: sanitizeCustomColumns([]),
        sortOrder: 2,
      },
      {
        id: 'ws1',
        name: 'WS 1',
        subtitle: '',
        description: '',
        columns: sanitizeCustomColumns([]),
        sortOrder: 1,
      },
    ],
    [
      {
        id: 'r2',
        workspaceId: 'ws1',
        values: { col_name: 'Row 2' },
        manualStatus: '',
        sortOrder: 2,
      },
      {
        id: 'r1',
        workspaceId: 'ws1',
        values: { col_name: 'Row 1' },
        manualStatus: 'overdue',
        sortOrder: 1,
      },
    ]
  );

  assert.deepEqual(
    assembled.map((w) => w.id),
    ['ws1', 'ws2']
  );
  assert.deepEqual(
    assembled[0].rows.map((r) => r.id),
    ['r1', 'r2']
  );
  assert.equal(assembled[0].rows[0].manualStatus, 'overdue');
  assert.equal(assembled[1].rows.length, 0);
});
