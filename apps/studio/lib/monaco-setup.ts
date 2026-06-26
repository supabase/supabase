import { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'

/**
 * Make the whole app share a single Monaco instance.
 *
 * Studio (`@monaco-editor/react`) and GraphiQL (`@graphiql/react`) both depend on
 * `monaco-editor` at the same version. Previously Studio loaded Monaco via the AMD loader
 * (separate copy) while GraphiQL bundled its own ESM copy — two instances on one page, each
 * injecting Monaco's global CSS (the `.monaco-editor` layout rules and the `.mtk*` theme
 * classes). Those collide: after visiting GraphiQL the SQL editor's wrapper got reflowed and
 * its syntax colors swapped to GraphiQL's theme.
 *
 * By importing `monaco-editor` here and handing it to `@monaco-editor/react`'s loader, the
 * bundler dedupes GraphiQL's copy with ours, so there is one instance, one set of injected
 * styles, and one active theme (re-applied per route on mount).
 *
 * Client-only: `monaco-editor` touches browser globals on import, so this module must only be
 * imported behind a `window` guard. The worker `new URL(..., import.meta.url)` references are
 * resolved and bundled by Webpack/Turbopack (same pattern as `@graphiql/react/setup-workers`).
 */

const environment: monaco.Environment = {
  getWorker(_workerId, label) {
    switch (label) {
      case 'json':
        return new Worker(
          new URL('monaco-editor/esm/vs/language/json/json.worker.js', import.meta.url)
        )
      case 'css':
      case 'scss':
      case 'less':
        return new Worker(
          new URL('monaco-editor/esm/vs/language/css/css.worker.js', import.meta.url)
        )
      case 'html':
      case 'handlebars':
      case 'razor':
        return new Worker(
          new URL('monaco-editor/esm/vs/language/html/html.worker.js', import.meta.url)
        )
      case 'typescript':
      case 'javascript':
        return new Worker(
          new URL('monaco-editor/esm/vs/language/typescript/ts.worker.js', import.meta.url)
        )
      case 'graphql':
        return new Worker(new URL('monaco-graphql/esm/graphql.worker.js', import.meta.url))
      default:
        return new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url))
    }
  },
}

// `MonacoEnvironment` is an ambient global declared by monaco-editor (not a property of
// globalThis), so assign through a narrow cast on `self`.
;(self as unknown as { MonacoEnvironment?: monaco.Environment }).MonacoEnvironment = environment
loader.config({ monaco })
