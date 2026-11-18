import { Cloud, Lock, ShieldCheck } from 'lucide-react';

interface AuthGateProps {
  loading: boolean;
  signingIn: boolean;
  errorMsg: string;
  onSignIn: () => void;
}

export function AuthGate({
  loading,
  signingIn,
  errorMsg,
  onSignIn,
}: AuthGateProps) {
  return (
    <div className="min-h-screen bg-[#f3f6fa] flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="bg-[#0b1956] px-6 py-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white text-[#0b1956] grid place-items-center font-extrabold text-sm shrink-0 shadow-xs">
              PA
            </div>
            <div>
              <div className="font-extrabold tracking-wide text-sm leading-tight">
                TECHNICAL MAINTENANCE
              </div>
              <div className="text-[11px] text-blue-200/80 mt-0.5">
                Petrolimex Aviation · Chi nhánh Cam Ranh
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-9 h-9 border-3 border-[#0b1956]/20 border-t-[#0b1956] rounded-full animate-spin mx-auto" />
              <div className="text-sm font-bold text-[#172033]">
                Đang kiểm tra kết nối &amp; đồng bộ dữ liệu...
              </div>
              <p className="text-xs text-slate-500">
                Vui lòng chờ trong giây lát để tải hồ sơ mới nhất từ máy chủ đám mây.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <h1 className="text-lg font-extrabold text-[#172033]">
                  Đăng nhập để đồng bộ dữ liệu
                </h1>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Dữ liệu kiểm tra &amp; bảo dưỡng được lưu trữ trực tiếp trên cơ sở dữ liệu đám mây, đảm bảo hiển thị đúng bản cập nhật mới nhất trên mọi thiết bị và trình duyệt ẩn danh.
                </p>
              </div>

              {errorMsg && (
                <div
                  role="alert"
                  className="px-3.5 py-2.5 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-700"
                >
                  {errorMsg}
                </div>
              )}

              <button
                type="button"
                onClick={onSignIn}
                disabled={signingIn}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0b1956] hover:bg-[#142a7d] disabled:opacity-60 text-white text-xs font-bold flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-[#e99b20]" aria-hidden="true" />
                <span>
                  {signingIn
                    ? 'Đang mở cửa sổ đăng nhập Google...'
                    : 'Đăng nhập bằng tài khoản Google'}
                </span>
              </button>

              <div className="pt-3 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <Cloud className="w-3.5 h-3.5 text-[#1d39c4] shrink-0" aria-hidden="true" />
                  <span>Tự động lưu mỗi thao tác thêm, sửa, xóa theo thời gian thực</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
                  <span>Không dùng dữ liệu mẫu cũ khi mở từ thiết bị khác hoặc ẩn danh</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
