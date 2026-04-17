import { fireEvent, screen, waitFor } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { IntegrationDefinition } from '../../Landing/Integrations.constants'
import { InstallIntegrationSheet } from './InstallIntegrationSheet/InstallIntegrationSheet'
import { customRender } from '@/tests/lib/custom-render'
import { routerMock } from '@/tests/lib/route-mock'

mockAnimationsApi()

vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: () => ({
    data: { ref: 'default', connectionString: 'postgres://localhost' },
  }),
}))

vi.mock('@/hooks/useProtectedSchemas', () => ({
  useProtectedSchemas: () => ({ data: [] }),
}))

const mockExtensions = vi.fn()
vi.mock('@/data/database-extensions/database-extensions-query', () => ({
  useDatabaseExtensionsQuery: () => ({ data: mockExtensions(), isSuccess: true }),
}))

vi.mock('@/data/database/schemas-query', () => ({
  useSchemasQuery: () => ({ data: [{ id: 1, name: 'public' }] }),
}))

const mockExecuteSql = vi.fn()
vi.mock('@/data/sql/execute-sql-mutation', () => ({
  useExecuteSqlMutation: () => ({ mutateAsync: mockExecuteSql }),
}))

vi.mock('@/data/database-extensions/database-extension-enable-mutation', () => ({
  useDatabaseExtensionEnableMutation: () => ({ mutateAsync: vi.fn() }),
}))

vi.mock('@/components/interfaces/Database/Extensions/Extensions.constants', () => ({
  extensionsWithRecommendedSchemas: {},
}))

vi.mock('./IntegrationOverviewTabV2.utils', () => ({
  getEnableExtensionsSQL: () => 'CREATE EXTENSION IF NOT EXISTS pg_net;',
  getExtensionDefaultSchema: () => 'extensions',
}))

const createIntegration = (overrides: Partial<IntegrationDefinition> = {}): IntegrationDefinition =>
  ({
    id: 'test-integration',
    type: 'postgres_extension',
    name: 'Test Integration',
    requiredExtensions: ['pg_net'],
    icon: () => null,
    description: 'Test description',
    docsUrl: null,
    author: { name: 'Test', websiteUrl: 'https://test.com' },
    navigate: () => null,
    ...overrides,
  }) as unknown as any

const getInstallButton = () => {
  const buttons = screen.getAllByRole('button', { name: 'Install integration' })
  return buttons[buttons.length - 1]
}

describe('InstallIntegrationSheet', () => {
  beforeEach(() => {
    routerMock.setCurrentUrl('/project/default/integrations/test-integration/overview')
    mockExecuteSql.mockReset()
  })

  it('install button is disabled when extensions are missing even if installationCommand exists', async () => {
    mockExtensions.mockReturnValue([])

    customRender(
      <InstallIntegrationSheet
        integration={createIntegration({
          installationCommand: vi.fn().mockResolvedValue(undefined),
        })}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: 'Install integration' }))
    expect(getInstallButton()).toBeDisabled()
  })

  it('install button is disabled when extensions are missing and no installationCommand', async () => {
    mockExtensions.mockReturnValue([])

    customRender(
      <InstallIntegrationSheet
        integration={createIntegration({ installationCommand: undefined })}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: 'Install integration' }))
    expect(getInstallButton()).toBeDisabled()
  })

  it('uses installationCommand instead of SQL when provided', async () => {
    mockExtensions.mockReturnValue([
      { name: 'pg_net', installed_version: null, default_version: '0.6.0' },
    ])

    const mockCommand = vi.fn().mockResolvedValue(undefined)
    customRender(
      <InstallIntegrationSheet
        integration={createIntegration({ installationCommand: mockCommand })}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: 'Install integration' }))

    // SheetContent renders via a Radix portal, placing the submit button outside
    // the <form> in the DOM. jsdom doesn't support the HTML `form` attribute on
    // buttons, so we submit the form directly instead of clicking the button.
    const form = document.getElementById('installation-settings')!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(mockCommand).toHaveBeenCalledWith(expect.objectContaining({ ref: 'default' }))
    })
    expect(mockExecuteSql).not.toHaveBeenCalled()
  })
})
