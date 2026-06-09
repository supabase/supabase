import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { Sheet, SheetContent } from 'ui'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CreateWrapperSheet } from '../CreateWrapperSheet'
import type { WrapperMeta } from '../Wrappers.types'
import { useIsMarketplaceEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

// Required for Sheet/Radix animations in jsdom
mockAnimationsApi()

// `useIntegrationDetail` is a router+data-fetching hook not under test here —
// mock it to return a stripe wrapper integration.
vi.mock('@/components/interfaces/Integrations/Landing/useIntegrationDetail', () => ({
  useIntegrationDetail: vi.fn().mockReturnValue({
    integration: {
      id: 'stripe_wrapper',
      type: 'wrapper',
      requiredExtensions: ['wrappers', 'supabase_vault'],
    },
  }),
}))

// `useTrack` fires a telemetry POST that has no relevant endpoint in tests.
vi.mock('@/lib/telemetry/track', () => ({
  useTrack: () => vi.fn(),
}))

// Keep a spy on useIsMarketplaceEnabled so individual tests can opt into marketplace mode.
vi.mock('@/components/interfaces/App/FeaturePreview/FeaturePreviewContext', () => ({
  useIsMarketplaceEnabled: vi.fn().mockReturnValue(false),
  useFeaturePreviewContext: vi.fn().mockReturnValue({ flags: {}, onUpdateFlag: vi.fn() }),
  FeaturePreviewContextProvider: ({ children }: { children: React.ReactNode }) => children,
}))

afterEach(() => {
  vi.mocked(useIsMarketplaceEnabled).mockReturnValue(false)
})

// ─── Fixtures ─────────────────────────────────────────────────────────────────

/** Defaults to schema mode because tables is empty. */
const SCHEMA_MODE_WRAPPER: WrapperMeta = {
  name: 'stripe_wrapper',
  handlerName: 'stripe_fdw_handler',
  validatorName: 'stripe_fdw_validator',
  icon: '',
  description: 'Stripe wrapper',
  extensionName: 'StripeFdw',
  label: 'Stripe',
  docsUrl: '',
  tables: [],
  canTargetSchema: true,
  // readOnly hides the field in the UI but sets the initial value so Zod min(1) passes
  sourceSchemaOption: {
    name: 'source_schema',
    label: 'Source Schema',
    required: true,
    encrypted: false,
    secureEntry: false,
    readOnly: true,
    defaultValue: 'stripe',
  },
  server: {
    options: [
      {
        name: 'api_key_id',
        label: 'Stripe Secret Key',
        required: true,
        encrypted: true,
        secureEntry: true,
      },
    ],
  },
}

/** Has tables, so defaults to tables mode. */
const TABLES_MODE_WRAPPER: WrapperMeta = {
  ...SCHEMA_MODE_WRAPPER,
  tables: [
    {
      label: 'Customers',
      options: [
        {
          name: 'object',
          defaultValue: 'customers',
          editable: false,
          required: true,
          type: 'text',
        },
      ],
    },
  ],
  canTargetSchema: false,
}

const EXTENSIONS_INSTALLED = [
  { name: 'wrappers', installed_version: '0.6.0', default_version: '0.6.0' },
  { name: 'supabase_vault', installed_version: '0.2.8', default_version: '0.2.8' },
]

const EXTENSIONS_NOT_INSTALLED = [
  { name: 'wrappers', installed_version: null, default_version: '0.6.0' },
  { name: 'supabase_vault', installed_version: null, default_version: '0.2.8' },
]

// ─── MSW helpers ──────────────────────────────────────────────────────────────

const mockProject = () => {
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    // @ts-expect-error — only required fields supplied
    response: {
      cloud_provider: 'localhost',
      id: 1,
      inserted_at: '2021-08-02T06:40:40.646Z',
      name: 'Default Project',
      organization_id: 1,
      ref: 'default',
      region: 'local',
      status: 'ACTIVE_HEALTHY',
    },
  })
}

type PgMetaScenario = 'success' | 'mutation-error'

/**
 * Single pg-meta handler branching on SQL content.
 * Read queries (extensions, schemas) always succeed; mutation SQL behaves per `scenario`.
 */
const mockPgMetaQuery = (
  scenario: PgMetaScenario = 'success',
  extensionsResponse: {
    name: string
    installed_version: string | null
    default_version: string
  }[] = EXTENSIONS_INSTALLED
) => {
  addAPIMock({
    method: 'post',
    path: '/platform/pg-meta/:ref/query',
    response: async ({ request }) => {
      const { query } = (await request.json()) as { query: string }

      if (query.includes('pg_available_extensions')) {
        return HttpResponse.json(extensionsResponse)
      }
      if (query.includes('nspname')) {
        return HttpResponse.json([{ id: 1, name: 'public', owner: 'postgres' }])
      }

      // Mutation SQL: CREATE SCHEMA, CREATE SERVER, IMPORT FOREIGN SCHEMA, etc.
      if (scenario === 'mutation-error') {
        return HttpResponse.json({ message: 'Permission denied' }, { status: 400 })
      }
      return HttpResponse.json([{}])
    },
  })
}

