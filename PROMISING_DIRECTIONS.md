# Promising Directions for Code Review Agent Evaluation

Failure modes where Greptile (and likely other code review agents) struggle.

---

## 1. Misleading Comments That Make Bugs Look Intentional

**Pattern:** Comments that accurately describe what the buggy code does, making it appear to be a deliberate design decision rather than a bug.

**Why it fails:** Code review agents trust comments as documentation of intent. When a comment explains WHY code does something (even if that reasoning is flawed), agents assume it's intentional.

**Key Insight:** Greptile catches comment/code MISMATCHES but can't determine which is correct. When comments MATCH the buggy code, Greptile doesn't flag it.

**How to exploit:**
```typescript
// BAD (Greptile catches) - Comment doesn't match code:
// Invalidate FK cache when table name changes
if (payload.rls_enabled) { ... }  // MISMATCH!

// GOOD (Greptile misses) - Comment matches buggy code:
/**
 * We skip FK cache invalidation for table renames because:
 * - PostgreSQL uses internal OIDs to track FK relationships
 * - The FK constraints remain valid after a rename
 */
function shouldInvalidateForeignKeys(payload) {
  return payload.rls_enabled !== undefined
}
// Reality: Cached data contains NAMES, not OIDs - UI shows stale data!
```

**Examples:**
| Bug | Misleading Comment |
|-----|-------------------|
| No rollback on error | "rely on invalidation to restore correct state" |
| Security: empty USING clause | "defaults to true, valid for testing" |
| Race condition | "avoids complex merge logic" |
| Skip validation | "PostgreSQL provides better error messages" |

---

## 2. Edge Cases Not Handled

**Pattern:** Code that handles the "happy path" but fails for edge cases like empty arrays, zero values, null inputs, or boundary conditions.

**Why it fails:** The code is syntactically correct and works for normal cases. Edge cases require reasoning about "what if X is empty/zero/null?"

**How to exploit:**
```typescript
// Empty array not handled
function min(numbers: number[]): number {
  return Math.min(...numbers)  // Returns Infinity for []
}

// Zero not handled  
function divide(a: number, b: number): number {
  return a / b  // Returns Infinity or NaN if b=0
}

// Null not handled
function getFirst<T>(arr: T[]): T {
  return arr[0]  // Returns undefined if empty
}
```

---

## 3. Not Reusing Existing Implementation

**Pattern:** Creating new utility functions that duplicate existing ones in the codebase.

**Why it fails:** Greptile reviews the PR in isolation and doesn't detect that similar utilities already exist elsewhere in the codebase.

**How to exploit:**
```typescript
// NEW function added in PR:
export function formatExecutionTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

// EXISTING function already in codebase (not imported):
// QueryPerformance.utils.ts has formatDuration() that does the same thing!
```

Greptile approves without knowing the functionality is duplicated.

---

## 4. Same Bug, Multiple Locations

**Pattern:** Greptile catches a bug once but misses IDENTICAL bugs elsewhere in the same PR.

**Why it fails:** The agent identifies a pattern once but doesn't generalize to find all instances.

**How to exploit:**
- Introduce the same logical error in 3-5 different places
- Vary the context slightly (different variable names, different functions)
- Agent catches 1-2 but misses the others

```typescript
// Agent catches this:
const PORT_A = 6543  // Used by both X and Y - ambiguous!

// Agent misses this identical pattern:
const PORT_B = 5432  // Used by both P and Q - same ambiguity!
```

---

## Priority

| Direction | Difficulty | Impact |
|-----------|------------|--------|
| Misleading Comments | Medium | High |
| Edge Cases Not Handled | Easy | Medium |
| Not Reusing Existing | Easy | Medium |
| Same Bug Multiple Locations | Easy | High |
