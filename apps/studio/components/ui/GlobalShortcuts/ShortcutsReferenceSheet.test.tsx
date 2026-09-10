import type { HotkeyRegistrationView, SequenceRegistrationView } from '@tanstack/react-hotkeys'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ShortcutsReferenceSheet } from './ShortcutsReferenceSheet'
import { SHORTCUT_DEFINITIONS, SHORTCUT_IDS, type ShortcutId } from '@/state/shortcuts/registry'
import type { ShortcutHotkeyMeta } from '@/state/shortcuts/types'
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

const ACTIVE_GLOBAL_ACTION_SHORTCUT_IDS = [
  ...ACTIVE_SHORTCUT_IDS,
  SHORTCUT_IDS.AI_ASSISTANT_TOGGLE,
  SHORTCUT_IDS.INLINE_EDITOR_TOGGLE,
  SHORTCUT_IDS.CONNECT_OPEN_SHEET,
] satisfies ShortcutId[]

const ACTIVE_AUTH_SHORTCUT_IDS = [
  ...ACTIVE_SHORTCUT_IDS,
  SHORTCUT_IDS.NAV_AUTH_USERS,
] satisfies ShortcutId[]

const ACTIVE_FUNCTION_DETAIL_NAV_SHORTCUT_IDS = [
  ...ACTIVE_SHORTCUT_IDS,
  SHORTCUT_IDS.NAV_FUNCTION_DETAIL_OVERVIEW,
] satisfies ShortcutId[]

const ACTIVE_REALTIME_NAV_SHORTCUT_IDS = [
  ...ACTIVE_SHORTCUT_IDS,
  SHORTCUT_IDS.NAV_REALTIME_INSPECTOR,
] satisfies ShortcutId[]

const ACTIVE_REALTIME_INSPECTOR_SHORTCUT_IDS = [
  ...ACTIVE_SHORTCUT_IDS,
  SHORTCUT_IDS.INSPECTOR_JOIN_CHANNEL,
  SHORTCUT_IDS.INSPECTOR_TOGGLE_LISTENING,
  SHORTCUT_IDS.INSPECTOR_BROADCAST,
  SHORTCUT_IDS.INSPECTOR_COPY_MESSAGE,
] satisfies ShortcutId[]

const ACTIVE_SURFACE_SHORTCUT_IDS = [
  ...ACTIVE_SHORTCUT_IDS,
  SHORTCUT_IDS.AUTH_USERS_REFRESH,
  SHORTCUT_IDS.FUNCTION_DETAIL_OPEN_TEST,
  SHORTCUT_IDS.FUNCTION_OVERVIEW_INTERVAL_15MIN,
  SHORTCUT_IDS.FUNCTIONS_LIST_REFRESH,
  SHORTCUT_IDS.LOGS_PREVIEW_REFRESH,
  SHORTCUT_IDS.SQL_EDITOR_FORMAT,
  SHORTCUT_IDS.STORAGE_BUCKETS_REFRESH,
  SHORTCUT_IDS.STORAGE_EXPLORER_REFRESH,
] satisfies ShortcutId[]

const ACTIVE_PLATFORM_WEBHOOKS_SHORTCUT_IDS = [
  ...ACTIVE_SHORTCUT_IDS,
  SHORTCUT_IDS.PLATFORM_WEBHOOKS_EDIT_ENDPOINT,
  SHORTCUT_IDS.PLATFORM_WEBHOOKS_COPY_ENDPOINT_URL,
  SHORTCUT_IDS.PLATFORM_WEBHOOKS_RETRY_DELIVERY,
  SHORTCUT_IDS.PLATFORM_WEBHOOKS_COPY_PAYLOAD,
] satisfies ShortcutId[]

