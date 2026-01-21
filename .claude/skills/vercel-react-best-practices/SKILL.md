---
name: vercel-react-best-practices
description: React and Next.js performance optimization guidelines from Vercel Engineering. This skill should be used when writing, reviewing, or refactoring React/Next.js code to ensure optimal performance patterns. Triggers on tasks involving React components, Next.js pages, data fetching, bundle optimization, or performance improvements.
license: MIT
metadata:
  author: vercel
  version: '1.1.0'
---

# Vercel React Best Practices

Comprehensive performance optimization guide for React and Next.js applications, maintained by Vercel. Contains 38 rules across 7 categories, prioritized by impact to guide automated refactoring and code generation.

## When to Apply

Reference these guidelines when:

- Writing new React components or Next.js pages
- Implementing data fetching (client or server-side)
- Reviewing code for performance issues
- Refactoring existing React/Next.js code
- Optimizing bundle size or load times

## Rule Categories by Priority

| Priority | Category                 | Impact          | Prefix       |
| -------- | ------------------------ | --------------- | ------------ |
| 1        | Eliminating Waterfalls   | CRITICAL-HIGH   | `async-`     |
| 2        | Bundle Size Optimization | CRITICAL-MEDIUM | `bundle-`    |
| 3        | Client-Side Patterns     | MEDIUM          | `client-`    |
| 4        | Re-render Optimization   | MEDIUM          | `rerender-`  |
| 5        | Rendering Performance    | LOW-HIGH        | `rendering-` |
| 6        | JavaScript Performance   | LOW-MEDIUM      | `js-`        |
| 7        | Advanced Patterns        | LOW             | `advanced-`  |

## Quick Reference

### 1. Eliminating Waterfalls (CRITICAL-HIGH)

- `async-defer-await` - Move await into branches where actually used (HIGH)
- `async-parallel` - Use Promise.all() for independent operations (CRITICAL)

### 2. Bundle Size Optimization (CRITICAL-MEDIUM)

- `bundle-barrel-imports` - Import directly, avoid barrel files (CRITICAL)
- `bundle-dynamic-imports` - Use next/dynamic for heavy components (CRITICAL)
- `bundle-conditional` - Load modules only when feature is activated (HIGH)
- `bundle-preload` - Preload on hover/focus for perceived speed (MEDIUM)

### 3. Client-Side Patterns (MEDIUM)

- `client-localstorage-schema` - Version and minimize localStorage data (MEDIUM)
- `client-passive-event-listeners` - Use passive listeners for scroll performance (MEDIUM)

### 4. Re-render Optimization (MEDIUM)

- `rerender-defer-reads` - Don't subscribe to state only used in callbacks (MEDIUM)
- `rerender-memo` - Extract expensive work into memoized components (MEDIUM)
- `rerender-memo-with-default-value` - Extract default non-primitive params to constants (MEDIUM)
- `rerender-simple-expression-in-memo` - Don't wrap simple primitive expressions in useMemo (LOW-MEDIUM)
- `rerender-dependencies` - Use primitive dependencies in effects (LOW)
- `rerender-derived-state` - Subscribe to derived booleans, not raw values (MEDIUM)
- `rerender-functional-setstate` - Use functional setState for stable callbacks (MEDIUM)
- `rerender-lazy-state-init` - Pass function to useState for expensive values (MEDIUM)
- `rerender-transitions` - Use startTransition for non-urgent updates (MEDIUM)

### 5. Rendering Performance (LOW-HIGH)

- `rendering-content-visibility` - Use content-visibility for long lists (HIGH)
- `rendering-hydration-no-flicker` - Use inline script for client-only data (MEDIUM)
- `rendering-activity` - Use Activity component for show/hide (MEDIUM)
- `rendering-hoist-jsx` - Extract static JSX outside components (LOW)
- `rendering-animate-svg-wrapper` - Animate div wrapper, not SVG element (LOW)
- `rendering-svg-precision` - Reduce SVG coordinate precision (LOW)
- `rendering-conditional-render` - Use ternary, not && for conditionals (LOW)

### 6. JavaScript Performance (LOW-MEDIUM)

- `js-length-check-first` - Check array length before expensive comparison (MEDIUM-HIGH)
- `js-tosorted-immutable` - Use toSorted() for immutability (MEDIUM-HIGH)
- `js-batch-dom-css` - Avoid layout thrashing, batch reads/writes (MEDIUM)
- `js-cache-function-results` - Cache function results in module-level Map (MEDIUM)
- `js-index-maps` - Build Map for repeated lookups (LOW-MEDIUM)
- `js-cache-property-access` - Cache object properties in loops (LOW-MEDIUM)
- `js-cache-storage` - Cache localStorage/sessionStorage reads (LOW-MEDIUM)
- `js-combine-iterations` - Combine multiple filter/map into one loop (LOW-MEDIUM)
- `js-early-exit` - Return early from functions (LOW-MEDIUM)
- `js-hoist-regexp` - Hoist RegExp creation outside loops (LOW-MEDIUM)
- `js-set-map-lookups` - Use Set/Map for O(1) lookups (LOW-MEDIUM)
- `js-min-max-loop` - Use loop for min/max instead of sort (LOW)

### 7. Advanced Patterns (LOW)

- `advanced-event-handler-refs` - Store event handlers in refs (LOW)
- `advanced-use-latest` - useEffectEvent for stable callback refs (LOW)

## How to Use

Read individual rule files for detailed explanations and code examples:

```
rules/async-parallel.md
rules/bundle-barrel-imports.md
rules/rerender-memo.md
```

Each rule file contains:

- Frontmatter with title, impact level, and tags
- Brief explanation of why it matters
- Incorrect code example with explanation
- Correct code example with explanation
- Additional context and references

## Rule File Format

Each rule file uses this structure:

```markdown
---
title: Rule Name
impact: CRITICAL | HIGH | MEDIUM | LOW
impactDescription: brief impact summary
tags: comma, separated, tags
---

## Rule Name

Explanation of the rule.

**Incorrect:**
\`\`\`tsx
// bad code
\`\`\`

**Correct:**
\`\`\`tsx
// good code
\`\`\`
```
