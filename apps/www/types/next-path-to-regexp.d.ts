// The path-to-regexp build that Next.js compiles route sources with. Only used in tests.
declare module 'next/dist/compiled/path-to-regexp' {
  export function pathToRegexp(
    path: string,
    keys?: unknown[],
    options?: { strict?: boolean; sensitive?: boolean; delimiter?: string }
  ): RegExp
}
