import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SUBSYSTEM_CONFIGS } from '../data/initialData';
import type {
  AnyRecord,
  CustomWorkspace,
  ElectricRecord,
  FilterRecord,
  HoseRecord,
  MaintenanceDB,
  SubsystemType,
  TankRecord,
} from '../types/maintenance';
import {
  displayCustomCellValue,
  displayFieldValue,
  parseDate,
  toISODate,
} from './maintenance';

function toPdfAscii(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

function cellToISO(value: unknown): string {
  if (!value && value !== 0) return '';
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return '';
    return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
  }
  const s = String(value).trim();
  const d = parseDate(s);
  return d ? toISODate(d) : s;
}

export function exportSubsystemToExcel(type: SubsystemType, records: AnyRecord[]): void {
  const cfg = SUBSYSTEM_CONFIGS[type];
  const headers = cfg.cols.map((c) => c.label);
  const body = records.map((rec) =>
    cfg.cols.map((c) => displayFieldValue(c.key, (rec as unknown as Record<string, unknown>)[c.key]))
  );
  const ws = XLSX.utils.aoa_to_sheet([headers, ...body]);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, ws, cfg.title.slice(0, 31));
  XLSX.writeFile(book, `PA_${type}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportSubsystemToPdf(type: SubsystemType, records: AnyRecord[]): void {
  const cfg = SUBSYSTEM_CONFIGS[type];
  const headers = cfg.cols.map((c) => toPdfAscii(c.label));
  const body = records.map((rec) =>
    cfg.cols.map((c) =>
      toPdfAscii(displayFieldValue(c.key, (rec as unknown as Record<string, unknown>)[c.key]))
    )
  );
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(toPdfAscii(`PA Technical Maintenance - ${cfg.title}`), 14, 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(toPdfAscii(`Chi nhanh Cam Ranh | Ngay xuat: ${new Date().toLocaleDateString('vi-VN')}`), 14, 21);

  autoTable(doc, {
    head: [headers],
    body,
    startY: 26,
    styles: { fontSize: 7.5, cellPadding: 2.5 },
    headStyles: { fillColor: [11, 25, 86], textColor: 255 },
    alternateRowStyles: { fillColor: [247, 249, 252] },
  });

  doc.save(`PA_${type}_bao_cao.pdf`);
}

export function exportCustomWorkspaceToExcel(workspace: CustomWorkspace): void {
  const headers = workspace.columns.map((c) => c.label);
  const body = workspace.rows.map((row) =>
    workspace.columns.map((c) => displayCustomCellValue(c.type, row.values[c.id]))
  );
  const ws = XLSX.utils.aoa_to_sheet([headers, ...body]);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, ws, workspace.name.slice(0, 31) || 'Du lieu');
  XLSX.writeFile(book, `PA_khong_gian_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportCustomWorkspaceToPdf(workspace: CustomWorkspace): void {
  const headers = workspace.columns.map((c) => toPdfAscii(c.label));
  const body = workspace.rows.map((row) =>
    workspace.columns.map((c) =>
      toPdfAscii(displayCustomCellValue(c.type, row.values[c.id]))
    )
  );
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(toPdfAscii(`PA Technical Maintenance - ${workspace.name}`), 14, 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(toPdfAscii(`Chi nhanh Cam Ranh | Ngay xuat: ${new Date().toLocaleDateString('vi-VN')}`), 14, 21);

  autoTable(doc, {
    head: [headers],
    body,
    startY: 26,
    styles: { fontSize: 7.5, cellPadding: 2.5 },
    headStyles: { fillColor: [11, 25, 86], textColor: 255 },
    alternateRowStyles: { fillColor: [247, 249, 252] },
  });

  doc.save(`PA_khong_gian_bao_cao.pdf`);
}

export function exportAllToExcel(db: MaintenanceDB): void {
  const book = XLSX.utils.book_new();
  (Object.keys(SUBSYSTEM_CONFIGS) as SubsystemType[]).forEach((type) => {
    const cfg = SUBSYSTEM_CONFIGS[type];
    const headers = cfg.cols.map((c) => c.label);
    const body = db[type].map((rec) =>
      cfg.cols.map((c) => displayFieldValue(c.key, (rec as unknown as Record<string, unknown>)[c.key]))
    );
    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([headers, ...body]), cfg.title.slice(0, 31));
  });
  (db.customWorkspaces ?? []).forEach((ws) => {
    const headers = ws.columns.map((c) => c.label);
    const body = ws.rows.map((row) =>
      ws.columns.map((c) => displayCustomCellValue(c.type, row.values[c.id]))
    );
    XLSX.utils.book_append_sheet(
      book,
      XLSX.utils.aoa_to_sheet([headers, ...body]),
      ws.name.slice(0, 31) || 'Khong gian'
    );
  });
  XLSX.writeFile(book, 'PA_Tong_hop_bao_duong.xlsx');
}

export async function importMaintenanceFromExcel(
  file: File,
  currentDb: MaintenanceDB
): Promise<{ nextDb: MaintenanceDB; importedSheets: number }> {
  const buffer = await file.arrayBuffer();
  const book = XLSX.read(new Uint8Array(buffer), { type: 'array' });
  const nextDb: MaintenanceDB = {
    tanks: [...currentDb.tanks],
    filters: [...currentDb.filters],
    hoses: [...currentDb.hoses],
    electrics: [...currentDb.electrics],
    customWorkspaces: [...(currentDb.customWorkspaces ?? [])],
  };
  let importedSheets = 0;

  const tankSheet = book.Sheets['KIỂM TRA BỂ CHỨA'];
  if (tankSheet) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(tankSheet, { header: 1, defval: '' });
    const parsed: TankRecord[] = [];
    rows.slice(3).forEach((r, i) => {
      if (r[1] && /CXR|T-\d+/i.test(String(r[1]))) {
        parsed.push({
          id: `tank-import-${i}-${Date.now()}`,
          stt: String(r[0] ?? i + 1),
          position: String(r[1]),
          lastInspect: cellToISO(r[2]),
          lastClean: cellToISO(r[3]),
          inspectCycle: String(r[4] ?? ''),
          cleanCycle: String(r[5] ?? ''),
          nextInspect: cellToISO(r[6]),
          nextClean: cellToISO(r[7]),
          note: String(r[8] ?? ''),
        });
      }
    });
    if (parsed.length) {
      nextDb.tanks = parsed;
      importedSheets += 1;
    }
  }

  const filterSheet = book.Sheets['THÔNG TIN BẦU LỌC'];
  if (filterSheet) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(filterSheet, { header: 1, defval: '' });
    const parsed: FilterRecord[] = [];
    rows.slice(3).forEach((r, i) => {
      if (r[0] && String(r[0]).toLowerCase().includes('lọc')) {
        parsed.push({
          id: `filter-import-${i}-${Date.now()}`,
          name: String(r[0]),
          model: String(r[1] ?? ''),
          lastInspect: cellToISO(r[2]),
          nextInspect: cellToISO(r[3]),
          lastReplace: cellToISO(r[4]),
          nextReplace: cellToISO(r[5]),
          coalescerMfg: String(r[6] ?? ''),
          coalescerInstall: cellToISO(r[7]),
          separatorMfg: String(r[8] ?? ''),
          separatorInstall: cellToISO(r[9]),
          openCount: String(r[10] ?? ''),
          note: '',
        });
      }
    });
    if (parsed.length) {
      nextDb.filters = parsed;
      importedSheets += 1;
    }
  }

  const hoseSheet = book.Sheets['ỐNG MỀM'];
  if (hoseSheet) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(hoseSheet, { header: 1, defval: '' });
    const parsed: HoseRecord[] = [];
    rows.slice(2).forEach((r, i) => {
      if (r[3]) {
        parsed.push({
          id: `hose-import-${i}-${Date.now()}`,
          group: String(r[0] ?? ''),
          location: String(r[1] ?? ''),
          position: String(r[2] ?? ''),
          equipment: String(r[3]),
          code: String(r[4] ?? ''),
          brand: String(r[5] ?? ''),
          mfgDate: String(r[6] ?? ''),
          type: String(r[7] ?? ''),
          quantity: String(r[8] ?? ''),
          installDate: String(r[9] ?? ''),
          installedQty: String(r[10] ?? ''),
          plannedReplace: String(r[11] ?? ''),
          stock: String(r[12] ?? ''),
          replaceCycle: String(r[13] ?? ''),
          lastPressure: String(r[14] ?? ''),
          nextPressure: String(r[15] ?? ''),
          pressureCycle: String(r[16] ?? ''),
          note: String(r[17] ?? ''),
        });
      }
    });
    if (parsed.length) {
      nextDb.hoses = parsed;
      importedSheets += 1;
    }
  }

  const electricSheet = book.Sheets['HỆ THỐNG ĐIỆN'];
  if (electricSheet) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(electricSheet, { header: 1, defval: '' });
    const parsed: ElectricRecord[] = [];
    rows.forEach((r, i) => {
      const label = String(r[1] ?? '').toLowerCase();
      if (label.includes('bd') || label.includes('bảo dưỡng')) {
        parsed.push({
          id: `electric-import-${i}-${Date.now()}`,
          name: String(r[1]),
          lastInspect: cellToISO(r[2]),
          cycle: String(r[3] ?? ''),
          nextInspect: cellToISO(r[4]),
          note: String(r[5] ?? ''),
        });
      }
    });
    if (parsed.length) {
      nextDb.electrics = parsed;
      importedSheets += 1;
    }
  }

  return { nextDb, importedSheets };
}
