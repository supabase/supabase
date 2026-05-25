import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { S3ConnectionSelfHosted } from './S3ConnectionSelfHosted'
import { customRender as render } from '@/tests/lib/custom-render'

const {
  mockUseProjectSettingsV2Query,
  mockUseSelectedProjectQuery,
  mockUseStorageCredentialsQuery,
} = vi.hoisted(() => ({
  mockUseProjectSettingsV2Query: vi.fn(),
  mockUseSelectedProjectQuery: vi.fn(),
  mockUseStorageCredentialsQuery: vi.fn(),
}))

vi.mock('@/data/config/project-settings-v2-query', () => ({
  useProjectSettingsV2Query: mockUseProjectSettingsV2Query,
}))

vi.mock('@/data/storage/s3-access-key-query', () => ({
  useStorageCredentialsQuery: mockUseStorageCredentialsQuery,
}))

vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: mockUseSelectedProjectQuery,
}))

describe('S3ConnectionSelfHosted', () => {
  beforeEach(() => {
    mockUseSelectedProjectQuery.mockReturnValue({ data: { region: 'local' } })
    mockUseProjectSettingsV2Query.mockReturnValue({
      data: {
        app_config: {
          endpoint: 'localhost:8000',
          storage_endpoint: 'localhost:8000',
          protocol: 'http',
        },
      },
    })
    mockUseStorageCredentialsQuery.mockReturnValue({ data: { data: [] } })
  })

  it('renders the self-hosted admonition and derived endpoint + region', () => {
    render(<S3ConnectionSelfHosted />)

    expect(screen.getByText('Self-hosted Supabase')).toBeInTheDocument()
    expect(screen.getByDisplayValue('http://localhost:8000/storage/v1/s3')).toBeInTheDocument()
    expect(screen.getByDisplayValue('local')).toBeInTheDocument()
  })

  it('shows the empty-state row when no access key is configured', () => {
    render(<S3ConnectionSelfHosted />)

    expect(screen.getByText('No access key configured')).toBeInTheDocument()
  })

  it('renders the synthesized access key row when one is provided', () => {
    mockUseStorageCredentialsQuery.mockReturnValue({
      data: {
        data: [{ id: 'aws-access', description: 'Default', access_key: 'aws-access' }],
      },
    })

    render(<S3ConnectionSelfHosted />)

    expect(screen.getByText('Default')).toBeInTheDocument()
    expect(screen.getByDisplayValue('aws-access')).toBeInTheDocument()
    expect(screen.queryByText('No access key configured')).not.toBeInTheDocument()
  })
})
