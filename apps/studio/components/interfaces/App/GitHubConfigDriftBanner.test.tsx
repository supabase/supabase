import { screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GitHubConfigDriftBanner } from './GitHubConfigDriftBanner'
import { customRender } from '@/tests/lib/custom-render'

const { useParamsMock, useSelectedGitHubConfigDriftMock } = vi.hoisted(() => ({
  useParamsMock: vi.fn(),
  useSelectedGitHubConfigDriftMock: vi.fn(),
}))

vi.mock('common', async (importOriginal) => {
  const original = await importOriginal<typeof import('common')>()
  return { ...original, useParams: useParamsMock }
})

vi.mock('@/hooks/misc/useGitHubConfigDrift', () => ({
  useSelectedGitHubConfigDrift: useSelectedGitHubConfigDriftMock,
}))

vi.mock('@/hooks/misc/useOrganizationRestrictions', () => ({
  useOrganizationRestrictions: () => ({ warnings: [] }),
}))

function setDrift(count: number, hasDrift = count > 0) {
  useSelectedGitHubConfigDriftMock.mockReturnValue({
    hasDrift,
    hasConfigurationIssues: hasDrift,
    summary: {
      managedCount: 0,
      driftedFields: Array.from({ length: count }, (_, index) => ({
        fieldName: `FIELD_${index}`,
      })),
    },
  })
}

describe('GitHubConfigDriftBanner', () => {
  beforeEach(() => {
    useParamsMock.mockReturnValue({ ref: 'project-ref' })
    setDrift(0)
  })

  it('is hidden when the project ref is absent', () => {
    useParamsMock.mockReturnValue({})
    setDrift(1)

    const { container } = customRender(<GitHubConfigDriftBanner />)

    expect(container).toBeEmptyDOMElement()
  })

  it('is hidden when no supported setting has drift', () => {
    const { container } = customRender(<GitHubConfigDriftBanner />)

    expect(container).toBeEmptyDOMElement()
  })

  it('uses generic singular configuration drift copy', () => {
    setDrift(1)

    customRender(<GitHubConfigDriftBanner />)

    expect(screen.getByText('Code configuration needs attention')).toBeInTheDocument()
    expect(screen.getByText(/1 managed setting differs/)).toBeInTheDocument()
    expect(screen.queryByText(/Auth settings differ/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Review configuration' })).toHaveAttribute(
      'href',
      '/project/project-ref/settings/configuration-drift'
    )
  })

  it('uses generic plural configuration drift copy', () => {
    setDrift(2)

    customRender(<GitHubConfigDriftBanner />)

    expect(screen.getByText(/2 managed settings differ/)).toBeInTheDocument()
  })

  it('animates the banner out when drift is resolved', async () => {
    setDrift(1)
    const { rerender } = customRender(<GitHubConfigDriftBanner />)

    expect(screen.getByText('Code configuration needs attention')).toBeInTheDocument()

    setDrift(0)
    rerender(<GitHubConfigDriftBanner />)

    await waitFor(() => {
      expect(screen.queryByText('Code configuration needs attention')).not.toBeInTheDocument()
    })
  })
})
