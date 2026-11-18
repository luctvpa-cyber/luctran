import { Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SUBSYSTEM_CONFIGS } from '../data/initialData';
import type { AnyRecord, MaintenanceStatus, SubsystemType } from '../types/maintenance';
import {
  applyCycleCalculations,
  getRowStatus,
  toInputDateValue,
} from '../utils/maintenance';
import { StatusBadge } from './StatusBadge';

interface RecordEditorModalProps {
  open: boolean;
  type: SubsystemType;
  record: AnyRecord | null;
  onClose: () => void;
  onSave: (type: SubsystemType, values: Record<string, string>, existingId?: string) => void;
  onDelete: (type: SubsystemType, id: string) => void;
}

export function RecordEditorModal({
  open,
  type,
  record,
  onClose,
  onSave,
  onDelete,
}: RecordEditorModalProps) {
  const cfg = SUBSYSTEM_CONFIGS[type];
  const [values, setValues] = useState<Record<string, string>>({});
  const [manualStatus, setManualStatus] = useState<MaintenanceStatus | ''>('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!open) return;
    const initial: Record<string, string> = {};
    const recMap = (record as unknown as Record<string, string>) || {};

    cfg.fields.forEach((field) => {
      const raw = recMap[field.key] ?? '';
      if (field.type === 'date') {
        initial[field.key] = toInputDateValue(raw);
      } else {
        initial[field.key] = String(raw);
      }
    });

    setValues(initial);
    setManualStatus((record?.manualStatus as MaintenanceStatus | '') ?? '');
    setConfirmingDelete(false);
    setErrorMsg('');
  }, [open, type, record, cfg.fields]);

  if (!open) return null;

  const handleChange = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    if (errorMsg) setErrorMsg('');
  };

  const previewRecord = {
    ...applyCycleCalculations(type, values),
    id: record?.id ?? 'preview',
    manualStatus,
  } as unknown as AnyRecord;
  const effectiveStatus = getRowStatus(type, previewRecord);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    for (const f of cfg.fields) {
      if (f.required && !values[f.key]?.trim()) {
        setErrorMsg(`Vui lòng nhập "${f.label}".`);
        return;
      }
    }

    const trimmed: Record<string, string> = {};
    Object.entries(values).forEach(([k, v]) => {
      trimmed[k] = v.trim();
    });

    // Preserve unedited raw non-ISO strings like "03/2026" if user didn't pick a new date
    if (record) {
      const recMap = record as unknown as Record<string, string>;
      cfg.fields.forEach((f) => {
        if (
          f.type === 'date' &&
          !trimmed[f.key] &&
          recMap[f.key] &&
          !toInputDateValue(recMap[f.key])
        ) {
          trimmed[f.key] = recMap[f.key];
        }
      });
    }

    const computed = applyCycleCalculations(type, trimmed);
    computed.manualStatus = manualStatus;
    onSave(type, computed, record?.id);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="editor-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center gap-4">
          <div>
            <h2 id="editor-modal-title" className="text-base font-extrabold text-[#172033]">
              {record ? `Cập nhật hồ sơ – ${cfg.title}` : `Thêm hồ sơ mới – ${cfg.title}`}
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Có thể để tự động tính trạng thái theo ngày đến hạn hoặc chọn trạng thái thủ công
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
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
                htmlFor="field-manual-status"
                className="block text-[11px] font-bold text-slate-700 mb-1"
              >
                Điều chỉnh trạng thái hồ sơ
              </label>
              <select
                id="field-manual-status"
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
            {cfg.fields.map((field) => {
              const inputId = `field-${type}-${field.key}`;
              return (
                <div
                  key={field.key}
                  className={field.type === 'textarea' ? 'md:col-span-1' : ''}
                >
                  <label
                    htmlFor={inputId}
                    className="block text-[11px] font-bold text-slate-600 mb-1.5"
                  >
                    {field.label}
                    {field.required && <span className="text-red-500 ml-0.5">*</span>}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      id={inputId}
                      rows={2}
                      value={values[field.key] ?? ''}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full border border-[#dce3ec] rounded-lg px-3 py-2 text-xs bg-white text-[#172033] outline-none focus:border-[#e99b20] focus:ring-2 focus:ring-amber-400/20"
                    />
                  ) : (
                    <input
                      id={inputId}
                      type={field.type}
                      min={field.type === 'number' ? 0 : undefined}
                      value={values[field.key] ?? ''}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full border border-[#dce3ec] rounded-lg px-3 py-2 text-xs bg-white text-[#172033] outline-none focus:border-[#e99b20] focus:ring-2 focus:ring-amber-400/20"
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-100">
            <div>
              {record && !confirmingDelete && (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Xóa hồ sơ</span>
                </button>
              )}
              {record && confirmingDelete && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-red-700">
                    Xác nhận xóa?
                  </span>
                  <button
                    type="button"
                    onClick={() => onDelete(type, record.id)}
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
                Lưu thay đổi
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
