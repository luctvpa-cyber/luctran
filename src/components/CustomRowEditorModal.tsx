import { Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type {
  CustomRowRecord,
  CustomWorkspace,
  MaintenanceStatus,
} from '../types/maintenance';
import { getCustomRowStatus, toInputDateValue } from '../utils/maintenance';
import { StatusBadge } from './StatusBadge';

interface CustomRowEditorModalProps {
  open: boolean;
  workspace: CustomWorkspace | null;
  row: CustomRowRecord | null;
  onClose: () => void;
  onSave: (
    workspaceId: string,
    values: Record<string, string>,
    manualStatus: MaintenanceStatus | '',
    existingRowId?: string
  ) => void;
  onDelete: (workspaceId: string, rowId: string) => void;
}

export function CustomRowEditorModal({
  open,
  workspace,
  row,
  onClose,
  onSave,
  onDelete,
}: CustomRowEditorModalProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [manualStatus, setManualStatus] = useState<MaintenanceStatus | ''>('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!open || !workspace) return;
    const initial: Record<string, string> = {};
    workspace.columns.forEach((col) => {
      const raw = row?.values[col.id] ?? '';
      initial[col.id] = col.type === 'date' ? toInputDateValue(raw) : String(raw);
    });
    setValues(initial);
    setManualStatus((row?.manualStatus as MaintenanceStatus | '') ?? '');
    setConfirmingDelete(false);
    setErrorMsg('');
  }, [open, workspace, row]);

  if (!open || !workspace) return null;

  const previewRow: CustomRowRecord = {
    id: row?.id ?? 'preview',
    values,
    manualStatus,
  };
  const effectiveStatus = getCustomRowStatus(workspace, previewRow);

  const handleChange = (colId: string, val: string) => {
    setValues((prev) => ({ ...prev, [colId]: val }));
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    for (const col of workspace.columns) {
      if (col.required && !values[col.id]?.trim()) {
        setErrorMsg(`Vui lòng nhập "${col.label}".`);
        return;
      }
    }

    const trimmed: Record<string, string> = {};
    workspace.columns.forEach((col) => {
      const val = (values[col.id] ?? '').trim();
      if (
        row &&
        col.type === 'date' &&
        !val &&
        row.values[col.id] &&
        !toInputDateValue(row.values[col.id])
      ) {
        trimmed[col.id] = row.values[col.id];
      } else {
        trimmed[col.id] = val;
      }
    });

    onSave(workspace.id, trimmed, manualStatus, row?.id);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="custom-row-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center gap-4">
          <div>
            <h2
              id="custom-row-modal-title"
              className="text-base font-extrabold text-[#172033]"
            >
              {row
                ? `Cập nhật dòng dữ liệu – ${workspace.name}`
                : `Thêm dòng dữ liệu – ${workspace.name}`}
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Nhập thông tin theo các cột đã cấu hình hoặc điều chỉnh trạng thái trực tiếp
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại dòng dữ liệu"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {errorMsg && (
            <div
              role="alert"
              className="mb-4 px-3.5 py-2.5 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-700"
            >
              {errorMsg}
            </div>
          )}

          {/* Status adjustment panel */}
          <div className="mb-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1 min-w-[220px]">
              <label
                htmlFor="custom-row-manual-status"
                className="block text-[11px] font-bold text-slate-700 mb-1"
              >
                Điều chỉnh trạng thái hồ sơ
              </label>
              <select
                id="custom-row-manual-status"
                value={manualStatus}
                onChange={(e) =>
                  setManualStatus(e.target.value as MaintenanceStatus | '')
                }
                className="w-full sm:w-72 border border-[#dce3ec] rounded-lg px-3 py-2 text-xs bg-white text-[#172033] outline-none focus:border-[#1d39c4] focus:ring-2 focus:ring-blue-500/15"
              >
                <option value="">Tự động theo ngày đến hạn</option>
                <option value="safe">Đúng hạn</option>
                <option value="soon">Sắp đến hạn</option>
                <option value="overdue">Quá hạn</option>
                <option value="unknown">Chưa xác định</option>
              </select>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-[11px] font-medium text-slate-500">
                Trạng thái hiển thị:
              </span>
              <StatusBadge status={effectiveStatus} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workspace.columns.map((col) => {
              const inputId = `custom-field-${col.id}`;
              return (
                <div
                  key={col.id}
                  className={col.type === 'textarea' ? 'md:col-span-2' : ''}
                >
                  <label
                    htmlFor={inputId}
                    className="block text-[11px] font-bold text-slate-600 mb-1.5"
                  >
                    {col.label}
                    {col.required && <span className="text-red-500 ml-0.5">*</span>}
                  </label>
                  {col.type === 'textarea' ? (
                    <textarea
                      id={inputId}
                      rows={2}
                      value={values[col.id] ?? ''}
                      onChange={(e) => handleChange(col.id, e.target.value)}
                      className="w-full border border-[#dce3ec] rounded-lg px-3 py-2 text-xs bg-white text-[#172033] outline-none focus:border-[#e99b20] focus:ring-2 focus:ring-amber-400/20"
                    />
                  ) : (
                    <input
                      id={inputId}
                      type={col.type}
                      min={col.type === 'number' ? 0 : undefined}
                      value={values[col.id] ?? ''}
                      onChange={(e) => handleChange(col.id, e.target.value)}
                      className="w-full border border-[#dce3ec] rounded-lg px-3 py-2 text-xs bg-white text-[#172033] outline-none focus:border-[#e99b20] focus:ring-2 focus:ring-amber-400/20"
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-100">
            <div>
              {row && !confirmingDelete && (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Xóa dòng</span>
                </button>
              )}
              {row && confirmingDelete && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-red-700">
                    Xác nhận xóa?
                  </span>
                  <button
                    type="button"
                    onClick={() => onDelete(workspace.id, row.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                  >
                    Đồng ý xóa
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                  >
                    Giữ lại
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-[#eef2f7] text-[#344256] hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-xs font-bold bg-[#e99b20] text-[#172033] hover:bg-[#f4ad36] transition-colors cursor-pointer"
              >
                Lưu dữ liệu
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
