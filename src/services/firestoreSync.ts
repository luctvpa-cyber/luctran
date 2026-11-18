import type { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocFromServer,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { INITIAL_DB, STORAGE_KEY } from '../data/initialData';
import { db, handleFirestoreError, OperationType } from '../firebase';
import type {
  AnyRecord,
  CustomColumnDef,
  CustomRowRecord,
  CustomWorkspace,
  MaintenanceDB,
  MaintenanceStatus,
  SubsystemType,
} from '../types/maintenance';
import {
  assembleCustomWorkspaces,
  buildSubsystemRecordFields,
  clampStr,
  sanitizeCustomColumns,
  sanitizeCustomRowValues,
  sanitizeEmailList,
  sanitizeId,
  sanitizeManualStatus,
  sortByOrder,
} from '../utils/firestorePayload';

export const PRIMARY_BRANCH_ID = 'cam-ranh';
export const ADMIN_EMAIL = 'pepsimessi997@gmail.com';

export interface BranchContext {
  branchId: string;
  ownerId: string;
  currentUserId: string;
  currentUserEmail: string;
  allowedEmails: string[];
  seeded: boolean;
  isPrimaryBranch: boolean;
}

function isPermissionDeniedError(err: unknown): boolean {
  const code = (err as { code?: string } | null)?.code;
  if (code === 'permission-denied') return true;
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('permission-denied') ||
    msg.includes('Missing or insufficient permissions')
  );
}

async function fetchBranchDocFromServer(
  ref: ReturnType<typeof doc>
) {
  try {
    return await getDocFromServer(ref);
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      throw err;
    }
    // Single brief retry for transient network / client-offline startup races
    await new Promise((resolve) => setTimeout(resolve, 450));
    return await getDocFromServer(ref);
  }
}

