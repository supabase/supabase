import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { IssueAgentPrompt } from './IssueAgentPrompt'
import { customRender } from '@/tests/lib/custom-render'

describe('IssueAgentPrompt', () => {
  afterEach(() => vi.restoreAllMocks())

  it('copies the full prompt for the current project while the steps are collapsed', async () => {
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
      expect(copiedPrompt).toContain('1. If the Supabase plugin is not installed or connected')
      expect(copiedPrompt).toContain('2. Retrieve the project’s open issues.')
      expect(copiedPrompt).toContain('Resolve only issues confirmed fixed.')
      expect(copiedPrompt).toContain('5. If the MCP server does not expose issue tools')
    })
  })
})
