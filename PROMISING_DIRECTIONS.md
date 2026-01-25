# Promising Directions for Code Review Agent Evaluation

Failure modes and patterns where Greptile (and likely other code review agents) struggle. These are areas to explore for creating harder evaluation tasks.

---

## 1. Misleading Comments That Make Bugs Look Intentional

**Discovery:** PR #22, #24, #25

**Pattern:** Comments that accurately describe what the buggy code does, making it appear to be a deliberate design decision rather than a bug. The comment and code are consistent, but the design decision itself is wrong.

**Why it fails:** Code review agents trust comments as documentation of intent. When a comment explains WHY code does something (even if that reasoning is flawed), agents assume it's intentional and don't flag it.

**Key Insight:** Greptile catches comment/code MISMATCHES but can't determine which is correct. When comments MATCH the buggy code, Greptile doesn't flag it because it looks intentional.

**How to exploit:**
```typescript
// BAD (Greptile catches) - Comment doesn't match code:
// Invalidate FK cache when table name changes
if (payload.rls_enabled) { ... }  // Comment says "name", code checks "rls" - MISMATCH!

// GOOD (Greptile misses) - Comment matches buggy code perfectly:
/**
 * We skip FK cache invalidation for table renames because:
 * - PostgreSQL uses internal OIDs to track FK relationships
 * - The FK constraints remain valid after a rename
 */
function shouldInvalidateForeignKeys(payload) {
  // Only invalidate for RLS changes, not renames
  return payload.rls_enabled !== undefined
}
// Reality: Cached data contains table NAMES, not OIDs - UI shows stale data!
// But the comment MATCHES the code, so Greptile thinks it's intentional.
```

**Effective patterns:**
| Bug | Misleading Comment |
|-----|-------------------|
| No rollback on error | "rely on invalidation to restore correct state - avoids complex merge logic" |
| Security: empty USING clause | "defaults to true, valid for testing/development scenarios" |
| Race condition | "avoids complex merge logic when concurrent edits are in flight" |
| Skip validation | "PostgreSQL will provide better error messages" |

**Why this is powerful:** The comment provides a plausible-sounding technical justification. Greptile reads "PostgreSQL uses OIDs internally" and thinks "this person knows what they're doing."

---

## 2. Same Bug, Multiple Locations

**Discovery:** PR #18 - Port Ambiguity

**Pattern:** Greptile caught the bug for port 6543 (Supavisor vs PgBouncer) but missed the IDENTICAL bug for port 5432 (Direct vs Supavisor Session).

**Why it fails:** The agent identifies a pattern once but doesn't generalize to find all instances.

**How to exploit:**
- Introduce the same logical error in 3-5 different places
- Vary the context slightly (different variable names, different files)
- The agent may catch 1-2 but miss the others

**Example:**
```typescript
// Agent catches this:
const PORT_A = 6543  // Used by both X and Y - ambiguous!

// Agent misses this identical pattern:
const PORT_B = 5432  // Used by both P and Q - same ambiguity!
```

---

## 2. Unicode/Encoding Edge Cases

**Discovery:** PR #17 - btoa/atob with Unicode

**Pattern:** Standard browser APIs (`btoa`, `atob`) don't handle Unicode. Code review agents don't flag this because the code is syntactically correct.

**Why it fails:** Requires domain knowledge about JavaScript encoding limitations.

**How to exploit:**
- Use `btoa()` with data that could contain non-ASCII (user names, comments, IDs)
- Use `atob()` to decode potentially international content
- Use `encodeURIComponent` incorrectly

---

## 3. Session/Connection Lifecycle Bugs

**Discovery:** PR #18 - `shouldRecycleConnection`

**Pattern:** Code that handles long-lived resources (sessions, connections, subscriptions) has edge cases around cleanup and recycling that agents miss.

**Why it fails:** Requires understanding resource lifecycle and what "stale" means in context.