function readLegacyLocalDb(): MaintenanceDB | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<MaintenanceDB>;
    if (
      Array.isArray(parsed.tanks) &&
      Array.isArray(parsed.filters) &&
      Array.isArray(parsed.hoses) &&
      Array.isArray(parsed.electrics)
    ) {
      return {
        tanks: parsed.tanks,
        filters: parsed.filters,
        hoses: parsed.hoses,
        electrics: parsed.electrics,
        customWorkspaces: Array.isArray(parsed.customWorkspaces)
          ? parsed.customWorkspaces
          : [],
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function commitOperationsInChunks(
  ops: Array<(batch: ReturnType<typeof writeBatch>) => void>
): Promise<void> {
  const CHUNK_SIZE = 400;
  for (let i = 0; i < ops.length; i += CHUNK_SIZE) {
    const batch = writeBatch(db);
    ops.slice(i, i + CHUNK_SIZE).forEach((fn) => fn(batch));
    await batch.commit();
  }
}

export async function resolveBranchContext(user: User): Promise<BranchContext> {
  const userEmail = (user.email ?? '').trim().toLowerCase();
  const isAdmin = userEmail === ADMIN_EMAIL;

  // Attempt to access primary shared Cam Ranh branch first
  const primaryPath = `branches/${PRIMARY_BRANCH_ID}`;
  try {
    const snap = await fetchBranchDocFromServer(
      doc(db, 'branches', PRIMARY_BRANCH_ID)
    );
    if (snap.exists()) {
      const data = snap.data();
      const emails = sanitizeEmailList([
        ...(Array.isArray(data.allowedEmails) ? data.allowedEmails : []),
        ADMIN_EMAIL,
      ]);
      return {
        branchId: PRIMARY_BRANCH_ID,
        ownerId: String(data.ownerId ?? user.uid),
        currentUserId: user.uid,
        currentUserEmail: userEmail,
        allowedEmails: emails,
        seeded: Boolean(data.seeded),
        isPrimaryBranch: true,
      };
    }

    if (isAdmin) {
      const initialEmails = sanitizeEmailList([ADMIN_EMAIL]);
      await setDoc(doc(db, 'branches', PRIMARY_BRANCH_ID), {
        name: 'PA Technical Maintenance | Cam Ranh',
        ownerId: user.uid,
        allowedEmails: initialEmails,
        seeded: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return {
        branchId: PRIMARY_BRANCH_ID,
        ownerId: user.uid,
        currentUserId: user.uid,
        currentUserEmail: userEmail,
        allowedEmails: initialEmails,
        seeded: false,
        isPrimaryBranch: true,
      };
    }
  } catch (err) {
    if (!isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.GET, primaryPath);
    }
    // Non-admin user isn't listed on Cam Ranh branch yet -> fall through to personal branch
  }

  const personalBranchId = sanitizeId(`u_${user.uid}`, 'u');
  const personalPath = `branches/${personalBranchId}`;
  try {
    const personalSnap = await fetchBranchDocFromServer(
      doc(db, 'branches', personalBranchId)
    );
    if (personalSnap.exists()) {
      const data = personalSnap.data();
      const emails = sanitizeEmailList([
        ...(Array.isArray(data.allowedEmails) ? data.allowedEmails : []),
        userEmail,
      ]);
      return {
        branchId: personalBranchId,
        ownerId: String(data.ownerId ?? user.uid),
        currentUserId: user.uid,
        currentUserEmail: userEmail,
        allowedEmails: emails,
        seeded: Boolean(data.seeded),
        isPrimaryBranch: false,
      };
    }

    const initialEmails = sanitizeEmailList([userEmail]);
    await setDoc(doc(db, 'branches', personalBranchId), {
      name: 'PA Technical Maintenance (Cá nhân)',
      ownerId: user.uid,
      allowedEmails: initialEmails,
      seeded: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return {
      branchId: personalBranchId,
      ownerId: user.uid,
      currentUserId: user.uid,
      currentUserEmail: userEmail,
      allowedEmails: initialEmails,
      seeded: false,
      isPrimaryBranch: false,
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, personalPath);
  }
}

async function fetchExistingDocIds(
  branchId: string,
  subcollection: string,
  userEmail: string
): Promise<Set<string>> {
  const snap = await getDocs(
    query(
      collection(db, 'branches', branchId, subcollection),
      where('allowedEmails', 'array-contains', userEmail)
    )
  );
  return new Set(snap.docs.map((d) => d.id));
}

export async function seedBranchIfNeeded(ctx: BranchContext): Promise<void> {
  if (ctx.seeded) return;

  const sourceDb = readLegacyLocalDb() ?? structuredClone(INITIAL_DB);
  const ops: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];

  try {
    const subsystems: SubsystemType[] = ['tanks', 'filters', 'hoses', 'electrics'];
    const existingByCol = await Promise.all(
      [...subsystems, 'customWorkspaces', 'customRows'].map(async (colName) => [
        colName,
        await fetchExistingDocIds(ctx.branchId, colName, ctx.currentUserEmail),
      ] as const)
    );
    const existingMap = new Map<string, Set<string>>(existingByCol);

    subsystems.forEach((sub) => {
      const existingIds = existingMap.get(sub) ?? new Set<string>();
      (sourceDb[sub] ?? []).forEach((rec, index) => {
        const id = sanitizeId(rec.id, sub);
        if (existingIds.has(id)) return;
        const fields = buildSubsystemRecordFields(sub, rec);
        ops.push((batch) => {
          batch.set(doc(db, 'branches', ctx.branchId, sub, id), {
            id,
            ownerId: ctx.currentUserId,
            allowedEmails: ctx.allowedEmails,
            ...fields,
            sortOrder: index,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        });
      });
    });

    // Create custom workspaces first, then rows (Master Gate requires workspace doc to exist on row create)
    const wsOps: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];
    const rowOps: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];
    const existingWsIds = existingMap.get('customWorkspaces') ?? new Set<string>();
    const existingRowIds = existingMap.get('customRows') ?? new Set<string>();

    (sourceDb.customWorkspaces ?? []).forEach((ws, wsIdx) => {
      const wsId = sanitizeId(ws.id, 'ws');
      const cleanCols = sanitizeCustomColumns(ws.columns);
      if (!existingWsIds.has(wsId)) {
        wsOps.push((batch) => {
          batch.set(doc(db, 'branches', ctx.branchId, 'customWorkspaces', wsId), {
            id: wsId,
            ownerId: ctx.currentUserId,
            allowedEmails: ctx.allowedEmails,
            name: clampStr(ws.name, 120) || 'Không gian tùy chỉnh',
            subtitle: clampStr(ws.subtitle, 120),
            description: clampStr(ws.description, 500),
            columns: cleanCols,
            sortOrder: wsIdx,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        });
      }

      (ws.rows ?? []).forEach((row, rowIdx) => {
        const rowId = sanitizeId(row.id, 'row');
        if (existingRowIds.has(rowId)) return;
        rowOps.push((batch) => {
          batch.set(doc(db, 'branches', ctx.branchId, 'customRows', rowId), {
            id: rowId,
            workspaceId: wsId,
            ownerId: ctx.currentUserId,
            allowedEmails: ctx.allowedEmails,
            values: sanitizeCustomRowValues(row.values),
            manualStatus: sanitizeManualStatus(row.manualStatus),
            sortOrder: rowIdx,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        });
      });
    });

    if (ops.length > 0) await commitOperationsInChunks(ops);
    if (wsOps.length > 0) await commitOperationsInChunks(wsOps);
    if (rowOps.length > 0) await commitOperationsInChunks(rowOps);
    await updateDoc(doc(db, 'branches', ctx.branchId), {
      seeded: true,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `branches/${ctx.branchId}`);
  }
}

export function subscribeToBranchDb(
  ctx: BranchContext,
  userEmail: string,
  callbacks: {
    onData: (dbState: MaintenanceDB, allowedEmails: string[]) => void;
    onError: (err: Error) => void;
  }
): Unsubscribe {
  const normalizedEmail = userEmail.trim().toLowerCase();
  const state: {
    tanks: Array<AnyRecord & { sortOrder?: number }>;
    filters: Array<AnyRecord & { sortOrder?: number }>;
    hoses: Array<AnyRecord & { sortOrder?: number }>;
    electrics: Array<AnyRecord & { sortOrder?: number }>;
    wsDocs: Array<Omit<CustomWorkspace, 'rows'> & { sortOrder?: number }>;
    rowDocs: Array<CustomRowRecord & { workspaceId: string; sortOrder?: number }>;
    allowedEmails: string[];
  } = {
    tanks: [],
    filters: [],
    hoses: [],
    electrics: [],
    wsDocs: [],
    rowDocs: [],
    allowedEmails: ctx.allowedEmails,
  };

  const ready = new Set<string>();
  const requiredKeys = [
    'branch',
    'tanks',
    'filters',
    'hoses',
    'electrics',
    'customWorkspaces',
    'customRows',
  ];

  const emitIfReady = () => {
    if (ready.size < requiredKeys.length) return;
    callbacks.onData(
      {
        tanks: sortByOrder(state.tanks) as MaintenanceDB['tanks'],
        filters: sortByOrder(state.filters) as MaintenanceDB['filters'],
        hoses: sortByOrder(state.hoses) as MaintenanceDB['hoses'],
        electrics: sortByOrder(state.electrics) as MaintenanceDB['electrics'],
        customWorkspaces: assembleCustomWorkspaces(state.wsDocs, state.rowDocs),
      },
      state.allowedEmails
    );
  };

  const unsubs: Unsubscribe[] = [];

  const branchPath = `branches/${ctx.branchId}`;
  unsubs.push(
    onSnapshot(
      doc(db, 'branches', ctx.branchId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.allowedEmails)) {
            state.allowedEmails = sanitizeEmailList(data.allowedEmails);
          }
        }
        ready.add('branch');
        emitIfReady();
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.GET, branchPath);
        } catch (wrapped) {
          callbacks.onError(wrapped as Error);
        }
      }
    )
  );

  const subNames: SubsystemType[] = ['tanks', 'filters', 'hoses', 'electrics'];
  subNames.forEach((sub) => {
    const colPath = `branches/${ctx.branchId}/${sub}`;
    const q = query(
      collection(db, 'branches', ctx.branchId, sub),
      where('allowedEmails', 'array-contains', normalizedEmail)
    );
    unsubs.push(
      onSnapshot(
        q,
        (snap) => {
          state[sub] = snap.docs.map((d) => {
            const raw = d.data();
            return {
              ...raw,
              id: d.id,
            } as unknown as AnyRecord & { sortOrder?: number };
          });
          ready.add(sub);
          emitIfReady();
        },
        (err) => {
          try {
            handleFirestoreError(err, OperationType.LIST, colPath);
          } catch (wrapped) {
            callbacks.onError(wrapped as Error);
          }
        }
      )
    );
  });

  const wsPath = `branches/${ctx.branchId}/customWorkspaces`;
  unsubs.push(
    onSnapshot(
      query(
        collection(db, 'branches', ctx.branchId, 'customWorkspaces'),
        where('allowedEmails', 'array-contains', normalizedEmail)
      ),
      (snap) => {
        state.wsDocs = snap.docs.map((d) => {
          const raw = d.data();
          return {
            id: d.id,
            name: String(raw.name ?? ''),
            subtitle: String(raw.subtitle ?? ''),
            description: String(raw.description ?? ''),
            columns: Array.isArray(raw.columns) ? raw.columns : [],
            sortOrder: typeof raw.sortOrder === 'number' ? raw.sortOrder : 0,
          };
        });
        ready.add('customWorkspaces');
        emitIfReady();
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, wsPath);
        } catch (wrapped) {
          callbacks.onError(wrapped as Error);
        }
      }
    )
  );

  const rowPath = `branches/${ctx.branchId}/customRows`;
  unsubs.push(
    onSnapshot(
      query(
        collection(db, 'branches', ctx.branchId, 'customRows'),
        where('allowedEmails', 'array-contains', normalizedEmail)
      ),
      (snap) => {
        state.rowDocs = snap.docs.map((d) => {
          const raw = d.data();
          return {
            id: d.id,
            workspaceId: String(raw.workspaceId ?? ''),
            values: (raw.values as Record<string, string>) ?? {},
            manualStatus: sanitizeManualStatus(raw.manualStatus),
            sortOrder: typeof raw.sortOrder === 'number' ? raw.sortOrder : 0,
          };
        });
        ready.add('customRows');
        emitIfReady();
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, rowPath);
        } catch (wrapped) {
          callbacks.onError(wrapped as Error);
        }
      }
    )
  );

  return () => {
    unsubs.forEach((u) => u());
  };
}

