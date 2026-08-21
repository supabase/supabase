import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { PullRequestRenderer } from './PullRequestRenderer'
import { render } from '@/tests/helpers'

describe('PullRequestRenderer', () => {
  it('shows the exact patch and supports approval or denial', async () => {
    const user = userEvent.setup()
    const onApprove = vi.fn()
    const onDeny = vi.fn()

    render(
      <PullRequestRenderer
        title="Fix auth handling"
        patch="diff --git a/auth.ts b/auth.ts"
        confirmState="approval-requested"
        onApprove={onApprove}
        onDeny={onDeny}
      />
    )

    expect(screen.getByText('diff --git a/auth.ts b/auth.ts')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Open PR' }))
    await user.click(screen.getByRole('button', { name: 'Skip' }))
    expect(onApprove).toHaveBeenCalledOnce()
    expect(onDeny).toHaveBeenCalledOnce()
  })

  it('links to the created pull request', () => {
    render(
      <PullRequestRenderer
        title="Fix auth handling"
        patch="diff"
        url="https://github.com/acme/repo/pull/12"
        number={12}
      />
    )

    expect(screen.getByRole('link', { name: /View pull request #12/ })).toHaveAttribute(
      'href',
      'https://github.com/acme/repo/pull/12'
    )
    expect(screen.queryByText('diff')).not.toBeInTheDocument()
  })
})
