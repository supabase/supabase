import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { platformComponents } from 'api-types'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { IssueAgentPrompt } from './IssueAgentPrompt'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

describe('IssueAgentPrompt', () => {
  afterEach(() => vi.restoreAllMocks())

  it('copies every step for this project, even while the steps are collapsed, so the agent gets the whole brief', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: {
        cloud_provider: 'AWS',
        connectionString: '',
        db_host: 'db.default.supabase.co',
        high_availability: false,
        id: 1,
        inserted_at: '2026-01-01T00:00:00Z',
        integration_source: null,
        is_branch_enabled: false,
        is_physical_backups_enabled: false,
        name: 'Project to review',
        organization_id: 1,
        ref: 'default',
        region: 'us-east-1',
        restUrl: 'https://default.supabase.co/rest/v1/',
        status: 'ACTIVE_HEALTHY',
        subscription_id: 'subscription-1',
        updated_at: '2026-01-01T00:00:00Z',
      } satisfies platformComponents['schemas']['ProjectDetailResponse_Output'],
    })
    const user = userEvent.setup()
    vi.spyOn(document, 'hasFocus').mockReturnValue(true)
    customRender(<IssueAgentPrompt projectRef="project-to-review" />)

    expect(screen.getByRole('button', { name: 'Show more' })).toHaveAttribute(
      'aria-expanded',
      'false'
    )

    await user.click(screen.getByRole('button', { name: 'Copy Prompt to fix issues' }))

    await waitFor(async () => {
      const copiedPrompt = await navigator.clipboard.readText()
      expect(copiedPrompt).toContain('my project "project-to-review"')
      expect(copiedPrompt).toContain('security, performance and health')
      expect(copiedPrompt).toContain('5. If the MCP server does not expose')
    })
  })
})
