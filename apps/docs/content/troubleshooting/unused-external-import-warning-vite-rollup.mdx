---
title = "UNUSED_EXTERNAL_IMPORT build warning with Vite, Rollup, or Nuxt"
topics = [ "platform" ]
keywords = [ "UNUSED_EXTERNAL_IMPORT", "vite", "rollup", "nuxt", "build warning", "false positive", "bundler", "supabase-js" ]
---

When bundling an application that uses `@supabase/supabase-js`, you may see warnings like:

```
"PostgrestError" is imported from external module "@supabase/postgrest-js" but never used in "...supabase-js/dist/index.mjs".
"FunctionRegion", "FunctionsError", "FunctionsFetchError", "FunctionsHttpError" and "FunctionsRelayError" are imported from external module "@supabase/functions-js" but never used in "...".
```

**This is a false positive — your bundle is correct and no code is missing.**

## Why this happens

`@supabase/supabase-js` re-exports error types like `PostgrestError` and `FunctionsError` so you can import them directly from `@supabase/supabase-js`. The build tool merges all imports from the same package into a single statement in the output:

```js
// dist/index.mjs (simplified)
import { PostgrestClient, PostgrestError } from '@supabase/postgrest-js'
//       ^ used internally    ^ re-exported for you
```

Vite/Rollup checks which names from that import are referenced _in the code body_ and flags `PostgrestError` as unused, because it only appears in an `export` statement — not called or assigned. The export itself is the real usage, but this check doesn't account for re-exports. Tree-shaking and bundle size are unaffected.

## Suppress the warning

### Vite / Rollup (`vite.config.js` or `rollup.config.js`)

```js
export default {
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT' && warning.exporter?.includes('@supabase/'))
          return
        warn(warning)
      },
    },
  },
}
```

### Nuxt (`nuxt.config.ts`)

<Admonition type="note">

This issue has been resolved in `@nuxtjs/supabase` version 2.0.4. If you are on that version or later, you do not need to apply this workaround.

</Admonition>

```ts
export default defineNuxtConfig({
  vite: {
    build: {
      rollupOptions: {
        onwarn(warning, warn) {
          if (warning.code === 'UNUSED_EXTERNAL_IMPORT' && warning.exporter?.includes('@supabase/'))
            return
          warn(warning)
        },
      },
    },
  },
})
```
