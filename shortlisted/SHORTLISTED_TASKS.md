# Shortlisted Code Review Tasks

Tasks where Greptile missed meaningful bugs that require multi-hop reasoning or domain knowledge.

---

## PR #18: Connection Pool Configuration Utilities

**PR URL:** https://github.com/java-repos-mock/supabase-trajectory/pull/18

**Branch:** `feat/connection-pool-config`

### What the PR Does

Adds utilities for managing database connection pooling in Supabase Studio, supporting:
- Supavisor (session and transaction modes)
- PgBouncer
- Direct connections

### Files Changed

| File | Lines | Description |
|------|-------|-------------|
| `apps/studio/lib/connection-pool-config.ts` | 380 | Core utilities for pooler configuration |
| `apps/studio/hooks/misc/useConnectionPool.ts` | 283 | React hooks for connection management |

### Bugs Planted

#### Bug 1: `shouldRecycleConnection` Never Recycles Session Connections

**Location:** `connection-pool-config.ts` lines 236-246

```typescript
export function shouldRecycleConnection(
  connectionAge: number,
  mode: PoolingMode,
  maxAge: number = 3600000
): boolean {
  if (mode === 'session') {
    return false  // BUG: Always returns false regardless of age!
  }
  return connectionAge > maxAge
}
```

**Why it's a bug:** A 2-hour-old session connection (double the maxAge) will NOT be recycled. Stale connections may point to failed databases or have lost server-side state.

**Test to prove:**
```javascript
const connectionAge = 7200000  // 2 hours
const maxAge = 3600000         // 1 hour max
shouldRecycleConnection(connectionAge, 'session', maxAge)
// Returns: false
// Expected: true (connection is stale)
```

**Greptile missed:** Yes

---

#### Bug 2: Port 5432 Ambiguity (Same as 6543 Bug Greptile Caught)

**Location:** `connection-pool-config.ts` lines 44-49

```typescript
const DEFAULT_PORTS = {
  direct: 5432,
  supavisor_session: 5432,  // Same as direct!
  supavisor_transaction: 6543,
  pgbouncer: 6543,
}
```

**Why it's a bug:** Both `direct` and `supavisor session` use port 5432. You cannot determine the pooler type from a connection string with port 5432.

**Test to prove:**
```javascript
getPoolerPort('direct', 'session')      // Returns: 5432
getPoolerPort('supavisor', 'session')   // Returns: 5432
// Cannot distinguish them!
```

**Greptile caught 6543 ambiguity but MISSED this identical bug for 5432.**

---

#### Bug 3: `getConnectionTimeout` Returns 0 for Session Mode

**Location:** `connection-pool-config.ts` lines 220-231

```typescript
export function getConnectionTimeout(mode: PoolingMode): number {
  switch (mode) {
    case 'transaction': return 60000
    case 'session': return 0  // No timeout!
    case 'statement': return 30000
  }
}
```

**Why it's a bug:** Timeout of 0 means connections never timeout. If a client crashes without closing the connection, server resources are held indefinitely (resource leak).

**Greptile missed:** Yes

---

### What Greptile Caught

| Issue | Type |
|-------|------|
| Port 6543 ambiguity (supavisor vs pgbouncer) | Logic |
| Pool size logic using port instead of pooler | Logic |
| `useStaticEffectEvent` pattern for loadConfig | React |
| Missing import for useStaticEffectEvent | Syntax |
| Unused `mode` parameter in function | Style |

### What Greptile Missed

| Bug | Type | Why Hard to Detect |
|-----|------|-------------------|
| Port 5432 ambiguity | Logic | Same pattern as 6543 - failed to generalize |
| `shouldRecycleConnection` always false for session | Logic | Requires understanding session lifecycle |
| Session timeout = 0 (resource leak) | Resource | Requires understanding timeout implications |

### Verdict

**SHORTLISTED** - Contains meaningful bugs that Greptile missed, including a case where Greptile caught one instance of a bug pattern (6543 ambiguity) but missed the identical pattern (5432 ambiguity).

---

## PR #17: Realtime Subscription Manager & Pagination Utilities

