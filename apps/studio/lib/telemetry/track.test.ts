import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useTrack } from './track'
import { sendTelemetryEvent } from 'common'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useRouter } from 'next/router'
import { API_URL } from 'lib/constants'

vi.mock('common', () => ({
  sendTelemetryEvent: vi.fn(),
}))

vi.mock('hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: vi.fn(),
}))

vi.mock('hooks/misc/useSelectedOrganization', () => ({
  useSelectedOrganizationQuery: vi.fn(),
}))

vi.mock('next/router', () => ({
  useRouter: vi.fn(),
}))

vi.mock('lib/constants', () => ({
  API_URL: 'http://localhost:3000/api',
}))

describe('useTrack', () => {
  const mockRouter = {
    pathname: '/test/path',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as any).mockReturnValue(mockRouter)
    ;(useSelectedProjectQuery as any).mockReturnValue({ data: null })
    ;(useSelectedOrganizationQuery as any).mockReturnValue({ data: null })
  })

  it('should call sendTelemetryEvent with action only', () => {
    const { result } = renderHook(() => useTrack())

    result.current('help_button_clicked')

    expect(sendTelemetryEvent).toHaveBeenCalledWith(
      API_URL,
      { action: 'help_button_clicked', groups: {} },
      '/test/path'
    )
  })

  it('should include project ref when available', () => {
    const projectRef = 'test-project-ref'
    ;(useSelectedProjectQuery as any).mockReturnValue({
      data: { ref: projectRef },
    })

    const { result } = renderHook(() => useTrack())

    result.current('help_button_clicked')

    expect(sendTelemetryEvent).toHaveBeenCalledWith(
      API_URL,
      {
        action: 'help_button_clicked',
        groups: { project: projectRef },
      },
      '/test/path'
    )
  })

  it('should include organization slug when available', () => {
    const orgSlug = 'test-org-slug'
    ;(useSelectedOrganizationQuery as any).mockReturnValue({
      data: { slug: orgSlug },
    })

    const { result } = renderHook(() => useTrack())

    result.current('help_button_clicked')

    expect(sendTelemetryEvent).toHaveBeenCalledWith(
      API_URL,
      {
        action: 'help_button_clicked',
        groups: { organization: orgSlug },
      },
      '/test/path'
    )
  })

  it('should include both project and organization when available', () => {
    const projectRef = 'test-project-ref'
    const orgSlug = 'test-org-slug'
    ;(useSelectedProjectQuery as any).mockReturnValue({
      data: { ref: projectRef },
    })
    ;(useSelectedOrganizationQuery as any).mockReturnValue({
      data: { slug: orgSlug },
    })

    const { result } = renderHook(() => useTrack())

    result.current('help_button_clicked')

    expect(sendTelemetryEvent).toHaveBeenCalledWith(
      API_URL,
      {
        action: 'help_button_clicked',
        groups: { project: projectRef, organization: orgSlug },
      },
      '/test/path'
    )
  })

  it('should allow group overrides', () => {
    const projectRef = 'test-project-ref'
    ;(useSelectedProjectQuery as any).mockReturnValue({
      data: { ref: projectRef },
    })

    const { result } = renderHook(() => useTrack())

    result.current('help_button_clicked', undefined, { project: 'override-ref' })

    expect(sendTelemetryEvent).toHaveBeenCalledWith(
      API_URL,
      {
        action: 'help_button_clicked',
        groups: { project: 'override-ref' },
      },
      '/test/path'
    )
  })

  it('should use router pathname from context', () => {
    const customPathname = '/custom/path'
    ;(useRouter as any).mockReturnValue({ pathname: customPathname })

    const { result } = renderHook(() => useTrack())

    result.current('help_button_clicked')

    expect(sendTelemetryEvent).toHaveBeenCalledWith(
      API_URL,
      { action: 'help_button_clicked', groups: {} },
      customPathname
    )
  })
})

