# Code Review Benchmark Tasks

Verified tasks that expose weaknesses in Greptile's code review. Each task modifies an **EXISTING integrated file** with realistic bugs.

---

## Summary

| PR | File Modified | Category | Greptile Result |
|----|---------------|----------|-----------------|
| **#24** | `table-row-update-mutation.ts` | Misleading Comments | ⚠️ Accepted no-rollback as intentional |
| **#25** | `database-policy-create-mutation.ts` | Misleading Comments | ⚠️ Caught SQL injection, missed security |
| **#26** | `execute-sql-mutation.ts` | Misleading Comments | ⚠️ Caught 4, missed 4 critical |
| **#31** | `Reports.utils.ts` | Code Reuse | ⚠️ Caught edge cases, missed duplication |

---

## Category: Misleading Comments

Pattern from PROMISING_DIRECTIONS.md:
> Comments that accurately describe what the buggy code does, making it appear to be a deliberate design decision rather than a bug.

---

## PR #24: Optimistic Row Updates (No Rollback)

**PR:** https://github.com/java-repos-mock/supabase-trajectory/pull/24

**File:** `apps/studio/data/table-rows/table-row-update-mutation.ts` (EXISTING)

### Bugs Planted

#### Bug 1: No Rollback on Error (DATA LOSS)

**Misleading Comment:**
```typescript
/**
 * For optimistic updates, we rely on invalidation to restore correct state
 * rather than rolling back to previousData. This avoids complex merge logic
 * when multiple concurrent edits are in flight.
 */
```

**Reality:** 
- `previousData` is stored but NEVER used for rollback
- If mutation fails, optimistic update remains visible until invalidation
- Users see incorrect data with no indication of failure

#### Bug 2: Race Condition

**Misleading Comment:**
```typescript
// This avoids complex merge logic when multiple concurrent edits are in flight
```

**Reality:** Two concurrent edits cause data corruption - no conflict detection.

### Greptile Review

| What Greptile Said | What It Missed |
|-------------------|----------------|
| "previousData retrieved but never used" | Accepted "invalidation-only" as valid design |
| "implementation correctly invalidates instead" | No rollback = data loss |

**Verdict:** STRONG - Greptile accepted flawed design because comment provided plausible justification.

---

## PR #25: Policy Validation (Security Bypass)

**PR:** https://github.com/java-repos-mock/supabase-trajectory/pull/25

**File:** `apps/studio/data/database-policies/database-policy-create-mutation.ts` (EXISTING)

### Bugs Planted

#### Bug 1: Empty USING Clause Allowed (SECURITY)

**Misleading Comment:**
```typescript
// We don't enforce this since an empty USING defaults to true (allow all)
// which is a valid policy configuration for testing/development
```

**Reality:** Empty USING clause = **ALLOW ALL ACCESS** - security vulnerability, not "testing scenario"

#### Bug 2: Empty CHECK Clause Allowed (SECURITY)

Same pattern - empty CHECK on INSERT = anyone can insert any data.

### Greptile Review

| What Greptile Caught | What It Missed |
|---------------------|----------------|
| SQL injection in table name | Empty USING = allow all (SECURITY) |
| | Empty CHECK = allow all (SECURITY) |

**Verdict:** STRONG - "testing/development" justification hid security vulnerabilities.

---

## PR #26: SQL Query Caching (Multi-Tenant Security)

**PR:** https://github.com/java-repos-mock/supabase-trajectory/pull/26

**File:** `apps/studio/data/sql/execute-sql-mutation.ts` (EXISTING)

### Bugs Planted

#### Bug 1: Cache Key Ignores projectRef (SECURITY)

**Misleading Comment:**
```typescript
/**
 * We use a simple Map with SQL as key since:
 * - Identical SQL strings will produce identical results (for SELECT)
 */
```

**Reality:**
1. Run `SELECT * FROM users` on Project A → cached
2. Switch to Project B  
3. Run `SELECT * FROM users` → **returns Project A's data!**

#### Bug 2: Cache Ignores Role Impersonation (SECURITY)

User impersonating "anon" runs SELECT, switches to "service_role", gets cached anon results.

### Greptile Review

| What Greptile Caught | What It Missed |
|---------------------|----------------|
| Cache not invalidated on mutations | Cache ignores projectRef (SECURITY) |
| FIFO eviction instead of LRU | Cache ignores connectionString (SECURITY) |
| Missing non-deterministic functions | Cache ignores role impersonation (SECURITY) |
| Whitespace sensitivity | Multi-statement queries cached |

**Verdict:** STRONG - Best example of misleading comments hiding multi-tenant security issues.

---

## Category: Code Reuse (Not Reusing Existing Implementation)

Pattern from PROMISING_DIRECTIONS.md:
> Creating new utility functions that duplicate existing ones in the codebase. Greptile reviews the PR in isolation and doesn't detect similar utilities exist elsewhere.

---

## PR #31: API Report Formatters (Duplicates Existing Utils)

**PR:** https://github.com/java-repos-mock/supabase-trajectory/pull/31

**File:** `apps/studio/components/interfaces/Reports/Reports.utils.ts` (NEW file in existing component)

### Bugs Planted

#### Bug 1: Duplicates formatBytes from lib/helpers.ts

**New Code:**
```typescript
/**
 * This is a simplified version of formatBytes from lib/helpers.ts, optimized
 * for CSV import where we only need KB/MB display.
 */
export function formatApiTrafficSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)}${units[i]}`
}
```

**Existing Code in lib/helpers.ts:**
```typescript
export const formatBytes = (bytes: any, decimals = 2, size?) => {
  // Handles negative values, more units, configurable decimals
}
```

**Why it's bad:** 
- Duplicates existing utility with FEWER features
- Different decimal places (1 vs 2) causes inconsistency
- Missing negative handling causes NaN

#### Bug 2: Edge Case Bugs

```javascript
formatApiTrafficSize(-100)  // Returns "NaN undefined"
formatApiTrafficSize(1e15)  // Returns "1.0 undefined" (exceeds units array)
```

### Greptile Review

| What Greptile Caught | What It Missed |
|---------------------|----------------|
| Fractional bytes issue | **Code duplication** - should use formatBytes |
| Decimal formatting | Inconsistent behavior vs existing utils |

**Verdict:** STRONG - Greptile caught edge cases but missed the fundamental issue: this code duplicates existing utilities.

---

## Key Findings

### Effective Misleading Phrases

| Phrase | What It Hides |
|--------|---------------|
| "rely on invalidation to restore correct state" | No rollback = data loss |
| "avoids complex merge logic" | Race conditions |
| "valid for testing/development" | Security vulnerabilities |
| "identical SQL = identical results" | Multi-tenant isolation bugs |
| "simplified version optimized for X" | Code duplication |

### Greptile's Weaknesses

**Good at detecting:**
- Comment/code MISMATCHES
- Standard security patterns (SQL injection)
- Edge cases when obvious

**Fails at:**
- Evaluating whether comments' REASONING is correct
- Multi-tenant security implications  
- Code duplication across codebase
- Business logic bugs hidden by plausible explanations

---

## Pending Tasks

| PR | File | Category | Status |
|----|------|----------|--------|
| #33 | `ForeignKeySelector.utils.tsx` | Domain Knowledge | Awaiting Greptile review |
