import { ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createDefaultCustomColumns } from '../data/initialData';
import type {
  CustomColumnDef,
  CustomColumnType,
  CustomWorkspace,
} from '../types/maintenance';

interface WorkspaceEditorModalProps {
  open: boolean;
  workspace: CustomWorkspace | null;
  onClose: () => void;
  onSave: (
    payload: {
      name: string;
      subtitle: string;
      description: string;
      columns: CustomColumnDef[];
    },
    existingId?: string
  ) => void;
  onDelete: (id: string) => void;
}

const COLUMN_TYPE_LABELS: Record<CustomColumnType, string> = {
  text: 'Văn bản',
  date: 'Ngày tháng',
  number: 'Số',
  textarea: 'Ghi chú dài',
};

export function WorkspaceEditorModal({
  open,
  workspace,
  onClose,
  onSave,
  onDelete,
}: WorkspaceEditorModalProps) {
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [columns, setColumns] = useState<CustomColumnDef[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (workspace) {
      setName(workspace.name);
      setSubtitle(workspace.subtitle);
      setDescription(workspace.description);
      setColumns(workspace.columns.map((c) => ({ ...c })));
    } else {
      setName('');
      setSubtitle('KHÔNG GIAN TÙY CHỈNH');
      setDescription('Theo dõi hạng mục và lịch kiểm tra định kỳ theo cấu trúc cột tùy chỉnh.');
      setColumns(createDefaultCustomColumns());
    }
    setErrorMsg('');
    setConfirmingDelete(false);
  }, [open, workspace]);

  if (!open) return null;

  const handleAddColumn = () => {
    const newCol: CustomColumnDef = {
      id: `col_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label: `Cột mới ${columns.length + 1}`,
      type: 'text',
      required: false,
      isPrimary: false,
      isDueDate: false,
    };
    setColumns((prev) => [...prev, newCol]);
    setErrorMsg('');
  };

  const handleUpdateColumn = (
    idx: number,
    patch: Partial<CustomColumnDef>
  ) => {
    setColumns((prev) =>
      prev.map((col, i) => {
        if (patch.isPrimary && i !== idx) {
          return { ...col, isPrimary: false };
        }
        if (i !== idx) return col;
        const next = { ...col, ...patch };
        if (next.type !== 'date') {
          next.isDueDate = false;
        }
        return next;
      })
    );
    if (errorMsg) setErrorMsg('');
  };

  const handleMoveColumn = (idx: number, direction: -1 | 1) => {
    const target = idx + direction;
    if (target < 0 || target >= columns.length) return;
    setColumns((prev) => {
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[target];
      next[target] = temp;
      return next;
    });
  };

  const handleRemoveColumn = (idx: number) => {
    if (columns.length <= 1) {
      setErrorMsg('Không gian làm việc phải có ít nhất 01 cột dữ liệu.');
      return;
    }
    setColumns((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (!next.some((c) => c.isPrimary) && next.length > 0) {
        next[0] = { ...next[0], isPrimary: true };
      }
      return next;
    });
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg('Vui lòng nhập tên không gian làm việc.');
      return;
    }

    const cleanedCols = columns.map((c) => ({
      ...c,
      label: c.label.trim(),
    }));

    if (cleanedCols.length === 0) {
      setErrorMsg('Cần ít nhất 01 cột dữ liệu.');
      return;
    }

    if (cleanedCols.some((c) => !c.label)) {
      setErrorMsg('Tên của tất cả các cột không được để trống.');
      return;
    }

    if (!cleanedCols.some((c) => c.isPrimary)) {
      cleanedCols[0] = { ...cleanedCols[0], isPrimary: true };
    }

    onSave(
      {
        name: trimmedName,
        subtitle: subtitle.trim() || 'KHÔNG GIAN TÙY CHỈNH',
        description:
          description.trim() ||
          'Theo dõi hạng mục và lịch bảo dưỡng định kỳ.',
        columns: cleanedCols,
      },
      workspace?.id
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="workspace-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center gap-4">
          <div>
            <h2
              id="workspace-modal-title"
              className="text-base font-extrabold text-[#172033]"
            >
              {workspace
                ? `Cấu hình không gian – ${workspace.name}`
                : 'Tạo không gian làm việc mới'}
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Tùy chỉnh tên không gian, thêm/sửa/xóa cột dữ liệu và chọn cột ngày đến hạn để cảnh báo tự động
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại không gian làm việc"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div
              role="alert"
              className="px-3.5 py-2.5 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-700"
            >
              {errorMsg}
            </div>
          )}

          {/* Basic Workspace Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="ws-name"
                className="block text-[11px] font-bold text-slate-600 mb-1.5"
              >
                Tên không gian làm việc <span className="text-red-500">*</span>
              </label>
              <input
                id="ws-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="VD: Cụm bơm & Van, Hệ thống PCCC..."
                className="w-full border border-[#dce3ec] rounded-lg px-3 py-2 text-xs bg-white text-[#172033] outline-none focus:border-[#1d39c4] focus:ring-2 focus:ring-blue-500/15"
              />
            </div>

            <div>
              <label
                htmlFor="ws-subtitle"
                className="block text-[11px] font-bold text-slate-600 mb-1.5"
              >
                Nhóm / Phụ đề
              </label>
              <input
                id="ws-subtitle"
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="VD: THIẾT BỊ ĐỘNG LỰC"
                className="w-full border border-[#dce3ec] rounded-lg px-3 py-2 text-xs bg-white text-[#172033] outline-none focus:border-[#1d39c4] focus:ring-2 focus:ring-blue-500/15"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="ws-desc"
                className="block text-[11px] font-bold text-slate-600 mb-1.5"
              >
                Mô tả ngắn
              </label>
              <input
                id="ws-desc"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả phạm vi theo dõi của không gian này..."
                className="w-full border border-[#dce3ec] rounded-lg px-3 py-2 text-xs bg-white text-[#172033] outline-none focus:border-[#1d39c4] focus:ring-2 focus:ring-blue-500/15"
              />
            </div>
          </div>

          {/* Dynamic Column Builder */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-[#f7f9fc] border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-extrabold text-[#172033]">
                  Cấu trúc cột dữ liệu ({columns.length} cột)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Đánh dấu &ldquo;Cột chính&rdquo; để hiển thị tên thiết bị và &ldquo;Theo dõi hạn&rdquo; cho cột ngày dùng để cảnh báo
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddColumn}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0b1956] text-white hover:bg-[#142a7d] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Thêm cột</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {columns.map((col, idx) => (
                <div
                  key={col.id}
                  className="p-3.5 grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-white hover:bg-slate-50/70"
                >
                  <div className="md:col-span-4">
                    <label
                      htmlFor={`col-label-${col.id}`}
                      className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1"
                    >
                      Tên cột #{idx + 1}
                    </label>
                    <input
                      id={`col-label-${col.id}`}
                      type="text"
                      value={col.label}
                      onChange={(e) =>
                        handleUpdateColumn(idx, { label: e.target.value })
                      }
                      placeholder="Nhập tên cột..."
                      className="w-full border border-[#dce3ec] rounded-lg px-2.5 py-1.5 text-xs bg-white text-[#172033] outline-none focus:border-[#1d39c4]"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label
                      htmlFor={`col-type-${col.id}`}
                      className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1"
                    >
                      Kiểu dữ liệu
                    </label>
                    <select
                      id={`col-type-${col.id}`}
                      value={col.type}
                      onChange={(e) =>
                        handleUpdateColumn(idx, {
                          type: e.target.value as CustomColumnType,
                        })
                      }
                      className="w-full border border-[#dce3ec] rounded-lg px-2.5 py-1.5 text-xs bg-white text-[#172033] outline-none focus:border-[#1d39c4]"
                    >
                      {(Object.keys(COLUMN_TYPE_LABELS) as CustomColumnType[]).map(
                        (t) => (
                          <option key={t} value={t}>
                            {COLUMN_TYPE_LABELS[t]}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="md:col-span-3 flex flex-wrap items-center gap-3 pt-2 md:pt-4">
                    <label className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(col.isPrimary)}
                        onChange={(e) =>
                          handleUpdateColumn(idx, { isPrimary: e.target.checked })
                        }
                        className="rounded border-slate-300 text-[#1d39c4]"
                      />
                      <span>Cột chính</span>
                    </label>

                    <label className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(col.required)}
                        onChange={(e) =>
                          handleUpdateColumn(idx, { required: e.target.checked })
                        }
                        className="rounded border-slate-300 text-[#1d39c4]"
                      />
                      <span>Bắt buộc</span>
                    </label>

                    {col.type === 'date' && (
                      <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(col.isDueDate)}
                          onChange={(e) =>
                            handleUpdateColumn(idx, {
                              isDueDate: e.target.checked,
                            })
                          }
                          className="rounded border-amber-400 text-amber-600"
                        />
                        <span>Theo dõi hạn</span>
                      </label>
                    )}
                  </div>

                  <div className="md:col-span-2 flex items-center justify-end gap-1 pt-2 md:pt-4">
                    <button
                      type="button"
                      onClick={() => handleMoveColumn(idx, -1)}
                      disabled={idx === 0}
                      aria-label={`Di chuyển cột ${col.label || idx + 1} lên`}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveColumn(idx, 1)}
                      disabled={idx === columns.length - 1}
                      aria-label={`Di chuyển cột ${col.label || idx + 1} xuống`}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveColumn(idx)}
                      aria-label={`Xóa cột ${col.label || idx + 1}`}
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <div>
              {workspace && !confirmingDelete && (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Xóa không gian</span>
                </button>
              )}
              {workspace && confirmingDelete && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-red-700">
                    Xóa không gian &amp; toàn bộ dữ liệu?
                  </span>
                  <button
                    type="button"
                    onClick={() => onDelete(workspace.id)}
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
                {workspace ? 'Lưu cấu hình' : 'Tạo không gian'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