export async function saveSubsystemRecordInCloud(
  ctx: BranchContext,
  type: SubsystemType,
  values: Record<string, string>,
  sortOrder: number,
  existingId?: string
): Promise<void> {
  const id = existingId
    ? sanitizeId(existingId, type)
    : sanitizeId(`${type}-${Date.now()}`, type);
  const path = `branches/${ctx.branchId}/${type}/${id}`;
  const fields = buildSubsystemRecordFields(type, {
    ...values,
    id,
  } as unknown as AnyRecord);

  try {
    if (existingId) {
      await updateDoc(doc(db, 'branches', ctx.branchId, type, id), {
        allowedEmails: ctx.allowedEmails,
        ...fields,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(doc(db, 'branches', ctx.branchId, type, id), {
        id,
        ownerId: ctx.currentUserId,
        allowedEmails: ctx.allowedEmails,
        ...fields,
        sortOrder,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(
      err,
      existingId ? OperationType.UPDATE : OperationType.CREATE,
      path
    );
  }
}

export async function deleteSubsystemRecordInCloud(
  ctx: BranchContext,
  type: SubsystemType,
  id: string
): Promise<void> {
  const path = `branches/${ctx.branchId}/${type}/${id}`;
  try {
    await deleteDoc(doc(db, 'branches', ctx.branchId, type, id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveCustomWorkspaceInCloud(
  ctx: BranchContext,
  payload: {
    name: string;
    subtitle: string;
    description: string;
    columns: CustomColumnDef[];
  },
  sortOrder: number,
  existingId?: string
): Promise<string> {
  const wsId = existingId
    ? sanitizeId(existingId, 'ws')
    : sanitizeId(`custom-${Date.now()}`, 'ws');
  const path = `branches/${ctx.branchId}/customWorkspaces/${wsId}`;
  const cleanCols = sanitizeCustomColumns(payload.columns);

  try {
    if (existingId) {
      await updateDoc(doc(db, 'branches', ctx.branchId, 'customWorkspaces', wsId), {
        allowedEmails: ctx.allowedEmails,
        name: clampStr(payload.name, 120) || 'Không gian tùy chỉnh',
        subtitle: clampStr(payload.subtitle, 120),
        description: clampStr(payload.description, 500),
        columns: cleanCols,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(doc(db, 'branches', ctx.branchId, 'customWorkspaces', wsId), {
        id: wsId,
        ownerId: ctx.currentUserId,
        allowedEmails: ctx.allowedEmails,
        name: clampStr(payload.name, 120) || 'Không gian tùy chỉnh',
        subtitle: clampStr(payload.subtitle, 120),
        description: clampStr(payload.description, 500),
        columns: cleanCols,
        sortOrder,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    return wsId;
  } catch (err) {
    handleFirestoreError(
      err,
      existingId ? OperationType.UPDATE : OperationType.CREATE,
      path
    );
  }
}

export async function deleteCustomWorkspaceInCloud(
  ctx: BranchContext,
  workspaceId: string,
  rowIds: string[]
): Promise<void> {
  const path = `branches/${ctx.branchId}/customWorkspaces/${workspaceId}`;
  try {
    const ops: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];
    rowIds.forEach((rid) => {
      ops.push((batch) => {
        batch.delete(doc(db, 'branches', ctx.branchId, 'customRows', rid));
      });
    });
    ops.push((batch) => {
      batch.delete(
        doc(db, 'branches', ctx.branchId, 'customWorkspaces', workspaceId)
      );
    });
    await commitOperationsInChunks(ops);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveCustomRowInCloud(
  ctx: BranchContext,
  workspaceId: string,
  values: Record<string, string>,
  manualStatus: MaintenanceStatus | '',
  sortOrder: number,
  existingRowId?: string
): Promise<void> {
  const rowId = existingRowId
    ? sanitizeId(existingRowId, 'row')
    : sanitizeId(`row-${Date.now()}`, 'row');
  const path = `branches/${ctx.branchId}/customRows/${rowId}`;

  try {
    if (existingRowId) {
      await updateDoc(doc(db, 'branches', ctx.branchId, 'customRows', rowId), {
        allowedEmails: ctx.allowedEmails,
        values: sanitizeCustomRowValues(values),
        manualStatus: sanitizeManualStatus(manualStatus),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(doc(db, 'branches', ctx.branchId, 'customRows', rowId), {
        id: rowId,
        workspaceId: sanitizeId(workspaceId, 'ws'),
        ownerId: ctx.currentUserId,
        allowedEmails: ctx.allowedEmails,
        values: sanitizeCustomRowValues(values),
        manualStatus: sanitizeManualStatus(manualStatus),
        sortOrder,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(
      err,
      existingRowId ? OperationType.UPDATE : OperationType.CREATE,
      path
    );
  }
}

export async function deleteCustomRowInCloud(
  ctx: BranchContext,
  rowId: string
): Promise<void> {
  const path = `branches/${ctx.branchId}/customRows/${rowId}`;
  try {
    await deleteDoc(doc(db, 'branches', ctx.branchId, 'customRows', rowId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function replaceAllBranchDataInCloud(
  ctx: BranchContext,
  nextDb: MaintenanceDB,
  userEmail: string
): Promise<void> {
  const normalizedEmail = userEmail.trim().toLowerCase();
  const path = `branches/${ctx.branchId}`;
  try {
    const deleteOps: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];
    const collectionsToClear = [
      'tanks',
      'filters',
      'hoses',
      'electrics',
      'customRows',
      'customWorkspaces',
    ] as const;

    for (const colName of collectionsToClear) {
      const snap = await getDocs(
        query(
          collection(db, 'branches', ctx.branchId, colName),
          where('allowedEmails', 'array-contains', normalizedEmail)
        )
      );
      snap.forEach((d) => {
        deleteOps.push((batch) => batch.delete(d.ref));
      });
    }

    if (deleteOps.length > 0) {
      await commitOperationsInChunks(deleteOps);
    }

    const createOps: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];
    (['tanks', 'filters', 'hoses', 'electrics'] as SubsystemType[]).forEach(
      (sub) => {
        nextDb[sub].forEach((rec, index) => {
          const id = sanitizeId(rec.id, sub);
          const fields = buildSubsystemRecordFields(sub, rec);
          createOps.push((batch) => {
            batch.set(doc(db, 'branches', ctx.branchId, sub, id), {
              id,
              ownerId: ctx.currentUserId,
              allowedEmails: ctx.allowedEmails,
              ...fields,
              sortOrder: index,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          });
        });
      }
    );

    const wsOps: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];
    const rowOps: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];
    (nextDb.customWorkspaces ?? []).forEach((ws, wsIdx) => {
      const wsId = sanitizeId(ws.id, 'ws');
      wsOps.push((batch) => {
        batch.set(doc(db, 'branches', ctx.branchId, 'customWorkspaces', wsId), {
          id: wsId,
          ownerId: ctx.currentUserId,
          allowedEmails: ctx.allowedEmails,
          name: clampStr(ws.name, 120) || 'Không gian tùy chỉnh',
          subtitle: clampStr(ws.subtitle, 120),
          description: clampStr(ws.description, 500),
          columns: sanitizeCustomColumns(ws.columns),
          sortOrder: wsIdx,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      (ws.rows ?? []).forEach((row, rIdx) => {
        const rowId = sanitizeId(row.id, 'row');
        rowOps.push((batch) => {
          batch.set(doc(db, 'branches', ctx.branchId, 'customRows', rowId), {
            id: rowId,
            workspaceId: wsId,
            ownerId: ctx.currentUserId,
            allowedEmails: ctx.allowedEmails,
            values: sanitizeCustomRowValues(row.values),
            manualStatus: sanitizeManualStatus(row.manualStatus),
            sortOrder: rIdx,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        });
      });
    });

    if (createOps.length > 0) await commitOperationsInChunks(createOps);
    if (wsOps.length > 0) await commitOperationsInChunks(wsOps);
    if (rowOps.length > 0) await commitOperationsInChunks(rowOps);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateBranchAllowedEmailsInCloud(
  ctx: BranchContext,
  nextEmails: string[],
  currentUserEmail: string
): Promise<string[]> {
  const sanitized = sanitizeEmailList([ADMIN_EMAIL, currentUserEmail, ...nextEmails]);
  const normalizedCaller = currentUserEmail.trim().toLowerCase();
  const path = `branches/${ctx.branchId}`;

  try {
    const ops: Array<(batch: ReturnType<typeof writeBatch>) => void> = [
      (batch) => {
        batch.update(doc(db, 'branches', ctx.branchId), {
          allowedEmails: sanitized,
          updatedAt: serverTimestamp(),
        });
      },
    ];

    const subCollections = [
      'tanks',
      'filters',
      'hoses',
      'electrics',
      'customWorkspaces',
      'customRows',
    ] as const;

    for (const sub of subCollections) {
      const snap = await getDocs(
        query(
          collection(db, 'branches', ctx.branchId, sub),
          where('allowedEmails', 'array-contains', normalizedCaller)
        )
      );
      snap.forEach((d) => {
        ops.push((batch) => {
          batch.update(d.ref, {
            allowedEmails: sanitized,
            updatedAt: serverTimestamp(),
          });
        });
      });
    }

    await commitOperationsInChunks(ops);
    return sanitized;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}