**PR URL:** https://github.com/java-repos-mock/supabase-trajectory/pull/17

**Branch:** `feat/realtime-subscription-manager`

### What the PR Does

Adds utilities for:
- Realtime WebSocket subscription management with reconnection
- Rate limiting with exponential backoff
- Cursor-based and offset pagination

### Files Changed

| File | Lines | Description |
|------|-------|-------------|
| `apps/studio/lib/realtime-manager.ts` | 431 | WebSocket subscription manager |
| `apps/studio/lib/rate-limiter.ts` | 345 | Rate limiting utilities |
| `apps/studio/lib/pagination-utils.ts` | 368 | Pagination helpers |
| `apps/studio/hooks/misc/useRealtimeSubscription.ts` | 317 | React hooks |

### Bugs Planted

#### Bug 1: `encodeCursor`/`decodeCursor` - Unicode Crash

**Location:** `pagination-utils.ts` lines 134-148

```typescript
export function encodeCursor<T extends Record<string, unknown>>(data: T): string {
  return btoa(JSON.stringify(data))  // BUG: btoa crashes with Unicode!
}
```

**Why it's a bug:** `btoa()` only accepts Latin1 characters. If cursor data contains non-ASCII (Japanese usernames, emoji IDs), it throws `InvalidCharacterError`.

**Test to prove:**
```javascript
const data = { sort: '2024-01-01', id: 'user_日本語' }
btoa(JSON.stringify(data))
// Throws: InvalidCharacterError
```

**Greptile missed:** Yes

---

#### Bug 2: `deduplicateEvents` - Timestamp-Only Key

**Location:** `realtime-manager.ts` lines 358-368

```typescript
export function deduplicateEvents<T>(events: RealtimeEvent<T>[], seen: Set<string>): RealtimeEvent<T>[] {
  return events.filter((event) => {
    const key = event.timestamp  // BUG: Only uses timestamp!
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
```

**Why it's a bug:** Two different events with the same timestamp get incorrectly deduped. In high-throughput systems, multiple events can have identical timestamps.

**Test to prove:**
```javascript
const events = [
  { type: 'INSERT', new: { id: 1, name: 'Alice' }, timestamp: '2024-01-01T12:00:00.000Z' },
  { type: 'INSERT', new: { id: 2, name: 'Bob' }, timestamp: '2024-01-01T12:00:00.000Z' },
]
deduplicateEvents(events, new Set())
// Returns: 1 event (Alice only)
// Expected: 2 events (both are unique!)
```

**Greptile missed:** Yes

---

#### Bug 3: `throttle` Returns Undefined

**Location:** `rate-limiter.ts` lines 263-277

```typescript
export function throttle<T extends (...args: unknown[]) => unknown>(fn: T, limitMs: number): T {
  let lastCall = 0
  return ((...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= limitMs) {
      lastCall = now
      return fn(...args)
    }
    // BUG: No else branch - returns undefined when throttled!
  }) as T
}
```

**Why it's a bug:** Callers expecting a return value get `undefined` when throttled. This can cause UI to show blank/null values or trigger null reference errors.

**Test to prove:**
```javascript
const double = (x) => x * 2
const throttled = throttle(double, 1000)
throttled(5)   // Returns: 10
throttled(10)  // Returns: undefined (not 10 or 20!)
```

**Greptile missed:** Yes

---

### What Greptile Caught (Impressive!)

| Issue | Type |
|-------|------|
| Heartbeat interval unit confusion (30s as 30ms) | Unit |
| Heartbeat timeout calculation | Unit |
| `parseRetryAfter` seconds vs ms inconsistency | Unit |
| `X-RateLimit-Reset` is timestamp not duration | API contract |
| SQL injection in cursor WHERE clause | Security |
| Off-by-one in `hasNextPage` | Logic |
| `userState` object in effect deps | React |
| Stale closure with `onEvent` | React |

### What Greptile Missed

| Bug | Type | Why Hard to Detect |
|-----|------|-------------------|
| `btoa`/`atob` Unicode crash | Encoding | Requires JS encoding domain knowledge |
| `deduplicateEvents` timestamp-only | Data loss | Requires understanding event uniqueness |
| `throttle` returns undefined | Contract | Subtle - no explicit return in else branch |

