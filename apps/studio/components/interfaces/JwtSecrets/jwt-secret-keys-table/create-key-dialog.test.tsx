import { screen } from '@testing-library/react'
import { Dialog, DialogContent } from 'ui'
import { describe, expect, it, vi } from 'vitest'

import { CreateKeyDialog } from './create-key-dialog'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { customRender as render } from '@/tests/lib/custom-render'
import { mockProjectGrantContext } from '@/tests/lib/project-grant-mocks'

const { mockShortcut } = vi.hoisted(() => ({
  mockShortcut: vi.fn(({ children }: any) => <div data-testid="shortcut">{children}</div>),
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

describe('CreateKeyDialog', () => {
  it('wraps the create standby key button with the submit shortcut', async () => {
    mockProjectGrantContext({ ref: 'project-ref' })

    render(
      <Dialog open>
        <DialogContent>
          <CreateKeyDialog projectRef="project-ref" onClose={vi.fn()} />
        </DialogContent>
      </Dialog>
    )

    await screen.findByRole('button', { name: 'Create standby key' })

    expect(mockShortcut).toHaveBeenCalledWith(
      expect.objectContaining({
        id: SHORTCUT_IDS.JWT_KEYS_SUBMIT_STANDBY,
        onTrigger: expect.any(Function),
        options: { enabled: true },
      }),
      undefined
    )
    expect(screen.getByRole('button', { name: 'Create standby key' })).toBeInTheDocument()
  })
})
