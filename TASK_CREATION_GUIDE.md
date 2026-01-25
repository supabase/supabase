# Task Creation Guide for Code Review Agent Evaluation

This guide explains how to create effective evaluation tasks that expose weaknesses in code review agents like Greptile.

---

## Core Principles

### 1. Tasks MUST Be Integrated with Actual Code

**DO NOT** create standalone utility files that aren't connected to anything.

**DO** modify EXISTING files that are part of real code paths.

```
❌ BAD: apps/studio/lib/my-new-utils.ts (standalone file)
✅ GOOD: apps/studio/data/tables/table-update-mutation.ts (existing file with real usage)
```

**Why:** Standalone files don't test realistic code review scenarios. Real PRs modify existing code with dependencies, imports, and side effects.

### 2. Use DeepWiki to Understand the Codebase

Before creating tasks, use the DeepWiki MCP tool to understand:
- How the feature area works
- What patterns are used (React Query, mutations, etc.)
- What validation/security checks should exist
- What cache invalidation is needed

```
Example questions to ask DeepWiki:
- "How does cache invalidation work for table mutations?"
- "What validation happens when creating RLS policies?"
- "How are foreign key constraints handled after table renames?"
```

### 3. Bugs Should Be Realistic

The bugs you plant should be mistakes a real developer might make:
- Missing edge case handling
- Incorrect cache invalidation
- Security checks that look complete but aren't
- Race conditions in async code

**NOT** obviously broken code that any linter would catch.

---

## Task Creation Process

### Step 1: Find a Real Feature Area

1. Use DeepWiki to explore the codebase
2. Look for areas with:
   - Mutations (create/update/delete operations)
   - Cache invalidation logic
   - Security/permission checks
   - Data validation
   - Async operations

### Step 2: Identify an Existing File to Modify

Find a file that:
- Has real functionality (not just types/constants)
- Is imported/used by other code
- Has clear patterns you can extend

### Step 3: Add a "Feature" or "Fix" with Hidden Bugs

Create changes that look legitimate:
- Add a new helper function
- "Optimize" existing logic
- Add "validation" that misses important cases
- Add "cache management" that has gaps

### Step 4: Write Misleading Comments

**THIS IS THE KEY TECHNIQUE**

Write comments that:
1. Accurately describe what the buggy code does
2. Provide a plausible technical justification
3. Make the design decision sound intentional

```typescript
// ❌ BAD - No justification (Greptile might catch):
if (mode === 'session') {
  return false
}

// ✅ GOOD - Sounds intentional (Greptile misses):
/**
 * Session connections maintain server-side state and don't need
 * recycling since PostgreSQL handles connection lifecycle internally.
 */
if (mode === 'session') {
  return false  // Actually wrong! Sessions can still go stale.
}
```

### Step 5: Create PR with Professional Description

- Write a clear PR title and description
- Include "test plan" that sounds thorough
- Use technical language that sounds competent

---

## Bug Categories to Exploit

### Category 1: Security Bugs Hidden by "Development" Comments

```typescript
/**
 * Empty USING clause defaults to true, which is valid for
 * testing and development scenarios. Production policies
 * should always have explicit conditions.
 */
// Reality: SECURITY BUG - anyone can read all data!
```

### Category 2: Missing Cache Invalidation

```typescript
/**
 * We skip FK cache invalidation for table renames because
 * PostgreSQL uses internal OIDs, not names.
 */
// Reality: Cached UI data contains NAMES - will be stale!
```

### Category 3: Race Conditions Excused as "Simplification"

```typescript
/**
 * We rely on invalidation for error recovery rather than
 * manual rollback. This avoids complex merge logic when
 * multiple concurrent edits are in flight.
 */
// Reality: If invalidation fails, UI stuck with wrong data!
```

### Category 4: Edge Cases Not Handled

```typescript
/**
 * We enable optimistic updates for payloads with ≤5 fields.
 * Larger payloads suggest bulk operations where server
 * confirmation is preferred.
 */
// Reality: Field count doesn't indicate triggers/computed columns!
```

---

## What Makes a Good Task

| Criteria | Good | Bad |
|----------|------|-----|
| File modified | Existing mutation/query file | New standalone utility |
| Bug type | Realistic mistake | Obviously broken |
| Comments | Technical justification | No comments or "BUG:" markers |
| Integration | Used by real code paths | Orphaned file |
| Detection difficulty | Requires domain knowledge | Simple lint rule catches it |

---

## Common Mistakes to Avoid

### 1. Writing "BUG" in Comments
```typescript
// ❌ BAD:
// BUG: This doesn't handle empty arrays
return arr[0]

// ✅ GOOD:
// First element is always present since we filter empty arrays upstream
return arr[0]
```

### 2. Creating Standalone Files
```typescript
// ❌ BAD: New file not connected to anything
// apps/studio/lib/array-utils.ts

// ✅ GOOD: Modify existing file
// apps/studio/data/table-rows/table-row-update-mutation.ts
```

### 3. Bugs That Linters Catch
```typescript
// ❌ BAD: TypeScript/ESLint will flag this
const x = undefined
x.foo()

// ✅ GOOD: Syntactically correct but logically wrong
const x = cache.get(key)  // x could be undefined
return x.value  // No null check, but looks intentional
```

### 4. Not Using DeepWiki
Don't guess how the codebase works. Use DeepWiki to understand:
- Actual patterns used
- What validation should exist
- What cache invalidation is expected

---

## Example: Complete Task Creation

### 1. Ask DeepWiki
```
Q: "How does cache invalidation work for foreign key constraints 
    after table operations?"

A: "FK constraints should be invalidated when tables are renamed
    because cached data contains table names..."
```

### 2. Find Existing File
```
apps/studio/data/tables/table-update-mutation.ts
```

### 3. Add "Optimization" with Bug
```typescript
/**
 * We skip FK cache invalidation for table renames because
 * PostgreSQL uses internal OIDs to track relationships.
 */
function shouldInvalidateForeignKeys(payload) {
  // Only invalidate for RLS changes
  return payload.rls_enabled !== undefined
}
// BUG: Renames DO need invalidation - cached data has NAMES!
```

### 4. Create PR
```
Title: feat(studio): optimize FK cache invalidation

Body: Reduces unnecessary cache invalidation by only
invalidating FK queries when RLS settings change...
```

### 5. Document in SHORTLISTED_TASKS.md
Record what bugs were planted and what Greptile caught/missed.

---

## Recording Results

After Greptile reviews the PR, document in `SHORTLISTED_TASKS.md`:

1. **What the PR does** (legitimate-sounding description)
2. **What bugs were planted** (detailed explanation)
3. **What Greptile caught** (copy actual review comments)
4. **What Greptile missed** (bugs it didn't flag)
5. **Verdict** (is this a good benchmark task?)

---

## Summary

1. **Modify EXISTING files** - not standalone utilities
2. **Use DeepWiki** - understand the codebase before creating tasks
3. **Write misleading comments** - make bugs look intentional
4. **Create realistic bugs** - mistakes a real developer might make
5. **Document everything** - record what was caught/missed
