import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronRight,
  Cloud,
  LogOut,
  Menu,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { SUBSYSTEM_CONFIGS } from '../data/initialData';
import type { AlertItem, CustomWorkspace, NavTab } from '../types/maintenance';
import {
  formatDateDisplay,
  formatDaysRemaining,
  getCustomWorkspaceId,
  isCustomWorkspaceTab,
} from '../utils/maintenance';
import { StatusBadge } from './StatusBadge';

interface HeaderProps {
  activeTab: NavTab;
  customWorkspaces: CustomWorkspace[];
  alertItems: AlertItem[];
  userEmail: string;
  isSyncing: boolean;
  canManageAccess: boolean;
  onOpenMobileMenu: () => void;
  onSelectAlert: (alert: AlertItem) => void;
  onGoHome: () => void;
  onOpenAccessManager: () => void;
  onSignOut: () => void;
}

export function Header({
  activeTab,
  customWorkspaces,
  alertItems,
  userEmail,
  isSyncing,
  canManageAccess,
  onOpenMobileMenu,
  onSelectAlert,
  onGoHome,
  onOpenAccessManager,
  onSignOut,
}: HeaderProps) {
  const [now, setNow] = useState(() => new Date());
  const [notifOpen, setNotifOpen] = useState(false);
  const [browserPerm, setBrowserPerm] = useState<string>(() =>
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!notifOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setNotifOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [notifOpen]);

  let crumb = 'Tổng quan';
  let pageTitle = 'Trung tâm điều hành kỹ thuật';

  if (activeTab !== 'dashboard') {
    if (isCustomWorkspaceTab(activeTab)) {
      const wsId = getCustomWorkspaceId(activeTab);
      const ws = customWorkspaces.find((w) => w.id === wsId);
      crumb = ws?.name ?? 'Không gian làm việc';
      pageTitle = ws?.name ?? 'Không gian làm việc';
    } else {
      crumb = SUBSYSTEM_CONFIGS[activeTab].title;
      pageTitle = SUBSYSTEM_CONFIGS[activeTab].title;
    }
  }

  const overdueCount = alertItems.filter((a) => a.status === 'overdue').length;
  const soonCount = alertItems.filter((a) => a.status === 'soon').length;

  const handleEnableBrowserNotif = async () => {
    if (typeof Notification === 'undefined') return;
    try {
      const perm = await Notification.requestPermission();
      setBrowserPerm(perm);
      if (perm === 'granted' && alertItems.length > 0) {
        new Notification('PA Technical Maintenance', {
          body: `Có ${overdueCount} mục quá hạn và ${soonCount} mục sắp đến hạn.`,
        });
      }
    } catch {
      // Ignore permission rejection
    }
  };

  const timeStr = now.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const dateStr = now.toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <header className="h-[68px] bg-white border-b border-slate-200 flex items-center justify-between gap-4 px-4 sm:px-7 sticky top-0 z-20">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Mở menu điều hướng"
          className="lg:hidden p-2 -ml-1 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 truncate">
            <button
              type="button"
              onClick={onGoHome}
              className="hover:text-[#0b1956] hover:underline cursor-pointer"
            >
              Quản lý kỹ thuật
            </button>
            <span aria-hidden="true">/</span>
            <span className="text-slate-600 truncate">{crumb}</span>
          </div>
          <h2 className="font-extrabold text-[16px] sm:text-[17px] text-[#172033] truncate mt-0.5">
            {pageTitle}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
        {/* Cloud Sync Pill */}
        <div
          className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold whitespace-nowrap ${
            isSyncing
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}
          data-testid="cloud-sync-indicator"
        >
          <Cloud className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{isSyncing ? 'Đang lưu...' : 'Đã lưu đám mây'}</span>
        </div>

        {/* Notification Bell & Alert Popover */}
        <div className="relative" ref={popoverRef}>
          <button
            type="button"
            onClick={() => setNotifOpen((prev) => !prev)}
            aria-expanded={notifOpen}
            aria-label={`Thông báo đến hạn và quá hạn (${alertItems.length})`}
            data-testid="notification-bell"
            className={`relative p-2 rounded-xl border transition-colors cursor-pointer ${
              overdueCount > 0
                ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                : soonCount > 0
                  ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Bell className="w-4 h-4" aria-hidden="true" />
            {alertItems.length > 0 && (
              <span
                data-testid="notification-badge"
                className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-extrabold text-white grid place-items-center tabular-nums shadow-xs ${
                  overdueCount > 0 ? 'bg-red-600' : 'bg-amber-600'
                }`}
              >
                {alertItems.length}
              </span>
            )}
          </button>

          {notifOpen && (
            <div
              role="dialog"
              aria-label="Danh sách cảnh báo đến hạn và quá hạn"
              className="absolute right-0 mt-2 w-[340px] sm:w-[390px] bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="px-4 py-3 bg-[#f7f9fc] border-b border-slate-200 flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-extrabold text-[#172033] flex items-center gap-1.5">
                    <AlertTriangle
                      className={`w-3.5 h-3.5 ${
                        overdueCount > 0 ? 'text-red-600' : 'text-amber-600'
                      }`}
                      aria-hidden="true"
                    />
                    <span>Cảnh báo bảo dưỡng &amp; kiểm định</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                    {overdueCount} quá hạn · {soonCount} sắp đến hạn (≤ 30 ngày)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifOpen(false)}
                  aria-label="Đóng bảng thông báo"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-100">
                {alertItems.length > 0 ? (
                  alertItems.map((alert) => (
                    <button
                      key={`${alert.tab}-${alert.id}`}
                      type="button"
                      onClick={() => {
                        setNotifOpen(false);
                        onSelectAlert(alert);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-start justify-between gap-3 cursor-pointer"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={alert.status} />
                          <span className="text-[10px] font-bold text-slate-500 truncate">
                            {alert.subsystemLabel}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-[#172033] mt-1 truncate">
                          {alert.title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>Hạn: {formatDateDisplay(alert.dueDate)}</span>
                          <span>·</span>
                          <span
                            className={
                              alert.status === 'overdue'
                                ? 'text-red-600 font-semibold'
                                : 'text-amber-700 font-medium'
                            }
                          >
                            {formatDaysRemaining(alert.daysRemaining)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight
                        className="w-4 h-4 text-slate-400 shrink-0 mt-1"
                        aria-hidden="true"
                      />
                    </button>
                  ))
                ) : (
                  <div className="py-8 px-4 text-center">
                    <CheckCircle2
                      className="w-7 h-7 text-emerald-500 mx-auto mb-2"
                      aria-hidden="true"
                    />
                    <p className="text-xs font-semibold text-slate-700">
                      Không có cảnh báo quá hạn hoặc sắp đến hạn
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Tất cả thiết bị đang trong kỳ hạn an toàn.
                    </p>
                  </div>
                )}
              </div>

              {browserPerm === 'default' && (
                <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-600">
                    Nhận thông báo đẩy trên trình duyệt
                  </span>
                  <button
                    type="button"
                    onClick={handleEnableBrowserNotif}
                    className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#0b1956] text-white hover:bg-[#142a7d] cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Bật thông báo
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="hidden xl:block text-right border-r border-slate-200 pr-4">
          <div className="text-xs font-bold text-[#172033] font-mono-tabular whitespace-nowrap">
            {timeStr}
          </div>
          <div className="text-[11px] text-slate-500 whitespace-nowrap">{dateStr}</div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block text-right">
            <div className="text-xs font-bold text-[#172033] whitespace-nowrap">
              {userEmail}
            </div>
            <div className="text-[11px] text-slate-500 whitespace-nowrap">
              Petrolimex Aviation · CN Cam Ranh
            </div>
          </div>
          {canManageAccess && (
            <button
              type="button"
              onClick={onOpenAccessManager}
              title="Chia sẻ quyền truy cập đồng bộ"
              aria-label="Chia sẻ quyền truy cập đồng bộ"
              className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-[#0b1956] transition-colors cursor-pointer shrink-0"
            >
              <Users className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={onSignOut}
            title="Đăng xuất"
            aria-label="Đăng xuất tài khoản"
            className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
