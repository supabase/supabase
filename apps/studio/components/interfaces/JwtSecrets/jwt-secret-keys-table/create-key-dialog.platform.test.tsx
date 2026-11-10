import { screen, waitFor } from '@testing-library/react'
import { toast } from 'sonner'
import { Dialog, DialogContent } from 'ui'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CreateKeyDialog } from './create-key-dialog'
import { customRender as render } from '@/tests/lib/custom-render'
import { NO_PERMISSIONS } from '@/tests/lib/permissions-fixtures'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'
import { mockProjectGrantContext } from '@/tests/lib/project-grant-mocks'

const { mockShortcut } = vi.hoisted(() => ({
  mockShortcut: vi.fn(({ children }: any) => <div>{children}</div>),
}))

vi.mock('@/components/ui/Shortcut', () => ({
  Shortcut: mockShortcut,
}))

vi.mock('common', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('common')
  return { ...actual, useIsLoggedIn: () => true, useParams: () => ({ ref: 'project-ref' }) }
})

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

describe('CreateKeyDialog without a create grant', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('explains why nothing happened when the action is triggered anyway', async () => {
    mockProjectGrantContext({ ref: 'project-ref', permissions: NO_PERMISSIONS })

    render(
      <Dialog open>
        <DialogContent>
          <CreateKeyDialog projectRef="project-ref" onClose={vi.fn()} />
        </DialogContent>
      </Dialog>,
      { profileContext: createMockProfileContext() }
    )

    await screen.findByRole('button', { name: 'Create standby key' })

    // Simulate the keyboard shortcut firing despite the button being disabled. Retry until the
    // permissions check resolves to denied; before that, the message says it is still checking.
    // No API mock is registered for creating a key, so any request would fail the test.
    await waitFor(
      () => {
        vi.mocked(toast.error).mockClear()
        mockShortcut.mock.calls.at(-1)?.[0].onTrigger()
        expect(toast.error).toHaveBeenCalledExactlyOnceWith(
          'You need additional permissions to create signing keys'
        )
      },
      { timeout: 4000 }
    )
  })
})
