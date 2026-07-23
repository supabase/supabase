import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { SchemaSelector } from './SchemaSelector'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

mockAnimationsApi()

const mockProjectAndSchemas = ({ highAvailability }: { highAvailability: boolean }) => {
  // useSelectedProjectQuery
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    // @ts-expect-error partial project response
    response: {
      cloud_provider: 'localhost',
      id: 1,
      inserted_at: '2021-08-02T06:40:40.646Z',
      name: 'Default Project',
      organization_id: 1,
      ref: 'default',
      region: 'local',
      status: 'ACTIVE_HEALTHY',
      high_availability: highAvailability,
    },
  })
  // useSchemasQuery (schemas list SQL via pg-meta)
  addAPIMock({
    method: 'post',
    path: '/platform/pg-meta/:ref/query',
    response: () =>
      HttpResponse.json([
        { id: 1, name: 'public' },
        { id: 2, name: 'multigres' },
        { id: 3, name: 'other' },
      ]),
  })
}

const renderAndOpenSelector = async () => {
  customRender(<SchemaSelector selectedSchemaName="public" onSelectSchema={vi.fn()} />)

  await userEvent.click(await screen.findByTestId('schema-selector'))
  // Wait for the list to be populated before asserting absence
  await screen.findByRole('option', { name: 'public' })
}

describe('SchemaSelector', () => {
  it('hides the multigres schema on high availability projects', async () => {
    mockProjectAndSchemas({ highAvailability: true })

    await renderAndOpenSelector()

    expect(screen.getByRole('option', { name: 'other' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'multigres' })).not.toBeInTheDocument()
  })

  it('shows the multigres schema on non high availability projects', async () => {
    mockProjectAndSchemas({ highAvailability: false })

    await renderAndOpenSelector()

    expect(screen.getByRole('option', { name: 'multigres' })).toBeInTheDocument()
  })
})
