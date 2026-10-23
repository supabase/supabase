import { screen } from '@testing-library/dom'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { IntegrationOverviewTab } from './IntegrationOverviewTab'
import { customRender } from '@/tests/lib/custom-render'
import { routerMock } from '@/tests/lib/route-mock'

mockAnimationsApi()

vi.mock('../Landing/Integrations.constants', () => ({
  INTEGRATIONS: [
    {
      id: 'test-integration',
      name: 'Test Integration',
      requiredExtensions: ['pg_net'],
    },
  ],
}))

vi.mock('motion/react', async (importOriginal) => {
  const actual = (await importOriginal()) as any
  return {
    ...actual,
    motion: {
      ...actual.motion,
      div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
  }
})

const mockExtensions = vi.fn()

vi.mock('@/data/database-extensions/database-extensions-query', () => ({
  useDatabaseExtensionsQuery: () => ({ data: mockExtensions() }),
}))

vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: () => ({
    data: { ref: 'default', connectionString: 'postgres://localhost' },
  }),
  useIsOrioleDb: () => false,
  useIsHighAvailability: () => false,
}))

vi.mock('common', async (importOriginal) => {
  const actual = (await importOriginal()) as any
  return {
    ...actual,
    useParams: () => ({ id: 'test-integration', ref: 'default' }),
  }
})

vi.mock('./MarkdownContent', () => ({
  MarkdownContent: () => null,
}))

vi.mock('../Landing/useIntegrationDetail', () => ({
  useIntegrationDetail: () => ({
    integration: {
      id: 'test-integration',
      name: 'Test Integration',
      requiredExtensions: ['pg_net'],
      missingExtensionsAlert: null,
    },
  }),
}))

describe('IntegrationOverviewTab', () => {
  beforeEach(() => {
    routerMock.setCurrentUrl('/project/default/integrations/test-integration/overview')
    mockExtensions.mockReturnValue([
      { name: 'pg_net', installed_version: null, default_version: '0.6.0' },
    ])
  })

  it.each([
    { hideRequiredExtensionsSection: true, isDisabled: 'false' },
    { hideRequiredExtensionsSection: false, isDisabled: 'true' },
  ])(
    'with uninstalled extensions and hideRequiredExtensionsSection=$hideRequiredExtensionsSection, aria-disabled is $isDisabled',
    ({ hideRequiredExtensionsSection, isDisabled }) => {
      customRender(
        <IntegrationOverviewTab
          hideRequiredExtensionsSection={hideRequiredExtensionsSection}
          actions={<button tabIndex={0}>Enable integration</button>}
        />
      )

      const actionsArea = screen.getByText('Enable integration').closest('[aria-disabled]')
      expect(actionsArea).toHaveAttribute('aria-disabled', isDisabled)
    }
  )
})