### Verdict

**SHORTLISTED** - Despite Greptile catching many bugs (including SQL injection!), it missed encoding edge cases and subtle return value contracts that require domain knowledge.

---

## PR #16: Organization Invitation Management (WEAK CANDIDATE)

**PR URL:** https://github.com/java-repos-mock/supabase-trajectory/pull/16

**Branch:** `feat/project-invitations`

**Note:** This is a WEAKER candidate. Greptile caught 10 significant issues. Remaining bugs are conditional/fragile.

### What the PR Does

Adds organization invitation management:
- Invite members by email with role assignment
- Revoke pending invitations
- Accept invitations via token
- Expiration tracking

### Files Changed

| File | Lines | Description |
|------|-------|-------------|
| `apps/studio/lib/invitation-utils.ts` | 216 | Invitation utilities |
| `apps/studio/data/organization-invitations/*.ts` | ~400 | Query and mutation hooks |
| `apps/studio/hooks/misc/useOrganizationInvitations.ts` | 150 | Combined hook |

### Bugs Planted (Conditional)

#### Bug 1: Timezone Parsing Fragility

**Location:** `invitation-utils.ts` lines 49-56

```typescript
export function isInvitationExpired(invitation: OrganizationInvitation): boolean {
  const expiresAt = new Date(invitation.expires_at)  // Parses API timestamp
  const now = new Date()
  return expiresAt < now
}
```

**Why it's fragile:** If API returns timestamp WITHOUT 'Z' suffix (`2024-01-01T12:00:00` instead of `2024-01-01T12:00:00Z`), JavaScript parses it as local time. In non-UTC timezones, expiration check will be wrong.

**Test to prove:**
```javascript
new Date('2024-01-01T12:00:00Z').getTime()  // 1704110400000
new Date('2024-01-01T12:00:00').getTime()   // 1704139200000 (in UTC-8)
// 8 hour difference!
```

**Greptile missed:** Yes, but it's conditional on API format

---

#### Bug 2: Role ID Ordering Assumption

**Location:** `invitation-utils.ts` line 106

```typescript
export function canInviteWithRole(userRole: string, targetRole: string): boolean {
  // ...
  return userRoleObj.id <= targetRoleObj.id  // Assumes lower ID = higher privilege!
}
```

**Why it's fragile:** The code assumes role IDs are ordered by privilege (Owner=1, Admin=2, etc.). If API returns different IDs, the logic breaks silently.

**Greptile missed:** Yes, but it's an implicit assumption that currently works

---

### What Greptile Caught (10 comments!)

| Issue | Type |
|-------|------|
| Duplicated functionality (existing mutation) | Architecture |
| Missing cache invalidations | Logic |
| Unused `inviteeEmail` parameter | Style |
| Hardcoded roles (should come from API) | Logic |
| Comment vs code mismatch (`<=` vs `<`) | Logic |
| Silent error handling | Error handling |
| Unstable React dependencies (x2) | React |
| Token URL encoding | Security |
| Email validation approach | Logic |

### What Greptile Missed

| Bug | Type | Why Hard to Detect |
|-----|------|-------------------|
| Timezone parsing fragility | Conditional | Depends on API format, works in UTC |
| Role ID ordering assumption | Implicit | Works with current data, breaks if IDs change |

### Verdict

**WEAK SHORTLIST** - Greptile caught most significant bugs. Remaining issues are "fragile code" rather than guaranteed failures. Include if testing "implicit assumptions" or "API contract fragility" categories.

---

## PR #19: Array and Collection Utilities

**PR URL:** https://github.com/java-repos-mock/supabase-trajectory/pull/19

**Branch:** `feat/array-collection-utils`

### What the PR Does

Adds comprehensive array manipulation utilities for Supabase Studio:
- Element access (`first`, `last`, `nth`)
- Aggregation (`sum`, `average`, `min`, `max`)
- Set operations (`unique`, `intersection`, `difference`)
- Transformations (`chunk`, `flatten`, `partition`)
- Sorting and searching (`sortBy`, `binarySearch`)
- Object utilities (`pick`, `omit`, `deepClone`)

