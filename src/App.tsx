import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessManagerModal } from './components/AccessManagerModal';
import { AuthGate } from './components/AuthGate';
import { ConfirmDialog } from './components/ConfirmDialog';
import { CustomRowEditorModal } from './components/CustomRowEditorModal';
import { CustomWorkspaceView } from './components/CustomWorkspaceView';
import { DashboardView } from './components/DashboardView';
import { Header } from './components/Header';
import { RecordEditorModal } from './components/RecordEditorModal';
import { Sidebar } from './components/Sidebar';
import { SubsystemTableView } from './components/SubsystemTableView';
import { WorkspaceEditorModal } from './components/WorkspaceEditorModal';
import { INITIAL_DB } from './data/initialData';
import { auth, googleProvider, testConnection } from './firebase';
import {
  ADMIN_EMAIL,
  deleteCustomRowInCloud,
  deleteCustomWorkspaceInCloud,
  deleteSubsystemRecordInCloud,
  replaceAllBranchDataInCloud,
  resolveBranchContext,
  saveCustomRowInCloud,
  saveCustomWorkspaceInCloud,
  saveSubsystemRecordInCloud,
  seedBranchIfNeeded,
  subscribeToBranchDb,
  updateBranchAllowedEmailsInCloud,
  type BranchContext,
} from './services/firestoreSync';
import type {
  AlertItem,
  AnyRecord,
  CustomColumnDef,
  CustomRowRecord,
  CustomWorkspace,
  MaintenanceDB,
  MaintenanceStatus,
  NavTab,
  SubsystemType,
} from './types/maintenance';
import {
  exportAllToExcel,
  exportCustomWorkspaceToExcel,
  exportCustomWorkspaceToPdf,
  exportSubsystemToExcel,
  exportSubsystemToPdf,
  importMaintenanceFromExcel,
} from './utils/excelPdf';
import {
  computeDashboardStats,
  getAlertItems,
  getAllStatusMatrixItems,
  getCustomWorkspaceId,
  isCustomWorkspaceTab,
  makeCustomWorkspaceTab,
} from './utils/maintenance';

