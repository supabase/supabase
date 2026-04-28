import { SupportCategories } from '@supabase/shared-types/out/constants'
import { describe, expect, it } from 'vitest'

import { buildSupportAssistantPrompt, parseSupportAssistantPrompt } from './SupportAssistant.utils'
import type { SubmittedSupportRequest } from './SupportForm.state'
import { NO_ORG_MARKER, NO_PROJECT_MARKER } from './SupportForm.utils'

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
    expect(prompt).toContain(
      'A support request has already been submitted to the Supabase Support team'
    )
    expect(prompt).toContain('<subject>API requests fail</subject>')
  })

  it('parses and unescapes tagged assistant prompts', () => {
    const parsed = parseSupportAssistantPrompt(buildSupportAssistantPrompt(supportRequest))

    expect(parsed).toMatchObject({
      organization_slug: 'org-1',
      project_ref: 'project-1',
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
        organizationSlug: NO_ORG_MARKER,
        projectRef: NO_PROJECT_MARKER,
        library: undefined,
        dashboardLogs: undefined,
        allowSupportAccess: false,
      })
    )

    expect(parsed).toMatchObject({
      organization_slug: 'No organization selected',
      project_ref: 'No specific project selected',
      library: 'Not provided',
      support_access: 'Not granted',
      dashboard_logs: 'Not attached',
    })
  })

  it('returns null for text without a valid support payload', () => {
    expect(parseSupportAssistantPrompt('Help me debug this issue')).toBeNull()
    expect(parseSupportAssistantPrompt('<support></support>')).toBeNull()
  })
})