### Files Changed

| File | Lines | Description |
|------|-------|-------------|
| `apps/studio/lib/array-utils.ts` | 400 | Array utility functions |
| `apps/studio/lib/array-utils.test.ts` | 100 | Test file |

### Bugs Planted (12 Edge Cases)

| Bug | Code | Actual Behavior |
|-----|------|-----------------|
| `first([])` | `return arr[0]` | Returns `undefined` silently |
| `last([])` | `return arr[arr.length - 1]` | Returns `undefined` (arr[-1]) |
| `average([])` | `sum / numbers.length` | Returns `NaN` (0/0) |
| `min([])` | `Math.min(...numbers)` | Returns `Infinity` |
| `max([])` | `Math.max(...numbers)` | Returns `-Infinity` |
| `chunk(arr, 0)` | `i += size` | Infinite loop |
| `range(0, 5, -1)` | `i += step` | Infinite loop |
| `removeAt(arr, 999)` | `arr.splice(index, 1)` | Returns `undefined`, no error |
| `swap(arr, 0, 999)` | `arr[i] = arr[j]` | Sets `arr[0]` to `undefined` |
| `binarySearch(unsorted, x)` | Assumes sorted | Wrong results |
| `deepClone(circular)` | `JSON.stringify` | Throws error |
| `deepClone({fn: ()=>{}})` | `JSON.stringify` | Loses functions, Dates |

### What Greptile Caught (7-8 bugs)

| Bug | Greptile Comment |
|-----|------------------|
| `average([])` NaN | "Division by zero - empty array returns NaN" |
| `chunk(arr, 0)` | "Infinite loop if size is 0 or negative" |
| `range()` infinite loop | "Infinite loop if step is negative or zero" |
| `deepClone()` limitations | "loses Date, functions, undefined, circular refs" |
| `Math.min/max` stack overflow | "Spread operator causes stack overflow for large arrays" |
| `first([])` undefined | "Empty arrays return undefined (type unsafe)" |
| Missing test edge cases | Multiple comments on test file |

### What Greptile Missed (4 bugs)

| Bug | Type | Why Missed |
|-----|------|------------|
| `min([])` → `Infinity` | Counterintuitive return | Caught stack overflow but not empty array returning Infinity |
| `max([])` → `-Infinity` | Counterintuitive return | Same pattern, same miss |
| `removeAt(arr, invalidIndex)` | Missing bounds check | No validation of index parameter |
| `swap(arr, i, j)` invalid | Missing bounds check | No validation of indices |

*Note: `binarySearch(unsorted)` removed - expecting sorted input is a standard precondition, not a bug.*

### Verdict

**PARTIAL SHORTLIST** - Greptile caught ~65% of edge cases. Good at obvious patterns (division by zero, infinite loops). Misses counterintuitive return values (Infinity/-Infinity) and bounds checking.

**Categories:** `edge-case`, `bounds-checking`, `precondition-violation`

---

## PR #15: File Upload Utilities

**PR URL:** https://github.com/java-repos-mock/supabase-trajectory/pull/15

**Branch:** `feat/file-upload-utils`

### What the PR Does

Adds file upload utilities for Supabase Storage:
- File validation (size, MIME type)
- Progress tracking
- Chunked uploads
- Human-readable formatting (bytes, time remaining)

### Files Changed

| File | Lines | Description |
|------|-------|-------------|
| `apps/studio/lib/upload-utils.ts` | 325 | File upload utilities |
| `apps/studio/hooks/misc/useFileUpload.ts` | ~150 | React hook for uploads |

### Bugs Planted

#### Bug 1: KB vs KiB Naming Mismatch

**Location:** `upload-utils.ts` lines 85-100

```typescript
/**
 * Format bytes into human readable string using binary prefixes (KiB, MiB, GiB)
 */
export function formatBytes(bytes: number): string {
  const units = ['bytes', 'KB', 'MB', 'GB', 'TB']  // Uses KB not KiB!
  // ...calculates using 1024 (binary)
}
```