**How to exploit:**
- Return early for certain modes without checking all conditions
- Set timeout to 0 (no timeout = leak)
- Skip cleanup for certain states

---

## 4. Timeout/Duration = 0 Edge Cases

**Discovery:** PR #18 - `getConnectionTimeout` returns 0 for session

**Pattern:** Returning 0 for timeout/duration often means "no limit" which can cause resource leaks.

**Why it fails:** 0 is a valid number, agents don't recognize the semantic meaning of "no timeout".

**How to exploit:**
- Return 0 for timeout in certain modes
- Use 0 as default for rate limits
- Set retry count to 0 (meaning infinite retries)

---

## 5. Deduplication Key Insufficiency

**Discovery:** PR #17 - `deduplicateEvents` uses only timestamp

**Pattern:** Using a single field for deduplication when multiple events can share that field value.

**Why it fails:** Requires understanding data model and what makes an event unique.

**How to exploit:**
- Dedupe by timestamp (multiple events can have same timestamp)
- Dedupe by user ID (user can have multiple concurrent actions)
- Dedupe by session ID (sessions can have multiple events)

---

## 6. Return Value Contract Bugs

**Discovery:** PR #17 - `throttle` returns undefined

**Pattern:** Function returns different types in different cases (value vs undefined vs null).

**Why it fails:** TypeScript types may not capture runtime behavior precisely.

**How to exploit:**
- `throttle()` returns undefined when throttled, not last value
- Error handlers return different types
- Async functions that sometimes don't return

---

## 7. Multi-Tenant Data Leaks

**Discovery:** PR #17 - Global singleton manager

**Pattern:** Singletons or caches that aren't scoped to tenant/project/user.

**Why it fails:** Requires understanding multi-tenant architecture.

**How to exploit:**
- Global cache without tenant key
- Shared state across projects
- Event listeners that mix data from different users

---

## 8. Missing Edge Case Handling

**Discovery:** PR #17 - `throttle` returns undefined

**Pattern:** Code that handles the "happy path" but forgets edge cases like:
- Missing `else` branch (returns undefined)
- Empty array input
- Zero/negative values
- Null/undefined inputs
- Boundary conditions

**Why it fails:** The code is syntactically correct and works for normal cases. Edge cases require reasoning about "what if X doesn't happen?"

**How to exploit:**
```typescript
// Missing else - returns undefined
if (condition) {
  return value
}
// No else!

// Empty array not handled
function getFirst(arr) {
  return arr[0]  // undefined if empty
}

// Zero not handled
function divide(a, b) {
  return a / b  // Infinity or NaN if b=0
}

// Negative not handled
function getPage(page, size) {
  return data.slice(page * size)  // Wrong if page < 0
}
```

**Examples from our PRs:**
- `throttle()` - no else branch, returns undefined
- `shouldRecycleConnection()` - session mode returns false without checking age
- `getConnectionTimeout()` - returns 0 which means "no limit"

---

## Priority for Exploration

| Direction | Difficulty to Create | Impact | Priority |
|-----------|---------------------|--------|----------|
| **Misleading Comments** | Medium | Critical | ⭐⭐⭐ |
| Same Bug Multiple Locations | Easy | High | ⭐⭐⭐ |
| Unicode/Encoding | Medium | High | ⭐⭐⭐ |
| Timeout = 0 | Easy | Medium | ⭐⭐ |
| Deduplication Keys | Medium | High | ⭐⭐⭐ |
| Return Value Contracts | Easy | Medium | ⭐⭐ |
| Multi-Tenant Leaks | Hard | Critical | ⭐⭐⭐ |
| Resource Lifecycle | Medium | High | ⭐⭐ |

---

## Next Steps

1. Create PRs that specifically exploit "Same Bug Multiple Locations"
2. Create PRs with Unicode edge cases in realistic scenarios
3. Create PRs with multi-tenant data handling bugs
