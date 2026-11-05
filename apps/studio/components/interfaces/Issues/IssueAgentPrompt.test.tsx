import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { IssueAgentPrompt } from './IssueAgentPrompt'
import { customRender } from '@/tests/lib/custom-render'

describe('IssueAgentPrompt', () => {
  afterEach(() => vi.restoreAllMocks())

  it('copies every step for this project, even while the steps are collapsed, so the agent gets the whole brief', async () => {
    const user = userEvent.setup()
    vi.spyOn(document, 'hasFocus').mockReturnValue(true)
    customRender(<IssueAgentPrompt projectRef="project-to-review" />)

    expect(screen.getByRole('button', { name: 'Show more' })).toHaveAttribute(
      'aria-expanded',
      'false'
    )

    await user.click(screen.getByRole('button', { name: 'Copy Agent prompt' }))

    await waitFor(async () => {
      const copiedPrompt = await navigator.clipboard.readText()
      expect(copiedPrompt).toContain('my project "project-to-review"')
      expect(copiedPrompt).toContain('security, performance and health')
      expect(copiedPrompt).toContain('5. If the MCP server does not expose')
    })
  })
})
