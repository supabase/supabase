import { render, screen } from '@testing-library/react'
import type { ResourceWarning } from 'data/usage/resource-warnings-query'
import { describe, expect, it } from 'vitest'

import { ProjectCardStatus } from './ProjectCardStatus'

describe('ProjectCardStatus', () => {
  it('keeps the Active badge when resource warnings hydrate to an empty object', () => {
    const { rerender } = render(<ProjectCardStatus projectStatus="isHealthy" renderMode="badge" />)

    expect(screen.getByText('Active')).toBeVisible()

    rerender(
      <ProjectCardStatus
        projectStatus="isHealthy"
        renderMode="badge"
        resourceWarnings={{} as ResourceWarning}
      />
    )

    expect(screen.getByText('Active')).toBeVisible()
    expect(screen.queryByText('–')).not.toBeInTheDocument()
  })
})