**Why it's a bug:** Comment says "binary prefixes (KiB, MiB, GiB)" but code uses decimal names (KB, MB, GB). This is a naming/documentation mismatch - confuses developers and potentially end users.

**Greptile missed:** Yes

---

#### Bug 2: `calculateProgress` Returns NaN for Zero Total

**Location:** `upload-utils.ts` lines 120-125

```typescript
export function calculateProgress(bytesUploaded: number, bytesTotal: number): number {
  return (bytesUploaded / bytesTotal) * 100  // NaN when bytesTotal = 0!
}
```

**Test to prove:**
```javascript
calculateProgress(0, 0)  // Returns: NaN
// Expected: 0 or 100 with explicit handling
```

**Greptile missed:** Yes

---

#### Bug 3: `formatTimeRemaining` Returns "calculating..." When Complete

**Location:** `upload-utils.ts` lines 140-155

```typescript
export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return 'calculating...'  // BUG: 0 means DONE, not calculating!
  // ...
}
```

**Why it's a bug:** When `seconds === 0`, upload is complete. Should return "Complete" or "Done", not "calculating...".

**Greptile missed:** Yes

---

### What Greptile Caught

| Issue | Type |
|-------|------|
| MIME type validation approach | Security |
| React hook patterns | React |
| Pause/resume not functional | Logic |
| Missing error handling | Logic |

### What Greptile Missed

| Bug | Type | Why Missed |
|-----|------|------------|
| KB vs KiB naming | Documentation | Comment/code mismatch |
| `calculateProgress(0, 0)` NaN | Edge case | Zero denominator |
| `formatTimeRemaining(0)` | Semantics | 0 seconds = complete, not calculating |

### Verdict

**SHORTLISTED** - Three edge case bugs missed. Good for testing `edge-case-zero-values` and `naming-documentation-mismatch` categories.

**Categories:** `edge-case-zero-values`, `naming-documentation-mismatch`

---

## PR #13: Encoding and String Utilities

**PR URL:** https://github.com/java-repos-mock/supabase-trajectory/pull/13

**Branch:** `feat/encoding-string-utils`

### What the PR Does

Adds encoding and string manipulation utilities:
- Base64 encoding/decoding for URLs
- String comparison and normalization
- Timestamp conversion heuristics
- Numeric comparison helpers

### Files Changed

| File | Lines | Description |
|------|-------|-------------|
| `apps/studio/lib/encoding-utils.ts` | 200 | Encoding utilities |
| `apps/studio/lib/string-utils.ts` | 150 | String utilities |

### Bugs Planted

#### Bug 1: `numbersEqual` Uses === for Floats

**Location:** `string-utils.ts` lines 89-92

```typescript
export function numbersEqual(a: number, b: number): boolean {
  return a === b  // BUG: Fails for floating point!
}
```

**Test to prove:**
```javascript
numbersEqual(0.1 + 0.2, 0.3)  // Returns: false!
// 0.1 + 0.2 = 0.30000000000000004
```

**Greptile missed:** Yes

---

#### Bug 2: `normalizeString` Missing Unicode Normalization

**Location:** `string-utils.ts` lines 45-50

```typescript
export function normalizeString(str: string): string {
  return str.trim().toLowerCase()  // No Unicode normalization!
}
```

**Test to prove:**
```javascript
const composed = 'café'        // Single character é (U+00E9)
const decomposed = 'café'      // e + combining accent (U+0065 + U+0301)
normalizeString(composed) === normalizeString(decomposed)  // false!
// Should use str.normalize('NFC') first
```

**Greptile missed:** Yes

---

#### Bug 3: `toMilliseconds` Heuristic Boundary Bug

**Location:** `encoding-utils.ts` lines 120-130

```typescript
export function toMilliseconds(timestamp: number): number {
  if (timestamp < 10000000000) {
    return timestamp * 1000  // Assume seconds
  }
  return timestamp  // Assume milliseconds
}
```

**Test to prove:**
```javascript
// Timestamps between 1970-04-26 and 2001-09-09 are ambiguous!
toMilliseconds(1000000000)   // Returns: 1000000000000 (treats as seconds)
// But it could BE 1000000000 milliseconds (Jan 12, 1970)
```

**Greptile missed:** Yes

