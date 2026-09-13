---
title = "Edge Function bundle size issues"
topics = [ "functions" ]
keywords = [ "bundle", "size", "limit", "dependencies", "edge function", "5MB", "20MB" ]
database_id = "aaf9e673-64ae-460a-88e0-b83ea4963382"

[api]
cli = [ "supabase-functions-deploy" ]
---

The maximum size of a deployed Edge Function depends on how it's bundled:

- **Local bundling (Supabase CLI):** up to **20 MB**. The CLI bundles your function and its dependencies on your machine before uploading.
- **Server-side bundling (Management API or Dashboard):** up to **5 MB**. When you deploy without local bundling, bundling runs on the server, which has a lower infrastructure limit.

If your function exceeds the applicable limit, deployment fails with an error such as `Function source code exceeds the maximum deployment size`.

## Check your bundle size

Use the `deno info` command to analyze your function's dependencies and total size:

```bash
deno info /path/to/function/index.ts
```

Look for the "size" field in the output to see the total bundle size.

## How to reduce bundle size

If your bundle is too large, try these strategies:

### Remove unused dependencies

Review your imports and remove any packages you're not actively using.

### Use selective imports

Instead of importing entire packages, import only the specific modules you need:

```tsx
// Good: Import specific submodules
import { specific } from 'npm:package/specific'

// Avoid: Import entire package
import * as everything from 'npm:package'
```

### Split large functions

Consider breaking large functions into smaller, more focused functions. Each function can handle a specific task, reducing the code needed in any single deployment.

### Choose lightweight alternatives

Research smaller packages that provide the same functionality. Many NPM packages designed for Node.js include unnecessary polyfills that increase bundle size.

## Deploying larger functions

If your function is under 20 MB but exceeds the 5 MB server-side limit, bundle it locally with the Supabase CLI to get the higher limit. Run `supabase functions deploy` with the `--use-docker` flag to force local bundling.

## Additional resources

- [Unable to deploy Edge Function](./unable-to-deploy-edge-function)
- [Dependency analysis](./edge-function-dependency-analysis)
- [Edge Function limits](/docs/guides/functions/limits)
