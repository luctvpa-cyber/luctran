import { Plus, Trash2, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ADMIN_EMAIL } from '../services/firestoreSync';

interface AccessManagerModalProps {
  open: boolean;
  allowedEmails: string[];
  currentUserEmail: string;
  isPrimaryBranch: boolean;
  saving: boolean;
  onClose: () => void;
  onSaveEmails: (emails: string[]) => Promise<void>;
}

export function AccessManagerModal({
  open,
  allowedEmails,
  currentUserEmail,
  isPrimaryBranch,
  saving,
  onClose,
  onSaveEmails,
}: AccessManagerModalProps) {
  const [emails, setEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!open) return;
    setEmails(allowedEmails);
    setNewEmail('');
    setErrorMsg('');
  }, [open, allowedEmails]);

  if (!open) return null;

  const handleAdd = () => {
    const cleaned = newEmail.trim().toLowerCase();
    if (!cleaned || !cleaned.includes('@')) {
      setErrorMsg('Vui lòng nhập địa chỉ email Google hợp lệ.');
      return;
    }
    if (emails.includes(cleaned)) {
      setErrorMsg('Email này đã nằm trong danh sách.');
      return;
    }
    if (emails.length >= 20) {
      setErrorMsg('Tối đa 20 tài khoản được chia sẻ trên một không gian.');
      return;
    }
    setEmails((prev) => [...prev, cleaned]);
    setNewEmail('');
    setErrorMsg('');
  };

  const handleRemove = (target: string) => {
    if (target === ADMIN_EMAIL || target === currentUserEmail.toLowerCase()) {
      return;
    }
    setEmails((prev) => prev.filter((e) => e !== target));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveEmails(emails);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="access-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center gap-4">
          <div className="flex items-center gap-2.5">
            <Users className="w-4 h-4 text-[#0b1956]" aria-hidden="true" />
            <div>
              <h2
                id="access-modal-title"
                className="text-base font-extrabold text-[#172033]"
              >
                Chia sẻ dữ liệu đồng bộ
              </h2>
              <p className="text-[11px] text-slate-500">
                {isPrimaryBranch
                  ? 'Danh sách email Google được phép xem & cập nhật dữ liệu Chi nhánh Cam Ranh'
                  : 'Danh sách email Google được phép truy cập không gian này'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại chia sẻ"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div
              role="alert"
              className="px-3.5 py-2 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-700"
            >
              {errorMsg}
            </div>
          )}

          <div className="flex gap-2">
            <label htmlFor="share-email-input" className="sr-only">
              Thêm email Google
            </label>
            <input
              id="share-email-input"
              type="email"
              value={newEmail}
              onChange={(e) => {
                setNewEmail(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="VD: kythuat.camranh@gmail.com"
              className="flex-1 border border-[#dce3ec] rounded-lg px-3 py-2 text-xs bg-white text-[#172033] outline-none focus:border-[#1d39c4]"
            />
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold bg-[#0b1956] text-white hover:bg-[#142a7d] cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Thêm email</span>
            </button>
          </div>

          <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-56 overflow-y-auto">
            {emails.map((email) => {
              const locked =
                email === ADMIN_EMAIL ||
                email === currentUserEmail.toLowerCase();
              return (
                <div
                  key={email}
                  className="px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0 truncate">
                    <span className="font-semibold text-[#172033]">{email}</span>
                    {email === ADMIN_EMAIL && (
                      <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-[#1d39c4]">
                        Quản trị
                      </span>
                    )}
                  </div>
                  {!locked && (
                    <button
                      type="button"
                      onClick={() => handleRemove(email)}
                      aria-label={`Gỡ quyền ${email}`}
                      className="p-1 rounded text-red-600 hover:bg-red-50 cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-[#eef2f7] text-[#344256] hover:bg-slate-200 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-[#e99b20] text-[#172033] hover:bg-[#f4ad36] disabled:opacity-60 cursor-pointer"
            >
              {saving ? 'Đang cập nhật...' : 'Lưu quyền truy cập'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
