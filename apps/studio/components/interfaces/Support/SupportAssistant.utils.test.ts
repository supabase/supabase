import { SupportCategories } from '@supabase/shared-types/out/constants'
import { describe, expect, it } from 'vitest'

import {
  buildSupportAssistantPrompt,
  decodeAssistantHandoff,
  encodeAssistantHandoff,
  parseSupportAssistantPrompt,
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

  it('round-trips a request through encode/decode, simulating how router.query delivers it', () => {
    const encoded = encodeAssistantHandoff(supportRequest)
    // router.query values are already percent-decoded by Next.js — mirror that here
    // instead of feeding the raw encoded string straight to decodeAssistantHandoff.
    const asRouterQueryWouldDeliverIt = decodeURIComponent(encoded)

    expect(decodeAssistantHandoff(asRouterQueryWouldDeliverIt)).toEqual(supportRequest)
  })

  it('does not mangle literal percent characters in the message', () => {
    const request = { ...supportRequest, message: '100% CPU, literal %20 text' }
    const encoded = encodeAssistantHandoff(request)
    const asRouterQueryWouldDeliverIt = decodeURIComponent(encoded)

    expect(decodeAssistantHandoff(asRouterQueryWouldDeliverIt)?.message).toBe(
      '100% CPU, literal %20 text'
    )
  })

  it('returns null for malformed JSON', () => {
    expect(decodeAssistantHandoff('{not valid json')).toBeNull()
  })

  it('returns null for validly-shaped JSON that does not match the expected schema', () => {
    expect(decodeAssistantHandoff(JSON.stringify({ foo: 'bar' }))).toBeNull()
    expect(
      decodeAssistantHandoff(JSON.stringify({ ...supportRequest, allowSupportAccess: 'yes' }))
    ).toBeNull()
  })
})
