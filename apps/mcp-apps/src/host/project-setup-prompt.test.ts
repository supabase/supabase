import { testCapabilities } from 'surfaces/test-utils'
import { describe, expect, it } from 'vitest'

import { projectSetupPrompt, type ProjectBrief } from './project-setup-prompt'

const brief: ProjectBrief = {
  name: '  Customer "portal"  ',
  description: '  A portal for customers.\nInclude invoices and account settings.  ',
  organization: { id: 'org-id', slug: 'acme', name: 'Acme' },
  region: 'eu-west-1',
  folder: '  ./customer portal  ',
}
const context = {
  server: {
    name: 'supabase',
    version: '0.13.0',
    appLinkBase: 'codex://plugins/supabase@supabase-local/app/open_projects',
  },
  capabilities: { ...testCapabilities, readOnly: false, createProject: true },
}

describe('projectSetupPrompt', () => {
  it('passes the user’s requirements and originating connection through as data', () => {
    const sections = projectSetupPrompt(brief, context).split('\n\n')
    expect(JSON.parse(sections[2])).toEqual({
      name: 'Customer "portal"',
      description: 'A portal for customers.\nInclude invoices and account settings.',
      organization: brief.organization,
      region: brief.region,
      localFolder: './customer portal',
    })
    expect(JSON.parse(sections[4])).toEqual({
      mcpServer: {
        ...context.server,
        entrypoint: 'open_projects',
        resource: 'ui://supabase/projects-v1',
      },
      capabilities: context.capabilities,
    })
  })

  it('makes the agent link the CLI and confirm cost, since sending the brief approves nothing', () => {
    const prompt = projectSetupPrompt(brief, context)
    expect(prompt).toContain('supabase init')
    expect(prompt).toContain('supabase link --project-ref <returned-project-ref>')
    expect(prompt).toContain('submitting this brief is not acceptance of an unknown cost')
  })

  it('does not invent a folder or server when the user gave none', () => {
    const sections = projectSetupPrompt(
      { ...brief, folder: ' ' },
      { capabilities: context.capabilities }
    ).split('\n\n')
    expect(JSON.parse(sections[2]).localFolder).toBeNull()
    expect(JSON.parse(sections[4]).mcpServer).toEqual({
      name: 'supabase',
      entrypoint: 'open_projects',
      resource: 'ui://supabase/projects-v1',
    })
  })
})
