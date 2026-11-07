import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dialog, DialogContent } from 'ui'
import { describe, expect, it, vi } from 'vitest'

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

const renderDialog = () =>
  render(
    <Dialog open>
      <DialogContent>
        <CreateKeyDialog projectRef="project-ref" onClose={vi.fn()} />
      </DialogContent>
    </Dialog>
  )

describe('CreateKeyDialog', () => {
  it('defaults to Ed25519 without a performance warning', () => {
    renderDialog()

    expect(screen.getByRole('combobox')).toHaveTextContent('Ed25519 (EdDSA)')
    expect(screen.queryByText('ES256 can slow down Data API requests')).not.toBeInTheDocument()
  })

  it('warns about Data API performance when ES256 is selected', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByRole('combobox'))
    await user.click(await screen.findByRole('option', { name: 'ES256 (ECC)' }))

    expect(screen.getByText('ES256 can slow down Data API requests')).toBeInTheDocument()
  })

  it('wraps the create standby key button with the submit shortcut', () => {
    renderDialog()

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
