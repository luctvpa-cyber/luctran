# Security Specification: PA Technical Maintenance Firestore Rules

## 1. Data Invariants
1. Every document lives under `/branches/{branchId}` where `branchId` matches `^[a-zA-Z0-9_\-]+$`.
2. Unauthenticated requests (`request.auth == null`) and unverified email accounts (`email_verified != true`) cannot read or write any document.
3. Every subcollection write (`tanks`, `filters`, `hoses`, `electrics`, `customWorkspaces`, `customRows`) requires the parent branch document `/branches/{branchId}` to exist (`exists(...)`), and `customRows` additionally verifies that `workspaceId` exists under `/branches/{branchId}/customWorkspaces/{workspaceId}`.
4. `ownerId` and `createdAt` are immutable after creation; `updatedAt` must always equal `request.time`.
5. `allowedEmails` is strictly bounded (`size() >= 1 && size() <= 20`, first element `is string`) and all string fields enforce explicit `size()` limits matching `firebase-blueprint.json`.
6. `allow list` never uses `get()` or `exists()`, and always validates against `resource.data` (`ownerId`, `allowedEmails`, or bootstrapped verified admin email).

## 2. Adversarial "Dirty Dozen" Payloads (All Must Return PERMISSION_DENIED)
1. **Unauthenticated read/write**: `request.auth == null` reading `/branches/cam-ranh` -> DENIED.
2. **Unverified email spoofing**: `request.auth.token.email == 'pepsimessi997@gmail.com'` with `email_verified: false` -> DENIED.
3. **Ghost field injection (Shadow Update)**: Creating/updating `TankRecord` with extra field `isAdmin: true` -> DENIED by `keys().hasOnly(...)` / `affectedKeys().hasOnly(...)`.
4. **Oversized ID poisoning**: Document ID longer than 128 chars or containing invalid characters (`../etc`) -> DENIED by `isValidId(...)`.
5. **Owner spoofing on create**: Creating a record with `ownerId: 'other-uid'` by non-admin -> DENIED.
6. **Immutable field tampering on update**: Updating `ownerId` or `createdAt` -> DENIED.
7. **Client timestamp forgery**: Sending `updatedAt: new Date()` instead of `request.time` -> DENIED.
8. **Missing parent branch (Orphaned record)**: Writing to `/branches/nonexistent/tanks/t1` -> DENIED by Master Gate `exists(...)`.
9. **Orphaned custom row**: Writing `customRows/r1` whose `workspaceId` does not exist in `customWorkspaces` -> DENIED.
10. **Invalid enum `manualStatus`**: Setting `manualStatus: 'hacked'` -> DENIED.
11. **Oversized string DoS / Denial of Wallet**: Setting `position` > 200 chars or `note` > 1000 chars -> DENIED.
12. **Unbounded array / empty columns**: Creating `customWorkspaces` with `columns: []` or > 30 columns -> DENIED.
