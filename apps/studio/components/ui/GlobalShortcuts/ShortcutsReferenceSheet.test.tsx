import type { HotkeyRegistrationView, SequenceRegistrationView } from '@tanstack/react-hotkeys'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ShortcutsReferenceSheet } from './ShortcutsReferenceSheet'
import { SHORTCUT_DEFINITIONS, SHORTCUT_IDS, type ShortcutId } from '@/state/shortcuts/registry'
import type { ShortcutHotkeyMeta } from '@/state/shortcuts/useShortcut'
import { customRender } from '@/tests/lib/custom-render'

const { mockUseHotkeyRegistrations } = vi.hoisted(() => ({
  mockUseHotkeyRegistrations:
    vi.fn<() => { hotkeys: HotkeyRegistrationView[]; sequences: SequenceRegistrationView[] }>(),
}))

vi.mock('@tanstack/react-hotkeys', async () => {
  const actual =
    await vi.importActual<typeof import('@tanstack/react-hotkeys')>('@tanstack/react-hotkeys')
  return {
    ...actual,
    useHotkeyRegistrations: mockUseHotkeyRegistrations,
  }
})

const ACTIVE_SHORTCUT_IDS = [
  SHORTCUT_IDS.COMMAND_MENU_OPEN,
  SHORTCUT_IDS.NAV_HOME,
] satisfies ShortcutId[]

const ACTIVE_DATABASE_SHORTCUT_IDS = [
  ...ACTIVE_SHORTCUT_IDS,
  SHORTCUT_IDS.NAV_DATABASE_TABLES,
] satisfies ShortcutId[]

const ACTIVE_AUTH_SHORTCUT_IDS = [
  ...ACTIVE_SHORTCUT_IDS,
  SHORTCUT_IDS.NAV_AUTH_USERS,
] satisfies ShortcutId[]

let sequenceIdCounter = 0

const buildSequenceRegistration = (id: ShortcutId): SequenceRegistrationView => {
  const definition = SHORTCUT_DEFINITIONS[id]
  const meta: ShortcutHotkeyMeta = {
    id: definition.id,
    name: definition.label,
    referenceGroup: definition.referenceGroup,
  }

  return {
    id: `sequence_${++sequenceIdCounter}`,
    sequence: definition.sequence,
    options: {
      enabled: true,
      meta,
    },
    target: document,
    triggerCount: 0,
    hasFired: false,
    matchedStepCount: 0,
    partialMatchLastKeyTime: 0,
  }
}

const seedRegistrations = (ids: ShortcutId[]) => {
  mockUseHotkeyRegistrations.mockReturnValue({
    hotkeys: [],
    sequences: ids.map(buildSequenceRegistration),
  })
}

const renderShortcutsReferenceSheet = (ids: ShortcutId[] = ACTIVE_SHORTCUT_IDS) => {
  seedRegistrations(ids)
  const onOpenChange = vi.fn()

  customRender(<ShortcutsReferenceSheet open onOpenChange={onOpenChange} />)

  return { onOpenChange }
}