---

#### Bug 4: `encodeForUrl` Uses Base64, Not Base64URL

**Location:** `encoding-utils.ts` lines 55-60

```typescript
export function encodeForUrl(data: string): string {
  return btoa(data)  // BUG: Base64, not Base64URL!
}
```

**Why it's a bug:** Standard Base64 contains `+`, `/`, and `=` which have special meaning in URLs. Base64URL uses `-` and `_` instead.

**Test to prove:**
```javascript
encodeForUrl('hello>>world')  // Returns: "aGVsbG8+Pndvcmxk" (contains no issues here)
encodeForUrl('subjects?')     // Returns: "c3ViamVjdHM/" (ends with / - URL unsafe!)
```

**Greptile missed:** Yes

---

### What Greptile Caught

| Issue | Type |
|-------|------|
| Deprecated `escape()` function | Deprecation |
| Case-insensitivity issues | Logic |
| React patterns | React |
| Error handling | Logic |
| 11 total comments | Various |

### What Greptile Missed

| Bug | Type | Why Missed |
|-----|------|------------|
| Float === comparison | Domain knowledge | IEEE 754 floating point |
| Unicode normalization | Domain knowledge | Unicode NFC/NFD forms |
| Timestamp heuristic boundary | Edge case | Ambiguous range |
| Base64 vs Base64URL | Domain knowledge | URL encoding standards |

### Verdict

**SHORTLISTED** - Four domain-knowledge bugs missed despite Greptile catching many other issues. Strong candidate for `domain-knowledge` benchmark category.

**Categories:** `domain-knowledge`, `edge-case`

---

## PR #20: Role Deletion URL Bypass Fix (SECURITY)

**PR URL:** https://github.com/java-repos-mock/supabase-trajectory/pull/20

**Branch:** `fix/role-deletion-bypass`

**Type:** REAL FIX - Modifies EXISTING file, fixes real GitHub issue #41599

### What the PR Does

Fixes a security vulnerability where users could bypass UI restrictions by manipulating URL query parameters:

- `?delete=roleId` allowed showing delete modal for any role
- `?new=true` allowed opening create role panel without permissions

**Changes made:**
- Added `isRoleDeletable()` helper to validate roles against `SUPABASE_ROLES` list
- Added permission check before allowing role creation via URL param
- Modified `select` function to validate role deletability

### Files Changed

| File | Lines | Description |
|------|-------|-------------|
| `apps/studio/components/interfaces/Database/Roles/RolesList.tsx` | +24 | Security validation for URL params |

### Bugs Planted

#### Bug 1: Missing Permission Check for Delete (SECURITY)

**Location:** `RolesList.tsx` - `isRoleDeletable()` function

```typescript
function isRoleDeletable(role: PostgresRole | undefined): boolean {
  if (!role) return false
  return !SUPABASE_ROLES.includes(role.name as SUPABASE_ROLE)
  // BUG: Only checks if Supabase role, NOT if user has permissions!
}
```

**Why it's a bug:** The function validates that the role is not a Supabase-managed role (anon, authenticated, etc.), but does NOT check if the user has `canUpdateRoles` permission. A viewer without permissions can still delete custom roles via `?delete=customRoleId`.

**Test to prove:**
```typescript
// User without canUpdateRoles permission navigates to:
// /dashboard/project/xyz/database/roles?delete=123
// 
// isRoleDeletable(customRole) returns true (it's not a Supabase role)
// DeleteRoleModal is shown
// User can delete the role!
```

---

#### Bug 2: Race Condition for Create

**Location:** `RolesList.tsx` - permission check

```typescript
const isCreatingRole = isCreatingRoleParam && canUpdateRoles
```

**Why it's a bug:** `canUpdateRoles` comes from `useAsyncCheckPermissions` which is async. During initial render, `canUpdateRoles` is `undefined` (falsy), so `isCreatingRole` will be `false` even if `?new=true` is in URL. This causes:
1. Panel doesn't show initially
2. Panel shows after permissions load (flicker)
3. Confusing UX

---

### What Greptile Said