// ─── Render helper ────────────────────────────────────────────────────────────

const renderSheet = (overrides: { wrapperMeta?: WrapperMeta; onClose?: () => void } = {}) => {
  const onClose = overrides.onClose ?? vi.fn()
  const wrapperMeta = overrides.wrapperMeta ?? SCHEMA_MODE_WRAPPER

  mockProject()

  customRender(
    <Sheet open>
      <SheetContent>
        <CreateWrapperSheet
          wrapperMeta={wrapperMeta}
          onClose={onClose}
          onDirty={vi.fn()}
          onCloseWithConfirmation={vi.fn()}
        />
      </SheetContent>
    </Sheet>
  )

  return { onClose }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CreateWrapperSheet', () => {
  it('renders the sheet title and wrapper name field', async () => {
    mockPgMetaQuery()
    renderSheet()

    expect(await screen.findByText('Create a Stripe wrapper')).toBeInTheDocument()
    expect(screen.getByLabelText('Wrapper Name')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create wrapper' })).toBeInTheDocument()
  })

  it('Create wrapper button is enabled before any submission', async () => {
    mockPgMetaQuery()
    renderSheet()

    await screen.findByText('Create a Stripe wrapper')

    expect(screen.getByRole('button', { name: 'Create wrapper' })).not.toBeDisabled()
  })

  it('shows validation error when wrapper name is empty', async () => {
    mockPgMetaQuery()
    renderSheet()

    await screen.findByText('Create a Stripe wrapper')
    fireEvent.click(screen.getByRole('button', { name: 'Create wrapper' }))

    expect(await screen.findByText('Please provide a name for your wrapper')).toBeInTheDocument()
  })

  it('shows validation error when no tables are added in tables mode', async () => {
    mockPgMetaQuery()
    renderSheet({ wrapperMeta: TABLES_MODE_WRAPPER })

    await screen.findByText('Create a Stripe wrapper')
    await userEvent.type(screen.getByLabelText('Wrapper Name'), 'my_wrapper')
    fireEvent.click(screen.getByRole('button', { name: 'Create wrapper' }))

    expect(await screen.findByText('Please provide at least one table')).toBeInTheDocument()
  })

  it('calls onClose after successful creation in schema mode', async () => {
    mockPgMetaQuery('success')
    const { onClose } = renderSheet()

    await screen.findByText('Create a Stripe wrapper')

    await userEvent.type(screen.getByLabelText('Wrapper Name'), 'my_stripe_wrapper')
    await userEvent.type(screen.getByLabelText('Stripe Secret Key'), 'sk_test_key')
    await userEvent.type(screen.getByLabelText(/Specify a new schema/), 'stripe_data')

    fireEvent.click(screen.getByRole('button', { name: 'Create wrapper' }))

    await waitFor(() => expect(onClose).toHaveBeenCalledOnce(), { timeout: 3000 })
  })

  it('keeps the sheet open when creation fails', async () => {
    mockPgMetaQuery('mutation-error')
    const { onClose } = renderSheet()

    await screen.findByText('Create a Stripe wrapper')

    await userEvent.type(screen.getByLabelText('Wrapper Name'), 'my_stripe_wrapper')
    await userEvent.type(screen.getByLabelText('Stripe Secret Key'), 'sk_test_key')
    await userEvent.type(screen.getByLabelText(/Specify a new schema/), 'stripe_data')

    fireEvent.click(screen.getByRole('button', { name: 'Create wrapper' }))

    // Submit button re-enables after the error, sheet stays open
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Create wrapper' })).not.toBeDisabled()
    )
    expect(onClose).not.toHaveBeenCalled()
  })

  it('shows the extensions admonition when marketplace is enabled and extensions need installing', async () => {
    vi.mocked(useIsMarketplaceEnabled).mockReturnValue(true)
    mockPgMetaQuery('success', EXTENSIONS_NOT_INSTALLED)
    renderSheet()

    expect(await screen.findByText('Required extensions will be installed')).toBeInTheDocument()
  })

  it('hides the extensions admonition when marketplace is enabled but all extensions are installed', async () => {
    vi.mocked(useIsMarketplaceEnabled).mockReturnValue(true)
    mockPgMetaQuery('success', EXTENSIONS_INSTALLED)
    renderSheet()

    await screen.findByText('Create a Stripe wrapper')
    expect(screen.queryByText('Required extensions will be installed')).not.toBeInTheDocument()
  })
})
