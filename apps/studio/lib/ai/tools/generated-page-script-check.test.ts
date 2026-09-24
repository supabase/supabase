import { describe, expect, it } from 'vitest'

import { findGeneratedPageScriptSyntaxErrors } from './generated-page-script-check'

describe('findGeneratedPageScriptSyntaxErrors', () => {
  it('accepts valid inline scripts', () => {
    expect(
      findGeneratedPageScriptSyntaxErrors(
        '<p>Hi</p><script>window.studio.onReady(async () => { await Promise.resolve() })</script>'
      )
    ).toEqual([])
  })

  it('reports a syntax error with the script number and line', () => {
    const [error] = findGeneratedPageScriptSyntaxErrors(
      '<script>const a = 1</script><script type="text/javascript">\nconst b = 1\nfoo(b, (c => c)\n</script>'
    )

    expect(error).toContain('#2')
    expect(error).toContain('line 3')
    expect(error).toContain('missing ) after argument list')
  })

  it('rejects top-level await, which classic scripts do not allow', () => {
    expect(findGeneratedPageScriptSyntaxErrors('<script>await fetchRows()</script>')).toHaveLength(
      1
    )
  })

  it('skips external, module, and data scripts', () => {
    expect(
      findGeneratedPageScriptSyntaxErrors(
        [
          '<script src="x.js">not js</script>',
          '<script type="module">await import("x")</script>',
          '<script type="application/json">{"a": </script>',
        ].join('')
      )
    ).toEqual([])
  })

  it('does not run the script it compiles', () => {
    ;(globalThis as { ran?: boolean }).ran = false
    findGeneratedPageScriptSyntaxErrors('<script>globalThis.ran = true</script>')
    expect((globalThis as { ran?: boolean }).ran).toBe(false)
  })
})