const EMPTY_DB: MaintenanceDB = {
  tanks: [],
  filters: [],
  hoses: [],
  electrics: [],
  customWorkspaces: [],
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState('');

  const [branchCtx, setBranchCtx] = useState<BranchContext | null>(null);
  const [cloudReady, setCloudReady] = useState(false);
  const [cloudError, setCloudError] = useState<Error | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const [db, setDb] = useState<MaintenanceDB>(EMPTY_DB);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [editorState, setEditorState] = useState<{
    open: boolean;
    type: SubsystemType;
    record: AnyRecord | null;
  }>({ open: false, type: 'tanks', record: null });

  const [workspaceModal, setWorkspaceModal] = useState<{
    open: boolean;
    workspace: CustomWorkspace | null;
  }>({ open: false, workspace: null });

  const [customRowModal, setCustomRowModal] = useState<{
    open: boolean;
    workspaceId: string;
    row: CustomRowRecord | null;
  }>({ open: false, workspaceId: '', row: null });

  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string>('');
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState<string>(() =>
    new Date().toLocaleString('vi-VN')
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const initialAlertShownRef = useRef(false);

  if (cloudError) {
    throw cloudError;
  }

  const showToast = (message: string) => {
    setToastMsg(message);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMsg('');
    }, 3600);
  };

  useEffect(() => {
    void testConnection();
    const unsubAuth = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      if (!nextUser) {
        setBranchCtx(null);
        setCloudReady(false);
        setDb(EMPTY_DB);
        initialAlertShownRef.current = false;
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!authReady || !user || !user.email) return;

    let cancelled = false;
    let unsubDb: (() => void) | undefined;

    const bootstrap = async () => {
      try {
        setCloudReady(false);
        const ctx = await resolveBranchContext(user);
        if (cancelled) return;
        await seedBranchIfNeeded(ctx);
        if (cancelled) return;
        setBranchCtx(ctx);

        unsubDb = subscribeToBranchDb(ctx, user.email ?? '', {
          onData: (nextDb, nextAllowedEmails) => {
            if (cancelled) return;
            setDb(nextDb);
            setBranchCtx((prev) =>
              prev ? { ...prev, allowedEmails: nextAllowedEmails, seeded: true } : prev
            );
            setCloudReady(true);
            setLastUpdatedLabel(new Date().toLocaleString('vi-VN'));
          },
          onError: (err) => {
            if (cancelled) return;
            setCloudError(err);
          },
        });
      } catch (err) {
        if (!cancelled) {
          setCloudError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
      unsubDb?.();
    };
  }, [authReady, user]);

  const stats = useMemo(() => computeDashboardStats(db), [db]);
  const matrixItems = useMemo(() => getAllStatusMatrixItems(db), [db]);
  const alertItems = useMemo(() => getAlertItems(db), [db]);

  useEffect(() => {
    if (!cloudReady || initialAlertShownRef.current) return;
    initialAlertShownRef.current = true;
    if (alertItems.length > 0) {
      const overdue = alertItems.filter((a) => a.status === 'overdue').length;
      const soon = alertItems.filter((a) => a.status === 'soon').length;
      const parts: string[] = [];
      if (overdue > 0) parts.push(`${overdue} hạng mục quá hạn`);
      if (soon > 0) parts.push(`${soon} hạng mục sắp đến hạn`);
      showToast(`Cảnh báo: Có ${parts.join(' và ')}.`);
    }
  }, [cloudReady, alertItems]);

  const handleSignIn = async () => {
    setSigningIn(true);
    setAuthError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('popup-closed-by-user')) {
        setAuthError('Bạn đã đóng cửa sổ đăng nhập trước khi hoàn tất.');
      } else if (msg.includes('popup-blocked')) {
        setAuthError('Trình duyệt đang chặn cửa sổ bật lên. Vui lòng cho phép popup và thử lại.');
      } else {
        setAuthError(`Không thể đăng nhập Google: ${msg}`);
      }
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setActiveTab('dashboard');
  };

  if (!authReady || !user || !cloudReady || !branchCtx) {
    return (
      <AuthGate
        loading={!authReady || (Boolean(user) && !cloudReady)}
        signingIn={signingIn}
        errorMsg={authError}
        onSignIn={handleSignIn}
      />
    );
  }

  const customWorkspaces = db.customWorkspaces ?? [];
  const userEmail = (user.email ?? '').toLowerCase();
  const canManageAccess =
    userEmail === ADMIN_EMAIL || branchCtx.ownerId === user.uid;

  const navCounts: Record<string, number> = {
    dashboard: stats.totalRecords,
    tanks: db.tanks.length,
    filters: db.filters.length,
    hoses: db.hoses.length,
    electrics: db.electrics.length,
  };
  customWorkspaces.forEach((ws) => {
    navCounts[makeCustomWorkspaceTab(ws.id)] = ws.rows.length;
  });

  const handleOpenAdd = (type: SubsystemType) => {
    setEditorState({ open: true, type, record: null });
  };

  const handleOpenEdit = (type: SubsystemType, record: AnyRecord) => {
    setEditorState({ open: true, type, record });
  };

  const handleSaveRecord = async (
    type: SubsystemType,
    values: Record<string, string>,
    existingId?: string
  ) => {
    setIsSyncing(true);
    try {
      await saveSubsystemRecordInCloud(
        branchCtx,
        type,
        values,
        db[type].length,
        existingId
      );
      setEditorState((prev) => ({ ...prev, open: false }));
      showToast('Đã lưu và đồng bộ hồ sơ lên đám mây.');
    } catch (err) {
      setCloudError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteRecord = async (type: SubsystemType, id: string) => {
    setIsSyncing(true);
    try {
      await deleteSubsystemRecordInCloud(branchCtx, type, id);
      setEditorState((prev) => ({ ...prev, open: false }));
      showToast('Đã xóa hồ sơ khỏi cơ sở dữ liệu.');
    } catch (err) {
      setCloudError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveWorkspace = async (
    payload: {
      name: string;
      subtitle: string;
      description: string;
      columns: CustomColumnDef[];
    },
    existingId?: string
  ) => {
    setIsSyncing(true);
    try {
      const wsId = await saveCustomWorkspaceInCloud(
        branchCtx,
        payload,
        customWorkspaces.length,
        existingId
      );
      setWorkspaceModal({ open: false, workspace: null });
      if (!existingId) {
        setActiveTab(makeCustomWorkspaceTab(wsId));
      }
      showToast(
        existingId
          ? `Đã lưu cấu hình "${payload.name}".`
          : `Đã tạo không gian làm việc "${payload.name}".`
      );
    } catch (err) {
      setCloudError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteWorkspace = async (id: string) => {
    const targetWs = customWorkspaces.find((w) => w.id === id);
    const rowIds = targetWs?.rows.map((r) => r.id) ?? [];
    setIsSyncing(true);
    try {
      await deleteCustomWorkspaceInCloud(branchCtx, id, rowIds);
      setWorkspaceModal({ open: false, workspace: null });
      if (activeTab === makeCustomWorkspaceTab(id)) {
        setActiveTab('dashboard');
      }
      showToast('Đã xóa không gian làm việc.');
    } catch (err) {
      setCloudError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveCustomRow = async (
    workspaceId: string,
    values: Record<string, string>,
    manualStatus: MaintenanceStatus | '',
    existingRowId?: string
  ) => {
    const ws = customWorkspaces.find((w) => w.id === workspaceId);
    setIsSyncing(true);
    try {
      await saveCustomRowInCloud(
        branchCtx,
        workspaceId,
        values,
        manualStatus,
        ws?.rows.length ?? 0,
        existingRowId
      );
      setCustomRowModal({ open: false, workspaceId: '', row: null });
      showToast('Đã lưu và đồng bộ dòng dữ liệu.');
    } catch (err) {
      setCloudError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteCustomRow = async (_workspaceId: string, rowId: string) => {
    setIsSyncing(true);
    try {
      await deleteCustomRowInCloud(branchCtx, rowId);
      setCustomRowModal({ open: false, workspaceId: '', row: null });
      showToast('Đã xóa dòng dữ liệu.');
    } catch (err) {
      setCloudError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSelectAlert = (alert: AlertItem) => {
    setActiveTab(alert.tab);
    if (isCustomWorkspaceTab(alert.tab)) {
      const wsId = getCustomWorkspaceId(alert.tab);
      const ws = customWorkspaces.find((w) => w.id === wsId);
      const row = ws?.rows.find((r) => r.id === alert.id);
      if (row) {
        setCustomRowModal({ open: true, workspaceId: wsId, row });
      }
    } else {
      const rec = db[alert.tab].find((r) => r.id === alert.id);
      if (rec) {
        setEditorState({ open: true, type: alert.tab, record: rec });
      }
    }
  };

  const handleConfirmReset = async () => {
    setResetConfirmOpen(false);
    setIsSyncing(true);
    try {
      await replaceAllBranchDataInCloud(
        branchCtx,
        structuredClone(INITIAL_DB),
        userEmail
      );
      setActiveTab('dashboard');
      showToast('Đã khôi phục dữ liệu gốc lên cơ sở dữ liệu.');
    } catch (err) {
      setCloudError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTriggerImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsSyncing(true);
    try {
      const { nextDb, importedSheets } = await importMaintenanceFromExcel(file, db);
      if (importedSheets === 0) {
        showToast('Không tìm thấy sheet phù hợp trong file Excel.');
      } else {
        await replaceAllBranchDataInCloud(branchCtx, nextDb, userEmail);
        showToast(`Đã nạp và đồng bộ ${importedSheets} sheet Excel.`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
      showToast(`Không đọc được file Excel: ${msg}`);
    } finally {
      setIsSyncing(false);
      e.target.value = '';
    }
  };

  const handleSaveAllowedEmails = async (emails: string[]) => {
    setIsSyncing(true);
    try {
      const updated = await updateBranchAllowedEmailsInCloud(
        branchCtx,
        emails,
        userEmail
      );
      setBranchCtx((prev) => (prev ? { ...prev, allowedEmails: updated } : prev));
      setAccessModalOpen(false);
      showToast('Đã cập nhật danh sách tài khoản đồng bộ.');
    } catch (err) {
      setCloudError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsSyncing(false);
    }
  };

  const activeCustomWorkspace = isCustomWorkspaceTab(activeTab)
    ? customWorkspaces.find((ws) => ws.id === getCustomWorkspaceId(activeTab)) ?? null
    : null;

  const customModalWorkspace =
    customWorkspaces.find((ws) => ws.id === customRowModal.workspaceId) ?? null;

  return (
    <div className="min-h-screen flex bg-[#f3f6fa] text-[#172033]">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        counts={navCounts}
        customWorkspaces={customWorkspaces}
        onAddWorkspace={() => setWorkspaceModal({ open: true, workspace: null })}
        onConfigureWorkspace={(ws) =>
          setWorkspaceModal({ open: true, workspace: ws })
        }
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <Header
          activeTab={activeTab}
          customWorkspaces={customWorkspaces}
          alertItems={alertItems}
          userEmail={userEmail}
          isSyncing={isSyncing}
          canManageAccess={canManageAccess}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onSelectAlert={handleSelectAlert}
          onGoHome={() => setActiveTab('dashboard')}
          onOpenAccessManager={() => setAccessModalOpen(true)}
          onSignOut={handleSignOut}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-7 max-w-[1600px] w-full mx-auto">
          {activeTab === 'dashboard' ? (
            <DashboardView
              stats={stats}
              matrixItems={matrixItems}
              customWorkspaces={customWorkspaces}
              alertItems={alertItems}
              lastUpdatedLabel={lastUpdatedLabel}
              onNavigate={setActiveTab}
              onEditRecord={handleOpenEdit}
              onEditCustomRow={(workspaceId, row) =>
                setCustomRowModal({ open: true, workspaceId, row })
              }
              onAddWorkspace={() =>
                setWorkspaceModal({ open: true, workspace: null })
              }
              onImportExcel={handleTriggerImport}
              onExportAll={() => exportAllToExcel(db)}
              onRequestReset={() => setResetConfirmOpen(true)}
            />
          ) : activeCustomWorkspace ? (
            <CustomWorkspaceView
              key={activeCustomWorkspace.id}
              workspace={activeCustomWorkspace}
              onAddRow={() =>
                setCustomRowModal({
                  open: true,
                  workspaceId: activeCustomWorkspace.id,
                  row: null,
                })
              }
              onEditRow={(row) =>
                setCustomRowModal({
                  open: true,
                  workspaceId: activeCustomWorkspace.id,
                  row,
                })
              }
              onConfigureWorkspace={() =>
                setWorkspaceModal({
                  open: true,
                  workspace: activeCustomWorkspace,
                })
              }
              onExportExcel={() =>
                exportCustomWorkspaceToExcel(activeCustomWorkspace)
              }
              onExportPdf={() =>
                exportCustomWorkspaceToPdf(activeCustomWorkspace)
              }
            />
          ) : (
            <SubsystemTableView
              key={activeTab}
              type={activeTab as SubsystemType}
              records={db[activeTab as SubsystemType]}
              onAddNew={handleOpenAdd}
              onEditRecord={handleOpenEdit}
              onExportExcel={(type) => exportSubsystemToExcel(type, db[type])}
              onExportPdf={(type) => exportSubsystemToPdf(type, db[type])}
            />
          )}
        </main>
      </div>

      <RecordEditorModal
        open={editorState.open}
        type={editorState.type}
        record={editorState.record}
        onClose={() => setEditorState((prev) => ({ ...prev, open: false }))}
        onSave={handleSaveRecord}
        onDelete={handleDeleteRecord}
      />

      <WorkspaceEditorModal
        open={workspaceModal.open}
        workspace={workspaceModal.workspace}
        onClose={() => setWorkspaceModal({ open: false, workspace: null })}
        onSave={handleSaveWorkspace}
        onDelete={handleDeleteWorkspace}
      />

      <CustomRowEditorModal
        open={customRowModal.open}
        workspace={customModalWorkspace}
        row={customRowModal.row}
        onClose={() =>
          setCustomRowModal({ open: false, workspaceId: '', row: null })
        }
        onSave={handleSaveCustomRow}
        onDelete={handleDeleteCustomRow}
      />

      <AccessManagerModal
        open={accessModalOpen}
        allowedEmails={branchCtx.allowedEmails}
        currentUserEmail={userEmail}
        isPrimaryBranch={branchCtx.isPrimaryBranch}
        saving={isSyncing}
        onClose={() => setAccessModalOpen(false)}
        onSaveEmails={handleSaveAllowedEmails}
      />

      <ConfirmDialog
        open={resetConfirmOpen}
        title="Khôi phục dữ liệu ban đầu"
        message="Khôi phục dữ liệu gốc từ hồ sơ ban đầu? Toàn bộ dữ liệu hiện tại trên đám mây sẽ bị thay thế."
        confirmLabel="Khôi phục dữ liệu"
        tone="warning"
        onConfirm={handleConfirmReset}
        onCancel={() => setResetConfirmOpen(false)}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleFileChange}
        aria-label="Chọn file Excel để nhập dữ liệu"
      />

      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-[80] bg-[#0b1956] text-white text-xs font-medium px-4 py-3 rounded-xl shadow-xl border border-white/15"
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}
