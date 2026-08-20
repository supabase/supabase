import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import { VercelConnectionError } from '@/pages/integrations/vercel/[slug]/deploy-button/new-project'
import { customRender } from '@/tests/lib/custom-render'

test('shows a recoverable partial-success state without recreating the project', async () => {
  const user = userEvent.setup()
  const retry = vi.fn()

  customRender(
    <VercelConnectionError
      projectRef="project-ref"
      message="Connection request failed"
      onRetry={retry}
    />
  )

  const alert = screen.getByRole('alert')
  expect(alert).toHaveTextContent('Unable to connect to Vercel')
  expect(alert).toHaveTextContent(
    'Your Supabase project was still created. Error: Connection request failed'
  )
  expect(screen.getByRole('link', { name: 'Open project' })).toHaveAttribute(
    'href',
    '/project/project-ref'
  )

  await user.click(screen.getByRole('button', { name: 'Retry connection' }))
  expect(retry).toHaveBeenCalledOnce()
})
