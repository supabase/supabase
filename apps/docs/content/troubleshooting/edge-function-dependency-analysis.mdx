---
title = "Edge Function dependency analysis"
topics = [ "functions" ]
keywords = [ "dependencies", "npm", "deno", "imports", "bundle", "optimization", "edge function" ]
database_id = "e079a9d0-419a-4e31-b7ec-1206d9012d0b"
---

Optimize your Edge Function dependencies for better performance. Large or unnecessary dependencies can significantly impact bundle size, boot time, and memory usage.

## Analyzing Deno dependencies

Start by analyzing your dependency tree to understand what's being imported:

```bash
# Basic dependency analysis
deno info /path/to/function/index.ts

# With import map (if using one)
deno info --import-map=/path/to/import_map.json /path/to/function/index.ts
```

## What to look for

Review the output for:

- **Large dependencies:** Packages that contribute significantly to bundle size
- **Redundant imports:** Multiple packages providing similar functionality
- **Outdated versions:** Dependencies that can be updated to more efficient versions
- **Unused imports:** Dependencies imported but not actually used in your code

## Optimizing NPM dependencies

When using NPM modules, keep their impact on bundle size in mind. Many NPM packages are designed for Node.js and may include unnecessary polyfills or large dependency trees.

### Use selective imports

Import specific submodules to minimize overhead:

```tsx
// Good: Import specific submodules
import { Sheets } from 'npm:@googleapis/sheets'
import { JWT } from 'npm:google-auth-library/build/src/auth/jwtclient'

// Avoid: Import entire package
import * as googleapis from 'npm:googleapis'
import * as googleAuth from 'npm:google-auth-library'
```

## Best practices

### Tree-shake aggressively

Only import what you actually use. Avoid wildcard imports (`import *`) when possible.

### Choose lightweight alternatives

Research smaller packages that provide the same functionality. Consider:

- Native Deno APIs instead of NPM polyfills
- Focused single-purpose packages instead of large utility libraries

### Bundle analysis

Use `deno info` before and after changes to measure the impact of dependency modifications.

### Version pinning

Lock dependency versions to avoid unexpected size increases from automatic updates:

```tsx
// Pin to specific version
import { something } from 'npm:package@1.2.3'
```

## Common heavy dependencies

Watch out for these commonly heavy packages:

- Full AWS SDK (use individual service packages instead)
- Moment.js (consider [`date-fns`](https://date-fns.org/)) or native Date APIs)
- Lodash (import specific functions: `lodash/get`)
- Full Google APIs (use specific service packages)

## Additional resources

- [Bundle size issues](./edge-function-bundle-size-issues)
- [Edge Function takes too long to respond](./edge-function-takes-too-long-to-respond)
- [Edge Function limits](/docs/guides/functions/limits)
