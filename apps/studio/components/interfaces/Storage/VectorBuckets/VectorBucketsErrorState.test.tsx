import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { VectorBucketsErrorState } from './VectorBucketsErrorState'
import type { DeploymentMode } from '@/hooks/misc/useDeploymentMode'
import { customRender } from '@/tests/lib/custom-render'
import { ResponseError } from '@/types'

const { mockUseDeploymentMode } = vi.hoisted(() => ({
  mockUseDeploymentMode: vi.fn<() => DeploymentMode>(),
}))

vi.mock('@/hooks/misc/useDeploymentMode', () => ({
  useDeploymentMode: mockUseDeploymentMode,
}))

vi.mock('@/lib/telemetry/track', () => ({
  useTrack: () => vi.fn(),
}))

const deploymentMode = (overrides: Partial<DeploymentMode>): DeploymentMode => ({
  isPlatform: false,
  isCli: false,
  isSelfHosted: false,
  ...overrides,
})

describe('VectorBucketsErrorState', () => {
  beforeEach(() => {
    mockUseDeploymentMode.mockReset()
  })

  test('CLI: shows the config.toml enable guidance, not the support error', () => {
    mockUseDeploymentMode.mockReturnValue(deploymentMode({ isCli: true }))

    customRender(<VectorBucketsErrorState error={new ResponseError('boom')} />)

    expect(screen.getByText('Vector buckets are not enabled')).toBeInTheDocument()
    expect(screen.getByText('supabase/config.toml')).toBeInTheDocument()
    expect(screen.queryByText('Contact support')).not.toBeInTheDocument()
  })

  test('platform: shows the generic support error', () => {
    mockUseDeploymentMode.mockReturnValue(deploymentMode({ isPlatform: true }))

    customRender(<VectorBucketsErrorState error={new ResponseError('boom')} />)

    expect(screen.getByText('Failed to retrieve vector buckets')).toBeInTheDocument()
    expect(screen.getByText('Contact support')).toBeInTheDocument()
    expect(screen.queryByText('Vector buckets are not enabled')).not.toBeInTheDocument()
  })
})
