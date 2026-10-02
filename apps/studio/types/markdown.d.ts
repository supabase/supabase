/* eslint-disable no-restricted-exports -- ambient module shape requires a default export */
// `.md` files import as their raw text content:
//   - Next/turbopack: raw-loader rule in next.config.ts
//   - Vite/TanStack: mdRawLoader plugin in vite.config.ts
declare module '*.md' {
  const content: string
  export default content
}