const ACTIVE_PROJECT_SETTINGS_SHORTCUT_IDS = [
  ...ACTIVE_SHORTCUT_IDS,
  SHORTCUT_IDS.NAV_PROJECT_SETTINGS_GENERAL,
  SHORTCUT_IDS.API_KEYS_NEW_PUBLISHABLE,
  SHORTCUT_IDS.JWT_KEYS_CREATE_STANDBY,
  SHORTCUT_IDS.LOG_DRAINS_ADD_DESTINATION,
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

  it('shows the global actions section when global action shortcuts are active', async () => {
    renderShortcutsReferenceSheet(ACTIVE_GLOBAL_ACTION_SHORTCUT_IDS)

    expect(await screen.findByText('Global Actions')).toBeInTheDocument()
    expect(screen.getByText('Toggle AI Assistant panel')).toBeInTheDocument()
    expect(screen.getByText('Toggle inline SQL editor')).toBeInTheDocument()
    expect(screen.getByText('Open Connect sheet')).toBeInTheDocument()
    expect(screen.getByText('O')).toBeInTheDocument()
    expect(screen.getAllByText('then').length).toBeGreaterThan(0)
    expect(screen.getByText('C')).toBeInTheDocument()
    expect(screen.queryByText('AI Assistant')).not.toBeInTheDocument()
    expect(screen.queryByText('Inline Editor')).not.toBeInTheDocument()
  })

  it('shows the auth navigation section when auth shortcuts are active', async () => {
    renderShortcutsReferenceSheet(ACTIVE_AUTH_SHORTCUT_IDS)

    expect(await screen.findByText('Global Navigation')).toBeInTheDocument()
    expect(screen.getByText('Auth Navigation')).toBeInTheDocument()
    expect(screen.queryByText(/^Navigation$/)).not.toBeInTheDocument()
    expect(screen.getByText('Go to Users')).toBeInTheDocument()
  })

  it('shows the edge function tabs section when function tab shortcuts are active', async () => {
    renderShortcutsReferenceSheet(ACTIVE_FUNCTION_DETAIL_NAV_SHORTCUT_IDS)

    expect(await screen.findByText('Global Navigation')).toBeInTheDocument()
    expect(screen.getByText('Edge Function Tabs')).toBeInTheDocument()
    expect(screen.queryByText('Edge Function Page Navigation')).not.toBeInTheDocument()
    expect(screen.getByText('Go to Overview')).toBeInTheDocument()
  })

  it('shows the realtime navigation section when realtime shortcuts are active', async () => {
    renderShortcutsReferenceSheet(ACTIVE_REALTIME_NAV_SHORTCUT_IDS)

    expect(await screen.findByText('Global Navigation')).toBeInTheDocument()
    expect(screen.getByText('Realtime Navigation')).toBeInTheDocument()
    expect(screen.getByText('Go to Inspector')).toBeInTheDocument()
  })

  it('uses human labels for realtime inspector shortcut groups', async () => {
    renderShortcutsReferenceSheet(ACTIVE_REALTIME_INSPECTOR_SHORTCUT_IDS)

    expect(await screen.findByText('Realtime Inspector')).toBeInTheDocument()
    expect(screen.getByText('Join a channel')).toBeInTheDocument()
    expect(screen.getByText('Start/Stop listening')).toBeInTheDocument()
    expect(screen.getByText('Broadcast a message')).toBeInTheDocument()
    expect(screen.getByText('Copy selected message')).toBeInTheDocument()
    expect(screen.queryByText('realtime-inspector')).not.toBeInTheDocument()
  })

  it('uses human labels for active surface shortcut groups', async () => {
    renderShortcutsReferenceSheet(ACTIVE_SURFACE_SHORTCUT_IDS)

    expect(await screen.findByText('Auth Users')).toBeInTheDocument()
    expect(screen.getByText('Edge Function Actions')).toBeInTheDocument()
    expect(screen.getByText('Edge Function Overview')).toBeInTheDocument()
    expect(screen.getByText('Edge Functions')).toBeInTheDocument()
    expect(screen.getByText('Logs Explorer')).toBeInTheDocument()
    expect(screen.getByText('SQL Editor')).toBeInTheDocument()
    expect(screen.getByText('Storage Buckets')).toBeInTheDocument()
    expect(screen.getByText('Storage File Explorer')).toBeInTheDocument()
    expect(screen.queryByText('auth-users')).not.toBeInTheDocument()
    expect(screen.queryByText('functions-detail')).not.toBeInTheDocument()
    expect(screen.queryByText('functions-list')).not.toBeInTheDocument()
    expect(screen.queryByText('functions-overview')).not.toBeInTheDocument()
    expect(screen.queryByText('logs-preview')).not.toBeInTheDocument()
    expect(screen.queryByText('sql-editor')).not.toBeInTheDocument()
    expect(screen.queryByText('storage-buckets')).not.toBeInTheDocument()
    expect(screen.queryByText('storage-explorer')).not.toBeInTheDocument()
  })

  it('shows the platform webhooks section with human labels when webhooks shortcuts are active', async () => {
    renderShortcutsReferenceSheet(ACTIVE_PLATFORM_WEBHOOKS_SHORTCUT_IDS)

    expect(await screen.findByText('Platform Webhooks')).toBeInTheDocument()
    expect(screen.getByText('Edit endpoint')).toBeInTheDocument()
    expect(screen.getByText('Copy endpoint URL')).toBeInTheDocument()
    expect(screen.getByText('Retry delivery')).toBeInTheDocument()
    expect(screen.getByText('Copy payload')).toBeInTheDocument()
    expect(screen.queryByText('platform-webhooks')).not.toBeInTheDocument()
  })

  it('shows project settings navigation and action sections with human labels', async () => {
    renderShortcutsReferenceSheet(ACTIVE_PROJECT_SETTINGS_SHORTCUT_IDS)

    expect(await screen.findByText('Project Settings Navigation')).toBeInTheDocument()
    expect(screen.getByText('API Keys')).toBeInTheDocument()
    expect(screen.getByText('JWT Keys')).toBeInTheDocument()
    expect(screen.getByText('Log Drains')).toBeInTheDocument()
    expect(screen.getByText('Go to General')).toBeInTheDocument()
    expect(screen.getByText('New publishable key')).toBeInTheDocument()
    expect(screen.getByText('Create standby key')).toBeInTheDocument()
    expect(screen.getByText('Add destination')).toBeInTheDocument()
    expect(screen.queryByText('api-keys')).not.toBeInTheDocument()
    expect(screen.queryByText('jwt-keys')).not.toBeInTheDocument()
    expect(screen.queryByText('log-drains')).not.toBeInTheDocument()
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
