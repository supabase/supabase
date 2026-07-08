import type { ReactNode } from 'react'

// Next/Head's job is to inject children into the document `<head>` and
// deduplicate them by `key` prop. React 19 ships native "document
// metadata" hoisting: any `<title>`, `<meta>`, `<link>`, `<style>`, or
// `<script>` rendered anywhere in the tree is hoisted to `<head>`
// automatically and works for both client render and SSR. Studio uses
// `<Head>` exclusively for those elements (`<title>`, `<meta>`,
// `<link>` — see `pages/maintenance.tsx`, `pages/claim-project.tsx`,
// etc.), so the shim can be a passthrough that lets React do the
// hoisting.
//
// Trade-offs vs the previous `createPortal(children, document.head)`
// approach:
//   - SSR: the portal returned `null` on the server, so head content
//     from `<Head>` was never in the prerendered HTML. Native hoisting
//     emits the metadata in the prerendered output.
//   - Deduplication: React 19 dedupes `<title>` (last one wins, same
//     as `document.title`) and merges `<meta>`/`<link>` by their
//     attributes. Next dedupes by an explicit `key` prop. The
//     observable output is equivalent for the consumer set we have.
//   - Non-metadata children: React 19 only hoists the metadata tags
//     listed above. If a consumer ever renders an arbitrary element
//     inside `<Head>`, it'll render in place rather than in `<head>`.
//     We have no such consumers today; if one shows up, swap to a
//     portal+SSR-collector setup.

// eslint-disable-next-line no-restricted-exports
export default function Head({ children }: { children?: ReactNode }) {
  return <>{children}</>
}
