import { describe, expect, it } from 'vitest'

import { buildOAuthCodeHtml } from './oauth-callback-page'

describe('OAuth browser completion page', () => {
  it('returns code and state only to the initiating Studio origin without completing authorization', () => {
    const html = buildOAuthCodeHtml({
      code: 'code',
      state: 'state',
      returnTo: 'https://studio.example/project/ref',
    })
    expect(html).toContain('assistant-oauth-code')
    expect(html).toContain('"https://studio.example"')
    expect(html).not.toContain('assistant-oauth-complete')
    expect(html).not.toContain('window.close()')
    expect(html).not.toContain('"*"')
  })
  it('escapes script-breaking input', () => {
    const html = buildOAuthCodeHtml({
      code: '</script><script>alert(1)</script>',
      state: '<state>',
      returnTo: 'https://studio.example/',
    })
    expect(html).not.toContain('<script>alert')
    expect(html).toContain('\\u003c/script>')
  })
})
