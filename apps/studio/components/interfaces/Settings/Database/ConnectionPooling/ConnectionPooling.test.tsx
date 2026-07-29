import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ConnectionPooling } from './ConnectionPooling'
import { customRender } from '@/tests/lib/custom-render'

const {
  mockUpdatePoolerConfig,
  mockUseAsyncCheckPermissions,
  mockUseCheckEntitlements,
  mockUseHighAvailability,
  mockUseMaxConnectionsQuery,
  mockUsePgbouncerConfigQuery,
  mockUsePgbouncerConfigurationUpdateMutation,
  mockUseProjectAddonsQuery,
  mockUseSelectedProjectQuery,
} = vi.hoisted(() => ({
  mockUpdatePoolerConfig: vi.fn(),
  mockUseAsyncCheckPermissions: vi.fn(),
  mockUseCheckEntitlements: vi.fn(),
  mockUseHighAvailability: vi.fn(),
  mockUseMaxConnectionsQuery: vi.fn(),
  mockUsePgbouncerConfigQuery: vi.fn(),
  mockUsePgbouncerConfigurationUpdateMutation: vi.fn(),
  mockUseProjectAddonsQuery: vi.fn(),
  mockUseSelectedProjectQuery: vi.fn(),
}))

vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  useParams: () => ({ ref: 'ha-project' }),
}))

vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: mockUseAsyncCheckPermissions,
}))

vi.mock('@/hooks/misc/useCheckEntitlements', () => ({
  useCheckEntitlements: mockUseCheckEntitlements,
}))

vi.mock('@/hooks/misc/useHighAvailability', () => ({
  useHighAvailability: mockUseHighAvailability,
}))

vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: mockUseSelectedProjectQuery,
}))

vi.mock('@/data/database/max-connections-query', () => ({
  useMaxConnectionsQuery: mockUseMaxConnectionsQuery,
}))

vi.mock('@/data/database/pgbouncer-config-query', () => ({
  usePgbouncerConfigQuery: mockUsePgbouncerConfigQuery,
}))

vi.mock('@/data/database/pgbouncer-config-update-mutation', () => ({
  usePgbouncerConfigurationUpdateMutation: mockUsePgbouncerConfigurationUpdateMutation,
}))

vi.mock('@/data/subscriptions/project-addons-query', () => ({
  useProjectAddonsQuery: mockUseProjectAddonsQuery,
}))

describe('ConnectionPooling', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseSelectedProjectQuery.mockReturnValue({
      data: {
        id: 1,
        ref: 'ha-project',
        infra_compute_size: 'small',
        connectionString: 'postgresql://example',
      },
    })
    mockUseHighAvailability.mockReturnValue({ isHighAvailability: true, isPending: false })
    mockUseAsyncCheckPermissions.mockReturnValue({ can: true })
    mockUseCheckEntitlements.mockReturnValue({ hasAccess: true })
    mockUsePgbouncerConfigQuery.mockReturnValue({
      data: undefined,
      error: undefined,
      isPending: false,
      isError: false,
      isSuccess: false,
    })
    mockUseMaxConnectionsQuery.mockReturnValue({ data: undefined })
    mockUseProjectAddonsQuery.mockReturnValue({
      data: {
        selected_addons: [
          {
            type: 'compute_instance',
            variant: { name: 'Small', identifier: 'ci_small' },
          },
        ],
      },
      isSuccess: true,
    })
    mockUsePgbouncerConfigurationUpdateMutation.mockReturnValue({
      mutate: mockUpdatePoolerConfig,
      isPending: false,
    })
  })

  it('renders High Availability pooling settings as read-only', () => {
    customRender(<ConnectionPooling />)

    expect(
      screen.getAllByText(
        'Connection pooling settings are managed automatically on High Availability projects'
      )
    ).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'Learn more' })).toHaveAttribute(
      'href',
      'https://multigres.com/blog/pooling-without-choosing-a-mode'
    )

    expect(screen.queryByText('Enable IPv4 add-on')).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText('Managed automatically')).toBeDisabled()
    expect(screen.getByDisplayValue('100000')).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument()
    expect(mockUpdatePoolerConfig).not.toHaveBeenCalled()

    expect(mockUsePgbouncerConfigQuery).toHaveBeenCalledWith(expect.anything(), {
      enabled: false,
    })
    expect(mockUseMaxConnectionsQuery).toHaveBeenCalledWith(expect.anything(), {
      enabled: false,
    })
  })

  it('does not fetch pooling config while the high availability state is pending', () => {
    mockUseHighAvailability.mockReturnValue({ isHighAvailability: false, isPending: true })

    customRender(<ConnectionPooling />)

    expect(mockUsePgbouncerConfigQuery).toHaveBeenCalledWith(expect.anything(), {
      enabled: false,
    })
    expect(mockUseMaxConnectionsQuery).toHaveBeenCalledWith(expect.anything(), {
      enabled: false,
    })
  })

  it('fetches pooling config for non high availability projects', () => {
    mockUseHighAvailability.mockReturnValue({ isHighAvailability: false, isPending: false })

    customRender(<ConnectionPooling />)

    expect(mockUsePgbouncerConfigQuery).toHaveBeenCalledWith(expect.anything(), {
      enabled: true,
    })
    expect(mockUseMaxConnectionsQuery).toHaveBeenCalledWith(expect.anything(), {
      enabled: true,
    })
  })
})
