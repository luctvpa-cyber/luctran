import {
  Cable,
  CircleDot,
  Filter,
  FolderKanban,
  LayoutGrid,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings2,
  X,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import type { CustomWorkspace, NavTab } from '../types/maintenance';
import { makeCustomWorkspaceTab } from '../utils/maintenance';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  counts: Record<string, number>;
  customWorkspaces: CustomWorkspace[];
  onAddWorkspace: () => void;
  onConfigureWorkspace: (workspace: CustomWorkspace) => void;
}

const NAV_ITEMS: Array<{
  id: NavTab;
  label: string;
  icon: typeof LayoutGrid;
}> = [
  { id: 'dashboard', label: 'Tổng quan', icon: LayoutGrid },
  { id: 'tanks', label: 'Kiểm tra bể chứa', icon: CircleDot },
  { id: 'filters', label: 'Thông tin bầu lọc', icon: Filter },
  { id: 'hoses', label: 'Tổng hợp ống mềm', icon: Cable },
  { id: 'electrics', label: 'Hệ thống điện', icon: Zap },
];

export function Sidebar({
  activeTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
  counts,
  customWorkspaces,
  onAddWorkspace,
  onConfigureWorkspace,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const handleNav = (id: NavTab) => {
    onSelectTab(id);
    onCloseMobile();
  };

  const renderNavContent = (isCollapsed: boolean, isMobileDrawer: boolean) => (
    <div
      className={`flex flex-col h-full bg-[#0b1956] text-white transition-all duration-200 ${
        isCollapsed && !isMobileDrawer ? 'w-[74px]' : 'w-64'
      }`}
    >
      <div
        className={`py-5 border-b border-white/10 flex items-start justify-between gap-2 ${
          isCollapsed && !isMobileDrawer ? 'px-3.5 justify-center' : 'px-5'
        }`}
      >
        <button
          type="button"
          onClick={() => handleNav('dashboard')}
          title="Về trang chủ Tổng quan"
          aria-label="Về trang chủ Tổng quan"
          className={`text-left rounded-xl transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/40 cursor-pointer ${
            isCollapsed && !isMobileDrawer ? 'flex justify-center' : 'w-full'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white p-1 grid place-items-center shrink-0 shadow-xs overflow-hidden">
              <img
                src="/assets/aistudio/GetPersonaPhoto_bf075ca6.jpg"
                alt="Logo Petrolimex Aviation"
                className="w-full h-full object-contain"
              />
            </div>
            {(!isCollapsed || isMobileDrawer) && (
              <div>
                <div className="font-extrabold tracking-wide text-sm leading-tight">
                  TECHNICAL
                </div>
                <div className="text-[10px] text-blue-200/75 tracking-[0.16em] mt-0.5">
                  MAINTENANCE
                </div>
              </div>
            )}
          </div>
          {(!isCollapsed || isMobileDrawer) && (
            <>
              <div className="mt-4 text-[11px] font-semibold text-blue-100">
                Petrolimex Aviation
              </div>
              <div className="text-xs text-blue-200/70 mt-0.5">Chi nhánh Cam Ranh</div>
            </>
          )}
        </button>
        {isMobileDrawer && (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Đóng menu"
            className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {(!isCollapsed || isMobileDrawer) && (
        <div className="px-4 pt-5 pb-2 flex items-center justify-between gap-2">
          <span className="text-[11px] uppercase tracking-wider text-blue-200/60 font-semibold">
            Không gian làm việc
          </span>
          <button
            type="button"
            onClick={() => {
              onCloseMobile();
              onAddWorkspace();
            }}
            title="Thêm không gian làm việc mới"
            aria-label="Thêm không gian làm việc mới"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/12 text-blue-100 hover:bg-white/20 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3 h-3" aria-hidden="true" />
            <span>Thêm</span>
          </button>
        </div>
      )}

      <nav
        className={`px-3 space-y-1 flex-1 overflow-y-auto ${
          isCollapsed && !isMobileDrawer ? 'pt-4' : ''
        }`}
        aria-label="Điều hướng chính"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              title={
                isCollapsed && !isMobileDrawer
                  ? `${item.label} (${counts[item.id] ?? 0})`
                  : undefined
              }
              onClick={() => handleNav(item.id)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={isCollapsed && !isMobileDrawer ? item.label : undefined}
              className={`w-full rounded-lg py-2.5 text-xs font-semibold flex items-center cursor-pointer whitespace-nowrap ${
                isCollapsed && !isMobileDrawer
                  ? 'justify-center px-2'
                  : 'justify-between gap-2 px-3'
              } ${
                isActive
                  ? 'bg-white text-[#0b1956] shadow-xs'
                  : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-[#0b1956]' : 'text-blue-200/80'
                  }`}
                  aria-hidden="true"
                />
                {(!isCollapsed || isMobileDrawer) && (
                  <span className="truncate">{item.label}</span>
                )}
              </span>
              {(!isCollapsed || isMobileDrawer) && (
                <span
                  className={`text-[11px] tabular-nums ${
                    isActive ? 'text-[#0b1956] font-extrabold' : 'text-blue-200/70'
                  }`}
                >
                  {counts[item.id] ?? 0}
                </span>
              )}
            </button>
          );
        })}

        {customWorkspaces.length > 0 && (
          <div className="pt-2 mt-2 border-t border-white/10 space-y-1">
            {(!isCollapsed || isMobileDrawer) && (
              <div className="px-2 pb-1 text-[10px] uppercase tracking-wider text-blue-200/50 font-semibold">
                Tùy chỉnh ({customWorkspaces.length})
              </div>
            )}
            {customWorkspaces.map((ws) => {
              const tabId = makeCustomWorkspaceTab(ws.id);
              const isActive = activeTab === tabId;
              const rowCount = counts[tabId] ?? ws.rows.length;
              return (
                <div key={ws.id} className="group flex items-center gap-1">
                  <button
                    type="button"
                    title={
                      isCollapsed && !isMobileDrawer
                        ? `${ws.name} (${rowCount})`
                        : undefined
                    }
                    onClick={() => handleNav(tabId)}
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={isCollapsed && !isMobileDrawer ? ws.name : undefined}
                    className={`flex-1 min-w-0 rounded-lg py-2.5 text-xs font-semibold flex items-center cursor-pointer whitespace-nowrap ${
                      isCollapsed && !isMobileDrawer
                        ? 'justify-center px-2'
                        : 'justify-between gap-2 px-3'
                    } ${
                      isActive
                        ? 'bg-white text-[#0b1956] shadow-xs'
                        : 'text-blue-100/85 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <FolderKanban
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-[#0b1956]' : 'text-amber-300'
                        }`}
                        aria-hidden="true"
                      />
                      {(!isCollapsed || isMobileDrawer) && (
                        <span className="truncate">{ws.name}</span>
                      )}
                    </span>
                    {(!isCollapsed || isMobileDrawer) && (
                      <span
                        className={`text-[11px] tabular-nums ${
                          isActive ? 'text-[#0b1956] font-extrabold' : 'text-blue-200/70'
                        }`}
                      >
                        {rowCount}
                      </span>
                    )}
                  </button>
                  {(!isCollapsed || isMobileDrawer) && (
                    <button
                      type="button"
                      onClick={() => {
                        onCloseMobile();
                        onConfigureWorkspace(ws);
                      }}
                      title={`Cấu hình ${ws.name}`}
                      aria-label={`Cấu hình không gian ${ws.name}`}
                      className="p-2 rounded-lg text-blue-200/60 hover:text-white hover:bg-white/10 cursor-pointer shrink-0"
                    >
                      <Settings2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {isCollapsed && !isMobileDrawer && (
          <button
            type="button"
            onClick={onAddWorkspace}
            title="Thêm không gian làm việc mới"
            aria-label="Thêm không gian làm việc mới"
            className="w-full mt-2 rounded-lg py-2.5 px-2 flex justify-center text-amber-300 hover:bg-white/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-3">
        {(!isCollapsed || isMobileDrawer) && (
          <div className="rounded-xl bg-white/8 border border-white/10 p-3">
            <div className="text-[11px] font-semibold text-blue-100">
              Đồng bộ đám mây
            </div>
            <p className="text-[11px] text-blue-200/75 mt-1 leading-relaxed">
              Mọi chỉnh sửa được lưu trực tiếp lên Cloud Firestore và cập nhật trên mọi thiết bị.
            </p>
          </div>
        )}

        {!isMobileDrawer && (
          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={isCollapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
            className="w-full flex items-center justify-center gap-2 py-2 px-2 rounded-lg text-xs font-medium text-blue-200/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" aria-hidden="true" />
            ) : (
              <>
                <PanelLeftClose className="w-4 h-4" aria-hidden="true" />
                <span>Thu gọn menu</span>
              </>
            )}
          </button>
        )}

        {activeTab === 'dashboard' && (!isCollapsed || isMobileDrawer) && (
          <div className="px-2 pt-0.5 text-[10px] text-blue-200/60 tracking-wide">
            Design by luctv.pa
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={`hidden lg:block shrink-0 min-h-screen bg-[#0b1956] transition-all duration-200 ${
          collapsed ? 'w-[74px]' : 'w-64'
        }`}
      >
        <div className="sticky top-0 h-screen">{renderNavContent(collapsed, false)}</div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-50 h-full shadow-2xl">
            {renderNavContent(false, true)}
          </div>
        </div>
      )}
    </>
  );
}
