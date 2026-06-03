import { describe, expect, it } from 'vitest'

import { INVOCATION_TABS } from './EdgeFunctionDetails.constants'

const curlTab = INVOCATION_TABS.find((tab) => tab.id === 'curl')!

const baseProps = {
  showKey: true,
  functionUrl: 'https://project-ref.supabase.co/functions/v1/health',
  functionName: 'health',
}

describe('cURL invocation snippet', () => {
  it('sends a publishable key on the apikey header, not Authorization', () => {
    const code = curlTab.code({ ...baseProps, apiKey: 'sb_publishable_abc123' })

    expect(code).toContain("-H 'apikey: sb_publishable_abc123'")
    expect(code).not.toContain('Authorization')
  })

  it('sends a legacy anon key on the Authorization header, not apikey', () => {
    const anonJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.anon'
    const code = curlTab.code({ ...baseProps, apiKey: anonJwt })

    expect(code).toContain(`-H 'Authorization: Bearer ${anonJwt}'`)
    expect(code).not.toContain('apikey:')
  })

  it('obfuscates the key name when showKey is false', () => {
    const publishable = curlTab.code({
      ...baseProps,
      showKey: false,
      apiKey: 'sb_publishable_abc123',
    })
    expect(publishable).toContain("-H 'apikey: SUPABASE_PUBLISHABLE_KEY'")

    const anon = curlTab.code({ ...baseProps, showKey: false, apiKey: 'eyJ.anon' })
    expect(anon).toContain("-H 'Authorization: Bearer SUPABASE_ANON_KEY'")
  })
})
