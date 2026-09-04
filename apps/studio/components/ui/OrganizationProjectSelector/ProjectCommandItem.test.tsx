import { screen, within } from '@testing-library/react'
import { Command } from 'ui'
import { describe, expect, it, vi } from 'vitest'

import { ProjectCommandItem } from './ProjectCommandItem'
import type { OrgProject } from '@/data/projects/org-projects-infinite-query'
import { render } from '@/tests/helpers'

const project = {
  cloud_provider: 'AWS',
  databases: [],
  inserted_at: '2026-08-26T00:00:00.000Z',
  integration_source: null,
  is_branch: false,
  ref: 'project-ref',
  name: 'Project name',
  region: 'ap-southeast-2',
  status: 'ACTIVE_HEALTHY',
} satisfies OrgProject

describe('ProjectCommandItem', () => {
  it('wraps navigable command items in a link', () => {
    render(
      <Command>
        <ProjectCommandItem
          project={project}
          selectedRef={undefined}
          onClose={vi.fn()}
          href="/project/project-ref"
        />
      </Command>
    )

    const projectLink = screen.getByRole('link', { name: 'Project name' })
    expect(within(projectLink).getByRole('option')).toBeInTheDocument()
    expect(projectLink).toHaveAttribute('href', '/project/project-ref')
  })
})
