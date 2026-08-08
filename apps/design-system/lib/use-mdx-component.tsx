import * as React from 'react'
import * as runtime from 'react/jsx-runtime'

// Velite compiles MDX to a "function-body" (see velite.config.js `code: s.mdx()`)
// that reads its jsx runtime off `arguments[0]` — mirrors the pattern from
// https://velite.js.org/guide/using-mdx.
function getMDXComponent(code: string, globals: Record<string, unknown> = {}) {
  const fn = new Function(code)
  return fn({ ...runtime, ...globals }).default
}

export function useMDXComponent(code: string, globals: Record<string, unknown> = {}) {
  return React.useMemo(() => getMDXComponent(code, globals), [code, globals])
}
