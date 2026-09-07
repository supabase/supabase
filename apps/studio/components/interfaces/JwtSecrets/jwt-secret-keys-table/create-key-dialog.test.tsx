import { render, screen } from '@testing-library/react'
import { Dialog, DialogContent } from 'ui'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CreateKeyDialog } from './create-key-dialog'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'

const { mockShortcut } = vi.hoisted(() => ({
  mockShortcut: vi.fn(({ children }: any) => <div data-testid="shortcut">{children}</div>),
}))

vi.mock('@/components/ui/Shortcut', () => ({
  Shortcut: mockShortcut,
}))

vi.mock('@/data/jwt-signing-keys/jwt-signing-key-create-mutation', () => ({
  useJWTSigningKeyCreateMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

describe('CreateKeyDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('wraps the create standby key button with the submit shortcut', () => {
    render(
      <Dialog open>
        <DialogContent>
          <CreateKeyDialog projectRef="project-ref" onClose={vi.fn()} />
        </DialogContent>
      </Dialog>
    )

    expect(mockShortcut).toHaveBeenCalledWith(
      expect.objectContaining({
        id: SHORTCUT_IDS.JWT_KEYS_SUBMIT_STANDBY,
        onTrigger: expect.any(Function),
        options: { enabled: true },
        side: 'top',
      }),
      undefined
    )
    expect(screen.getByRole('button', { name: 'Create standby key' })).toBeInTheDocument()
  })
})
