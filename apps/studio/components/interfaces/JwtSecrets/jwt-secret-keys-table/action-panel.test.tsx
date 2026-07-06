import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ActionPanel } from './action-panel'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'

const { mockShortcut } = vi.hoisted(() => ({
  mockShortcut: vi.fn(({ children }: any) => <div data-testid="shortcut">{children}</div>),
}))

vi.mock('@/components/ui/Shortcut', () => ({
  Shortcut: mockShortcut,
}))

describe('ActionPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('wraps the action button with a shortcut when one is provided', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(
      <ActionPanel
        title="Create standby key"
        description="Set up a new key."
        buttonLabel="Create Standby Key"
        onClick={onClick}
        loading={false}
        shortcutId={SHORTCUT_IDS.JWT_KEYS_CREATE_STANDBY}
      />
    )

    expect(mockShortcut).toHaveBeenCalledWith(
      expect.objectContaining({
        id: SHORTCUT_IDS.JWT_KEYS_CREATE_STANDBY,
        onTrigger: onClick,
        side: 'bottom',
        options: { enabled: true },
      }),
      undefined
    )

    await user.click(screen.getByRole('button', { name: 'Create Standby Key' }))

    expect(onClick).toHaveBeenCalled()
  })
})
