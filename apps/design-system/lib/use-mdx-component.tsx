import * as React from 'react'
import * as runtime from 'react/jsx-runtime'

// Velite compiles MDX to a "function-body" (see velite.config.js `code: s.mdx()`)
// that reads its jsx runtime off `arguments[0]` — mirrors the pattern from
// https://velite.js.org/guide/using-mdx.
const EMPTY_GLOBALS: Record<string, unknown> = {}

function getMDXComponent(code: string, globals: Record<string, unknown> = EMPTY_GLOBALS) {
  const fn = new Function(code)
  return fn({ ...runtime, ...globals }).default
}

export function useMDXComponent(code: string, globals: Record<string, unknown> = EMPTY_GLOBALS) {
  return React.useMemo(() => getMDXComponent(code, globals), [code, globals])
}
