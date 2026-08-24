import { SupportCategories } from '@supabase/shared-types/out/constants'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  buildSupportAssistantPrompt,
  consumeAssistantHandoff,
  parseSupportAssistantPrompt,
  storeAssistantHandoff,
} from './SupportAssistant.utils'
import type { SubmittedSupportRequest } from './SupportForm.state'

const supportRequest: SubmittedSupportRequest = {
  organizationSlug: 'org-1',
  projectRef: 'project-1',
  category: SupportCategories.PROBLEM,
  severity: 'Normal',
  subject: 'API requests fail',
  message: 'Requests fail with <500> & timeouts',
  affectedServices: 'api;database',
  library: 'javascript',
  allowSupportAccess: true,
  dashboardLogs: 'https://example.com/logs',
}

describe('SupportAssistant utils', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('formats support requests as tagged assistant prompts', () => {
    const prompt = buildSupportAssistantPrompt(supportRequest)

    expect(prompt).toContain('<support>')
    expect(prompt).toContain('<assistant_context>')
    expect(prompt).toContain('a human member of the Supabase Support team is already looking at it')
    expect(prompt).toContain('<subject>API requests fail</subject>')
    expect(prompt).not.toContain('<organization_slug>')
    expect(prompt).not.toContain('<project_ref>')
  })

  it('parses and unescapes tagged assistant prompts', () => {
    const parsed = parseSupportAssistantPrompt(buildSupportAssistantPrompt(supportRequest))

    expect(parsed).toMatchObject({
      category: 'Problem',
      severity: 'Normal',
      subject: 'API requests fail',
      message: 'Requests fail with <500> & timeouts',
      support_access: 'Granted',
      dashboard_logs: 'Attached',
    })
  })

  it('falls back when optional support request fields are missing', () => {
    const parsed = parseSupportAssistantPrompt(
      buildSupportAssistantPrompt({
        ...supportRequest,
        organizationSlug: undefined,
        projectRef: undefined,
        library: undefined,
        dashboardLogs: undefined,
        allowSupportAccess: false,
      })
    )

    expect(parsed).toMatchObject({
      library: 'Not provided',
      support_access: 'Not granted',
      dashboard_logs: 'Not attached',
    })
  })

  it('returns null for text without a valid support payload', () => {
    expect(parseSupportAssistantPrompt('Help me debug this issue')).toBeNull()
    expect(parseSupportAssistantPrompt('<support></support>')).toBeNull()
  })

  it('round-trips a request through store/consume', () => {
    storeAssistantHandoff('token-1', supportRequest)

    expect(consumeAssistantHandoff('token-1')).toEqual(supportRequest)
  })

  it('preserves literal percent characters in the message (no URL encoding involved)', () => {
    const request = { ...supportRequest, message: '100% CPU, literal %20 text' }
    storeAssistantHandoff('token-1', request)

    expect(consumeAssistantHandoff('token-1')?.message).toBe('100% CPU, literal %20 text')
  })

  it('removes the entry after consuming it, so it cannot be replayed', () => {
    storeAssistantHandoff('token-1', supportRequest)

    expect(consumeAssistantHandoff('token-1')).toEqual(supportRequest)
    expect(consumeAssistantHandoff('token-1')).toBeNull()
  })

  it('returns null for a token that was never stored', () => {
    expect(consumeAssistantHandoff('unknown-token')).toBeNull()
  })

  it('returns null for malformed JSON', () => {
    sessionStorage.setItem('assistant-handoff:token-1', '{not valid json')

    expect(consumeAssistantHandoff('token-1')).toBeNull()
  })

  it('returns null for validly-shaped JSON that does not match the expected schema', () => {
    sessionStorage.setItem('assistant-handoff:token-1', JSON.stringify({ foo: 'bar' }))
    expect(consumeAssistantHandoff('token-1')).toBeNull()

    sessionStorage.setItem(
      'assistant-handoff:token-2',
      JSON.stringify({ ...supportRequest, allowSupportAccess: 'yes' })
    )
    expect(consumeAssistantHandoff('token-2')).toBeNull()
  })
})
