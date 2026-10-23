import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TooltipProvider } from 'ui'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Prompt, PromptContent, PromptCopy, PromptPanel, PromptTitle } from './PromptPanel'

describe('PromptPanel', () => {
  afterEach(() => vi.restoreAllMocks())

  it('copies the selected prompt and reports its value after a successful copy', async () => {
    const user = userEvent.setup()
    const handleCopied = vi.fn()
    vi.spyOn(document, 'hasFocus').mockReturnValue(true)

    render(
      <TooltipProvider>
        <PromptPanel onCopied={handleCopied}>
          <Prompt value="prompt" expandable>
            <PromptTitle>Agent prompt</PromptTitle>
            <PromptCopy>Full instructions for the agent</PromptCopy>
            <PromptContent>Review the project</PromptContent>
          </Prompt>
          <Prompt value="cli">
            <PromptTitle>CLI</PromptTitle>
            <PromptCopy>supabase init</PromptCopy>
            <PromptContent>Initialize the project</PromptContent>
          </Prompt>
        </PromptPanel>
      </TooltipProvider>
    )

    await user.click(screen.getByRole('button', { name: 'Copy Agent prompt' }))
    await waitFor(() => expect(handleCopied).toHaveBeenLastCalledWith('prompt'))
    expect(await navigator.clipboard.readText()).toBe('Full instructions for the agent')

    await user.click(screen.getByRole('tab', { name: 'CLI' }))
    await user.click(screen.getByRole('button', { name: 'Copy CLI' }))
    await waitFor(() => expect(handleCopied).toHaveBeenLastCalledWith('cli'))
    expect(await navigator.clipboard.readText()).toBe('supabase init')
    expect(handleCopied).toHaveBeenCalledTimes(2)
  })

  it('does not report a copy when the clipboard write fails', async () => {
    const user = userEvent.setup()
    const handleCopied = vi.fn()
    vi.spyOn(document, 'hasFocus').mockReturnValue(false)

    render(
      <TooltipProvider>
        <PromptPanel onCopied={handleCopied}>
          <Prompt>
            <PromptTitle>Agent prompt</PromptTitle>
            <PromptCopy>Review the project</PromptCopy>
            <PromptContent>Review the project</PromptContent>
          </Prompt>
        </PromptPanel>
      </TooltipProvider>
    )

    await user.click(screen.getByRole('button', { name: 'Copy Agent prompt' }))
    expect(handleCopied).not.toHaveBeenCalled()
    expect(screen.queryByText('Agent prompt copied')).not.toBeInTheDocument()
  })
})