| Aspect | Greptile's Assessment |
|--------|----------------------|
| Confidence Score | **5/5** |
| Safety | "This PR is safe to merge" |
| Validation | "The implementation properly validates both permission checks and role deletability" |
| Edge Cases | "No edge cases or security bypasses identified" |

### What Greptile Missed

| Bug | Type | Why Critical |
|-----|------|-------------|
| **Missing permission check** | Security | Viewers can delete custom roles - AUTHENTICATION BYPASS |
| Race condition | UX | Panel flickers on load |

### Verdict

**STRONG SHORTLIST** - Greptile gave 5/5 confidence score and said "safe to merge" but missed a **security vulnerability**. The code *looks* like it's doing proper validation (checks Supabase roles) but has a critical gap (doesn't check user permissions).

**Categories:** `security`, `incomplete-validation`, `looks-correct-but-wrong`

---

## PR #21: SQL Editor Query Stats (BAD PRACTICE)

**PR URL:** https://github.com/java-repos-mock/supabase-trajectory/pull/21

**Branch:** `feat/sql-editor-query-stats`

**Type:** FEATURE - Modifies EXISTING file with new utility functions

### What the PR Does

Adds utilities to format and display query execution statistics:

- `formatExecutionTime(ms)`: Format milliseconds to human-readable time
- `formatResultSize(bytes)`: Format bytes to human-readable size
- `formatQueryStats(stats)`: Combine stats into display string
- `estimateQueryComplexity(sql)`: Estimate query complexity (1-10)
- `getComplexityLabel(score)`: Get human-readable label

### Files Changed

| File | Lines | Description |
|------|-------|-------------|
| `apps/studio/components/interfaces/SQLEditor/SQLEditor.utils.ts` | +90 | New utility functions |
| `apps/studio/components/interfaces/SQLEditor/SQLEditor.utils.test.ts` | +80 | Tests for new functions |

### Bugs Planted

#### Bug 1: Not Reusing Existing `formatDuration`

**Location:** `SQLEditor.utils.ts`

```typescript
// NEW function in SQLEditor.utils.ts
export const formatExecutionTime = (ms: number): string => {
  if (ms < 1000) return `${ms.toFixed(2)}ms`
  else if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`
  // ...
}

// EXISTING function in QueryPerformance.utils.ts (NOT IMPORTED)
export const formatDuration = (milliseconds: number) => {
  const duration = dayjs.duration(milliseconds, 'milliseconds')
  // Different implementation using dayjs
}
```

**Why it's a bug:** Duplicates existing `formatDuration` from `QueryPerformance.utils.ts` with DIFFERENT behavior. Should import and reuse existing utility.

---

#### Bug 2: Not Reusing Existing `formatBytes`

**Location:** `SQLEditor.utils.ts`

```typescript
// NEW function
export const formatResultSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  else if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  // ...
}

// EXISTING function in lib/helpers.ts (NOT IMPORTED)
export const formatBytes = (bytes: any, decimals = 2, size?) => {
  // Different implementation with more features
}
```

**Why it's a bug:** Duplicates `formatBytes` from `lib/helpers.ts` with different decimal places (1 vs 2) and fewer features.

---

#### Bug 3: No Edge Case Handling

```typescript
formatExecutionTime(0)    // Returns "0.00ms" - OK
formatExecutionTime(-100) // Returns "-100.00ms" - Should handle negative!
formatResultSize(0)       // Returns "0 B" - OK  
formatResultSize(-100)    // Returns "-100 B" - Should handle negative!
```

---

### What Greptile Said

*Pending review*

### Bugs Greptile Should Catch

| Bug | Type | Difficulty |
|-----|------|------------|
| Not reusing `formatDuration` | Bad Practice | Should detect duplicate functionality |
| Not reusing `formatBytes` | Bad Practice | Should detect duplicate functionality |
| No negative number handling | Edge Case | Should detect missing validation |
| Inconsistent decimal places | Consistency | Might miss |

### Verdict

**PENDING** - Waiting for Greptile review. Tests "bad code practice" detection - whether Greptile can identify code that duplicates existing utilities instead of reusing them.

**Categories:** `bad-practice`, `code-duplication`, `not-reusing-utilities`

---
