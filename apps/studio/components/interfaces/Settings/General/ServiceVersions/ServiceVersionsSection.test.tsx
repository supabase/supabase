import { render, screen } from '@testing-library/react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ServiceVersionsSection } from './ServiceVersionsSection'

const {
  mockUseFeatures,
  mockUseIsOrioleDb,
  mockUseProject,
  mockUseReadReplicas,
  mockUseServiceVersions,
  mockUseUpgradeEligibility,
} = vi.hoisted(() => ({
  mockUseFeatures: vi.fn(),
  mockUseIsOrioleDb: vi.fn(),
  mockUseProject: vi.fn(),
  mockUseReadReplicas: vi.fn(),
  mockUseServiceVersions: vi.fn(),
  mockUseUpgradeEligibility: vi.fn(),
}))

vi.mock('common', () => ({
  useParams: () => ({ ref: 'project-ref' }),
}))

vi.mock('ui', () => ({
  Badge: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Input: (props: InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
  InputGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  InputGroupAddon: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  InputGroupInput: (props: InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

vi.mock('ui-patterns/Admonition', () => ({
  Admonition: ({
    title,
    description,
    children,
  }: {
    title?: ReactNode
    description?: ReactNode
    children?: ReactNode
  }) => (
    <div>
      <div>{title}</div>
      <div>{description}</div>
      {children}
    </div>
  ),
}))

vi.mock('ui-patterns/form/FormItemLayout/FormItemLayout', () => ({
  FormItemLayout: ({ label, children }: { label: ReactNode; children: ReactNode }) => (
    <label>
      {label}
      {children}
    </label>
  ),
}))

vi.mock('ui-patterns/PageSection', () => ({
  PageSection: ({ children, id }: { children: ReactNode; id?: string }) => (
    <section id={id}>{children}</section>
  ),
  PageSectionContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PageSectionDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>,
  PageSectionMeta: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PageSectionSummary: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PageSectionTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}))

vi.mock('ui-patterns/ShimmeringLoader', () => ({
  GenericSkeletonLoader: () => <div>Loading service versions</div>,
}))

vi.mock('../../Infrastructure/UpgradeWarnings', () => ({
  ReadReplicasWarning: ({ latestPgVersion }: { latestPgVersion?: string }) => (
    <div>Read replicas block upgrade to {latestPgVersion}</div>
  ),
  ValidationErrorsWarning: ({ validationErrors }: { validationErrors?: string[] }) => (
    <div>Validation errors: {validationErrors?.join(', ')}</div>
  ),
  ValidationWarningsAdmonition: ({ warnings }: { warnings?: string[] }) => (
    <div>Validation warnings: {warnings?.join(', ')}</div>
  ),
}))

vi.mock('../Infrastructure/ProjectUpgradeAlert', () => ({
  ProjectUpgradeAlert: () => <div>Project upgrade available</div>,
}))

vi.mock('@/components/ui/AlertError', () => ({
  AlertError: ({ subject }: { subject: string }) => <div>{subject}</div>,
}))

vi.mock('@/data/config/project-upgrade-eligibility-query', () => ({
  useProjectUpgradeEligibilityQuery: mockUseUpgradeEligibility,
}))

vi.mock('@/data/projects/project-service-versions', () => ({
  useProjectServiceVersionsQuery: mockUseServiceVersions,
}))

vi.mock('@/data/read-replicas/replicas-query', () => ({
  useReadReplicasQuery: mockUseReadReplicas,
}))

vi.mock('@/hooks/misc/useIsFeatureEnabled', () => ({
  useIsFeatureEnabled: mockUseFeatures,
}))

vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useIsOrioleDb: mockUseIsOrioleDb,
  useSelectedProjectQuery: mockUseProject,
}))

describe('ServiceVersionsSection', () => {
  beforeEach(() => {
    mockUseFeatures.mockReturnValue({
      projectAuthAll: true,
      projectSettingsDatabaseUpgrades: true,
    })
    mockUseIsOrioleDb.mockReturnValue(false)
    mockUseProject.mockReturnValue({ data: { status: 'ACTIVE_HEALTHY' } })
    mockUseReadReplicas.mockReturnValue({ data: [{ identifier: 'project-ref' }] })
    mockUseUpgradeEligibility.mockReturnValue({
      data: {
        current_app_version: 'supabase-postgres-15.8.1.060',
        current_app_version_release_channel: 'ga',
        latest_app_version: 'supabase-postgres-17.4.1.060',
        eligible: true,
        validation_errors: [],
        warnings: [],
      },
      error: undefined,
      isPending: false,
      isError: false,
      isSuccess: true,
    })
    mockUseServiceVersions.mockReturnValue({
      data: {
        gotrue: '2.180.0',
        postgrest: '12.2.8',
        'supabase-postgres': '15.8.1.060',
      },
      error: undefined,
      isPending: false,
      isError: false,
      isSuccess: true,
    })
  })

  it('preserves the paused-project state without showing stale version values', () => {
    mockUseProject.mockReturnValue({ data: { status: 'INACTIVE' } })

    const { container } = render(<ServiceVersionsSection />)

    expect(
      screen.getByText('Service versions cannot be retrieved while project is paused')
    ).toBeInTheDocument()
    expect(screen.queryByDisplayValue('12.2.8')).not.toBeInTheDocument()
    expect(container.querySelector('#service-versions')).toBeInTheDocument()
  })

  it('renders Auth, PostgREST, and Postgres versions with release metadata', () => {
    mockUseIsOrioleDb.mockReturnValue(true)
    mockUseUpgradeEligibility.mockReturnValue({
      data: {
        current_app_version: 'supabase-postgres-17.4.1.060-orioledb',
        current_app_version_release_channel: 'beta',
        latest_app_version: 'supabase-postgres-17.4.1.060-orioledb',
        eligible: true,
        validation_errors: [],
        warnings: [],
      },
      error: undefined,
      isPending: false,
      isError: false,
      isSuccess: true,
    })

    render(<ServiceVersionsSection />)

    expect(screen.getByDisplayValue('2.180.0')).toBeInTheDocument()
    expect(screen.getByDisplayValue('12.2.8')).toBeInTheDocument()
    expect(screen.getByDisplayValue('17.4.1.060')).toBeInTheDocument()
    expect(screen.getAllByText('beta').length).toBeGreaterThan(0)
    expect(screen.getAllByText('OrioleDB').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Latest').length).toBeGreaterThan(0)
    expect(screen.getByText('Project upgrade available')).toBeInTheDocument()
  })

  it('shows the read-replica upgrade block instead of the upgrade action', () => {
    mockUseReadReplicas.mockReturnValue({
      data: [{ identifier: 'project-ref' }, { identifier: 'replica-1' }],
    })

    render(<ServiceVersionsSection />)

    expect(screen.getByText('Read replicas block upgrade to 17.4.1.060')).toBeInTheDocument()
    expect(screen.queryByText('Project upgrade available')).not.toBeInTheDocument()
  })

  it('renders upgrade validation errors and warnings for an ineligible project', () => {
    mockUseUpgradeEligibility.mockReturnValue({
      data: {
        current_app_version: 'supabase-postgres-15.8.1.060',
        latest_app_version: 'supabase-postgres-17.4.1.060',
        eligible: false,
        validation_errors: ['Remove read replicas'],
        warnings: ['Review extension compatibility'],
      },
      error: undefined,
      isPending: false,
      isError: false,
      isSuccess: true,
    })

    render(<ServiceVersionsSection />)

    expect(screen.getByText('Validation errors: Remove read replicas')).toBeInTheDocument()
    expect(
      screen.getByText('Validation warnings: Review extension compatibility')
    ).toBeInTheDocument()
    expect(screen.queryByText('Project upgrade available')).not.toBeInTheDocument()
  })

  it('preserves eligibility and service-version loading and error states', () => {
    mockUseUpgradeEligibility
      .mockReturnValueOnce({
        data: undefined,
        error: undefined,
        isPending: true,
        isError: false,
        isSuccess: false,
      })
      .mockReturnValueOnce({
        data: undefined,
        error: new Error('eligibility failed'),
        isPending: false,
        isError: true,
        isSuccess: false,
      })

    const { rerender } = render(<ServiceVersionsSection />)
    expect(screen.getByText('Loading service versions')).toBeInTheDocument()

    rerender(<ServiceVersionsSection />)
    expect(screen.getByText('Failed to retrieve Postgres version')).toBeInTheDocument()

    mockUseUpgradeEligibility.mockReturnValue({
      data: {
        current_app_version: 'supabase-postgres-15.8.1.060',
        latest_app_version: 'supabase-postgres-17.4.1.060',
        eligible: true,
      },
      error: undefined,
      isPending: false,
      isError: false,
      isSuccess: true,
    })
    mockUseServiceVersions.mockReturnValue({
      data: undefined,
      error: new Error('versions failed'),
      isPending: false,
      isError: true,
      isSuccess: false,
    })

    rerender(<ServiceVersionsSection />)
    expect(screen.getByText('Failed to retrieve versions')).toBeInTheDocument()
  })
})