describe('ShortcutsReferenceSheet', () => {
  beforeEach(() => {
    sequenceIdCounter = 0
    mockUseHotkeyRegistrations.mockReset()
    mockUseHotkeyRegistrations.mockReturnValue({ hotkeys: [], sequences: [] })
  })

  it('renders the grouped shortcut list by default', async () => {
    renderShortcutsReferenceSheet()

    expect(await screen.findByText('Keyboard shortcuts')).toBeInTheDocument()
    expect(screen.getByLabelText('Search shortcuts')).toBeInTheDocument()
    expect(screen.getByText('Command Menu')).toBeInTheDocument()
    expect(screen.getByText('Navigation')).toBeInTheDocument()
    expect(screen.queryByText('Global Navigation')).not.toBeInTheDocument()
    expect(screen.queryByText('Database Navigation')).not.toBeInTheDocument()
    expect(screen.getByText('Open command menu')).toBeInTheDocument()
    expect(screen.getByText('Go to Project Overview')).toBeInTheDocument()
  })

  it('shows only active shortcuts in a group when the group label matches the search', async () => {
    const user = userEvent.setup()

    renderShortcutsReferenceSheet()

    await user.type(screen.getByLabelText('Search shortcuts'), 'navigation')

    expect(screen.getByText('Navigation')).toBeInTheDocument()
    expect(screen.getByText('Go to Project Overview')).toBeInTheDocument()
    expect(screen.queryByText('Command Menu')).not.toBeInTheDocument()
    expect(screen.queryByText('Go to Database')).not.toBeInTheDocument()
  })

  it('keeps the parent group header when only an item label matches', async () => {
    const user = userEvent.setup()

    renderShortcutsReferenceSheet()

    await user.type(screen.getByLabelText('Search shortcuts'), 'Go to Project Overview')

    expect(screen.getByText('Navigation')).toBeInTheDocument()
    expect(screen.getByText('Go to Project Overview')).toBeInTheDocument()
    expect(screen.queryByText('Open command menu')).not.toBeInTheDocument()
    expect(screen.queryByText('Command Menu')).not.toBeInTheDocument()
  })

  it('shows the database navigation section when database shortcuts are active', async () => {
    renderShortcutsReferenceSheet(ACTIVE_DATABASE_SHORTCUT_IDS)

    expect(await screen.findByText('Global Navigation')).toBeInTheDocument()
    expect(screen.getByText('Database Navigation')).toBeInTheDocument()
    expect(screen.queryByText(/^Navigation$/)).not.toBeInTheDocument()
    expect(screen.getByText('Go to Tables')).toBeInTheDocument()
  })

  it('shows the auth navigation section when auth shortcuts are active', async () => {
    renderShortcutsReferenceSheet(ACTIVE_AUTH_SHORTCUT_IDS)

    expect(await screen.findByText('Global Navigation')).toBeInTheDocument()
    expect(screen.getByText('Auth Navigation')).toBeInTheDocument()
    expect(screen.queryByText(/^Navigation$/)).not.toBeInTheDocument()
    expect(screen.getByText('Go to Users')).toBeInTheDocument()
  })

  it('does not show inactive database shortcuts in search results', async () => {
    const user = userEvent.setup()

    renderShortcutsReferenceSheet()

    await user.type(screen.getByLabelText('Search shortcuts'), 'Go to Tables')

    expect(screen.getByText('No matching shortcuts found')).toBeInTheDocument()
    expect(screen.queryByText('Database Navigation')).not.toBeInTheDocument()
  })

  it('hides shortcuts whose registration is soft-disabled', async () => {
    sequenceIdCounter = 0
    const enabled = buildSequenceRegistration(SHORTCUT_IDS.COMMAND_MENU_OPEN)
    const disabled = buildSequenceRegistration(SHORTCUT_IDS.NAV_HOME)
    disabled.options = { ...disabled.options, enabled: false }
    mockUseHotkeyRegistrations.mockReturnValue({
      hotkeys: [],
      sequences: [enabled, disabled],
    })

    customRender(<ShortcutsReferenceSheet open onOpenChange={vi.fn()} />)

    expect(await screen.findByText('Open command menu')).toBeInTheDocument()
    expect(screen.queryByText('Go to Project Overview')).not.toBeInTheDocument()
  })

  it('shows a clear button when searching and resets the list when clicked', async () => {
    const user = userEvent.setup()

    renderShortcutsReferenceSheet()

    await user.type(screen.getByLabelText('Search shortcuts'), 'navigation')

    expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear search' }))

    expect(screen.getByLabelText('Search shortcuts')).toHaveValue('')
    expect(screen.getByText('Command Menu')).toBeInTheDocument()
    expect(screen.getByText('Navigation')).toBeInTheDocument()
  })

  it.each(['⌘Esc', 'Mod+/'])('does not search shortcut values like %s', async (query) => {
    const user = userEvent.setup()

    renderShortcutsReferenceSheet()

    await user.type(screen.getByLabelText('Search shortcuts'), query)

    expect(screen.getByText('No matching shortcuts found')).toBeInTheDocument()
    expect(screen.queryByText('Navigation')).not.toBeInTheDocument()
  })

  it('shows an empty state when nothing matches', async () => {
    const user = userEvent.setup()

    renderShortcutsReferenceSheet()

    await user.type(screen.getByLabelText('Search shortcuts'), 'totally missing')

    expect(screen.getByText('No matching shortcuts found')).toBeInTheDocument()
  })
})
