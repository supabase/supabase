import { describe, expect, it } from 'vitest'

import { USER_JWT_PLACEHOLDER } from '../Functions.utils'
import { INVOCATION_TABS } from './EdgeFunctionDetails.constants'

const curlTab = INVOCATION_TABS.find((tab) => tab.id === 'curl')!

const baseProps = {
  showKey: true,
  functionUrl: 'https://project-ref.supabase.co/functions/v1/health',
  functionName: 'health',
}

describe('cURL invocation snippet', () => {
  it('sends a publishable key on the apikey header, not Authorization, when verify_jwt is off', () => {
    const code = curlTab.code({ ...baseProps, apiKey: 'sb_publishable_abc123', verifyJwt: false })

    expect(code).toContain("-H 'apikey: sb_publishable_abc123'")
    expect(code).not.toContain('Authorization')
  })

  it('adds an Authorization header with a user JWT placeholder when verify_jwt is on', () => {
    const code = curlTab.code({ ...baseProps, apiKey: 'sb_publishable_abc123', verifyJwt: true })

    expect(code).toContain("-H 'apikey: sb_publishable_abc123'")
    expect(code).toContain(`-H 'Authorization: Bearer ${USER_JWT_PLACEHOLDER}'`)
  })

  it('uses the anon key on the Authorization header when useAnonJwt is enabled', () => {
    const anonJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.anon'
    const code = curlTab.code({
      ...baseProps,
      apiKey: 'sb_publishable_abc123',
      verifyJwt: true,
      anonKey: anonJwt,
      useAnonJwt: true,
    })

    expect(code).toContain("-H 'apikey: sb_publishable_abc123'")
    expect(code).toContain(`-H 'Authorization: Bearer ${anonJwt}'`)
    expect(code).not.toContain(USER_JWT_PLACEHOLDER)
  })

  it('sends a legacy anon key on a single Authorization header', () => {
    const anonJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.anon'
    const code = curlTab.code({ ...baseProps, apiKey: anonJwt, verifyJwt: true })

    expect(code).toContain(`-H 'Authorization: Bearer ${anonJwt}'`)
    expect(code).not.toContain('apikey:')
  })

  it('obfuscates key values when showKey is false', () => {
    const publishable = curlTab.code({
      ...baseProps,
      showKey: false,
      apiKey: 'sb_publishable_abc123',
      verifyJwt: true,
      anonKey: 'eyJ.anon',
      useAnonJwt: true,
    })
    expect(publishable).toContain("-H 'apikey: SUPABASE_PUBLISHABLE_KEY'")
    expect(publishable).toContain("-H 'Authorization: Bearer SUPABASE_ANON_KEY'")

    const anon = curlTab.code({ ...baseProps, showKey: false, apiKey: 'eyJ.anon' })
    expect(anon).toContain("-H 'Authorization: Bearer SUPABASE_ANON_KEY'")
  })
})
