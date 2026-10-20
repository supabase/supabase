import { screen } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import type { CategoryAttribute } from '../Usage.constants'
import { DiskUsage } from './DiskUsage'
import type { OrgProject, OrgProjectsResponse } from '@/data/projects/org-projects-infinite-query'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'

const attribute: CategoryAttribute = {
  anchor: 'diskSize',
  key: 'diskSize',
  attributes: [],
  name: 'Disk size',
  unit: 'bytes',
  description: 'Provisioned disk size',
  chartDescription: '',
}

const branch: OrgProject = {
  cloud_provider: 'AWS',
  databases: [
    {
      cloud_provider: 'AWS',
      disk_volume_size_gb: 8,
      identifier: 'branch-ref',
      region: 'us-east-1',
      status: 'ACTIVE_HEALTHY',
      type: 'PRIMARY',
    },
  ],
  inserted_at: '2026-01-01T00:00:00Z',
  integration_source: null,
  is_branch: true,
  name: 'Preview branch',
  ref: 'branch-ref',
  region: 'us-east-1',
  status: 'ACTIVE_HEALTHY',
}

const firstPage = Array.from({ length: 96 }, (_, index) => ({
  ...branch,
  ref: `project-${index}`,
  name: `Project ${index}`,
  is_branch: false,
}))

const renderDiskUsage = (projectRef?: string) =>
  customRender(
    <DiskUsage
      slug="test-org"
      projectRef={projectRef}
      attribute={attribute}
      currentBillingCycleSelected
    />,
    { profileContext: createMockProfileContext() }
  )

describe('DiskUsage', () => {
  it('finds a selected branch beyond the first page and stops once found', async () => {
    const offsets: number[] = []
    addAPIMock({
      method: 'get',
      path: '/platform/organizations/:slug/projects',
      response: ({ request }) => {
        const offset = Number(new URL(request.url).searchParams.get('offset'))
        offsets.push(offset)
        return HttpResponse.json<OrgProjectsResponse>({
          pagination: { count: 250, limit: 96, offset },
          projects: offset === 0 ? firstPage : [branch],
        })
      },
    })

    renderDiskUsage('branch-ref')

    expect(await screen.findByText('Preview branch')).toBeInTheDocument()
    expect(screen.getByText('8 GB Disk provisioned')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Manage Disk' })).toHaveAttribute(
      'href',
      '/project/branch-ref/settings/infrastructure'
    )
    expect(screen.queryByText('No active projects')).not.toBeInTheDocument()
    expect(offsets).toEqual([0, 96])
  })

  it.each([undefined, 'project-0'])(
    'does not paginate when the filter is %s',
    async (projectRef) => {
      const offsets: number[] = []
      addAPIMock({
        method: 'get',
        path: '/platform/organizations/:slug/projects',
        response: ({ request }) => {
          const offset = Number(new URL(request.url).searchParams.get('offset'))
          offsets.push(offset)
          return HttpResponse.json<OrgProjectsResponse>({
            pagination: { count: 250, limit: 96, offset },
            projects: firstPage,
          })
        },
      })

      renderDiskUsage(projectRef)

      expect(await screen.findByText('Project 0')).toBeInTheDocument()
      expect(offsets).toEqual([0])
    }
  )

  it('shows an error when the next page fails instead of claiming there are no projects', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: () =>
        HttpResponse.json<APIErrorBody>({ message: 'Project not found' }, { status: 404 }),
    })
    addAPIMock({
      method: 'get',
      path: '/platform/organizations/:slug/projects',
      response: ({ request }) => {
        const offset = Number(new URL(request.url).searchParams.get('offset'))
        if (offset > 0) {
          return HttpResponse.json<APIErrorBody>({ message: 'Page unavailable' }, { status: 500 })
        }
        return HttpResponse.json<OrgProjectsResponse>({
          pagination: { count: 97, limit: 96, offset },
          projects: firstPage,
        })
      },
    })

    renderDiskUsage('branch-ref')

    expect(await screen.findByText('Failed to retrieve usage data')).toBeInTheDocument()
    expect(screen.queryByText('No active projects')).not.toBeInTheDocument()
  })
})
