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

vi.mock('framer-motion', async (importOriginal) => {
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

describe('IntegrationOverviewTab', () => {
  beforeEach(() => {
    routerMock.setCurrentUrl('/project/default/integrations/test-integration/overview')
    mockExtensions.mockReturnValue([
      { name: 'pg_net', installed_version: null, default_version: '0.6.0' },
    ])
  })

  it('does not disable actions when hideRequiredExtensionsSection is true and extensions are uninstalled', () => {
    customRender(
      <IntegrationOverviewTab
        hideRequiredExtensionsSection
        actions={<button>Enable webhooks</button>}
      />
    )

    const actionsArea = screen.getByText('Enable webhooks').closest('[aria-disabled]')
    expect(actionsArea).toHaveAttribute('aria-disabled', 'false')
    expect(actionsArea).not.toHaveClass('opacity-25')
  })

  it('disables actions when extensions are uninstalled and hideRequiredExtensionsSection is false', () => {
    customRender(<IntegrationOverviewTab actions={<button>Enable integration</button>} />)

    const actionsArea = screen.getByText('Enable integration').closest('[aria-disabled]')
    expect(actionsArea).toHaveAttribute('aria-disabled', 'true')
    expect(actionsArea).toHaveClass('opacity-25')
  })
})
