// The path-to-regexp build that Next.js compiles route sources with
declare module 'next/dist/compiled/path-to-regexp' {
  type Options = { strict?: boolean; sensitive?: boolean; delimiter?: string }

  export type Key = {
    name: string | number
    prefix: string
    suffix: string
    pattern: string
    modifier: string
  }

  export function parse(path: string, options?: Options): (string | Key)[]

  export function pathToRegexp(path: string, keys?: unknown[], options?: Options): RegExp
}
