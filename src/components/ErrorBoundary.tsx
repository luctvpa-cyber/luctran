import { Component, type ErrorInfo, type ReactNode } from 'react';
import { signOut } from 'firebase/auth';
import { AlertTriangle, LogOut, RotateCcw } from 'lucide-react';
import { auth } from '../firebase';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

function formatReadableCloudError(rawMessage: string): {
  summary: string;
  detail: string;
} {
  try {
    const parsed = JSON.parse(rawMessage) as {
      error?: string;
      operationType?: string;
      path?: string | null;
      authInfo?: { email?: string | null; emailVerified?: boolean | null };
    };
    if (parsed && typeof parsed.error === 'string') {
      const errText = parsed.error;
      if (
        errText.includes('Missing or insufficient permissions') ||
        errText.includes('permission-denied')
      ) {
        return {
          summary: `Tài khoản ${parsed.authInfo?.email ?? 'hiện tại'} không đủ quyền truy cập dữ liệu (${parsed.path ?? 'Firestore'}). Vui lòng thử tải lại hoặc đăng nhập bằng tài khoản được cấp quyền.`,
          detail: rawMessage,
        };
      }
      if (errText.includes('client is offline') || errText.includes('unavailable')) {
        return {
          summary:
            'Không thể kết nối tới máy chủ cơ sở dữ liệu đám mây. Vui lòng kiểm tra kết nối mạng và thử lại.',
          detail: rawMessage,
        };
      }
      return {
        summary: `Lỗi kết nối dữ liệu đám mây: ${errText}`,
        detail: rawMessage,
      };
    }
  } catch {
    // Not JSON
  }
  return {
    summary: rawMessage || 'Đã xảy ra lỗi đồng bộ dữ liệu.',
    detail: '',
  };
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'Đã xảy ra lỗi đồng bộ dữ liệu.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Application ErrorBoundary:', error, info);
  }

  handleSwitchAccount = async () => {
    try {
      await signOut(auth);
    } finally {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      const { summary, detail } = formatReadableCloudError(this.state.message);
      return (
        <div className="min-h-screen bg-[#f3f6fa] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-md w-full p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 grid place-items-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" aria-hidden="true" />
            </div>
            <h1 className="text-base font-extrabold text-[#172033]">
              Không thể tải dữ liệu đám mây
            </h1>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed break-words">
              {summary}
            </p>
            {detail && (
              <details className="mt-3 text-left bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                <summary className="text-[11px] font-semibold text-slate-500 cursor-pointer">
                  Chi tiết kỹ thuật
                </summary>
                <pre className="mt-1.5 text-[10px] text-slate-500 whitespace-pre-wrap break-all font-mono">
                  {detail}
                </pre>
              </details>
            )}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-[#0b1956] text-white hover:bg-[#142a7d] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Tải lại ứng dụng</span>
              </button>
              <button
                type="button"
                onClick={this.handleSwitchAccount}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-[#eef2f7] text-[#344256] hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Đăng xuất / Đổi tài khoản</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
