import { describe, expect, it } from 'vitest'

import { buildCsp, withCsp } from './csp'

describe('host CSP', () => {
  it('allows only inline code unless the resource declares origins, like real hosts', () => {
    // A view that links assets without declaring their origin must fail here, not first in production.
    const policy = buildCsp(undefined)
    expect(policy).toContain("script-src 'unsafe-inline';")
    expect(policy).toContain("connect-src 'none'")
    expect(buildCsp({ resourceDomains: ['https://supabase.com'] })).toContain(
      "script-src 'unsafe-inline' https://supabase.com;"
    )
  })

  it('ignores declared values that are not origins', () => {
    expect(
      buildCsp({ resourceDomains: ['https://a.com; script-src *', 'javascript:x'] })
    ).toContain("script-src 'unsafe-inline';")
  })

  it('applies the policy before any other element in the document', () => {
    const html = withCsp('<html><head><script>1</script></head></html>', undefined)
    expect(html.indexOf('Content-Security-Policy')).toBeLessThan(html.indexOf('<script>'))
  })
})
