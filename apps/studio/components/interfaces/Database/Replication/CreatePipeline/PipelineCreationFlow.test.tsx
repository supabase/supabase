import { QueryClient } from '@tanstack/react-query'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import type { components } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { delay, HttpResponse } from 'msw'
import router from 'next-router-mock'
import { NuqsAdapter } from 'nuqs/adapters/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PipelineCreationFlow as CreationFlow } from './PipelineCreationFlow'
import type { ReplicationCostEstimateData } from '@/data/replication/cost-estimate-query'
import { replicationKeys } from '@/data/replication/keys'
import { DOCS_URL } from '@/lib/constants'
import { PipelineRequestStatusProvider } from '@/state/replication-pipeline-request-status'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

vi.mock('@/components/layouts/Navigation/LayoutHeader/HomeIcon', () => ({
  HomeIcon: () => (
    <a tabIndex={0} href="/organizations">
      Supabase home
    </a>
  ),
}))
vi.mock('@/components/layouts/AppLayout/OrganizationDropdown', () => ({
  OrganizationDropdown: () => <span>Organisation</span>,
}))
vi.mock('@/components/layouts/Navigation/NavigationBar/OrgSelector', () => ({
  OrgSelector: () => <span>Organisation</span>,
}))
vi.mock('@/components/layouts/AppLayout/ProjectDropdown', () => ({
  ProjectDropdown: () => <span>Project</span>,
}))

const PipelineCreationFlow = (props: Parameters<typeof CreationFlow>[0]) => (
  <PipelineRequestStatusProvider>
    <CreationFlow {...props} />
  </PipelineRequestStatusProvider>
)

mockAnimationsApi()
beforeEach(() => {
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/sources/:source_id/publications/:publication_name/cost-estimate',
    response: () =>
      HttpResponse.json<ReplicationCostEstimateData>({
        currency: 'usd',
        pipeline: { hourly_cost: 0.05, monthly_cost: 36.5 },
        streaming: { rate_per_gb: 3 },
        table_copy: { rate_per_gb: 0.6, total_bytes: 0, total_cost: 0, tables: [] },
      }),
  })
  addAPIMock({
    method: 'post',
    path: '/platform/replication/:ref/destinations/validate',
    response: () =>
      HttpResponse.json<components['schemas']['ValidateDestinationResponse_Output']>({
        validation_failures: [],
      }),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/sources',
    response: () =>
      HttpResponse.json<components['schemas']['SourcesResponse_Output']>({
        sources: [
          {
            id: 1,
            name: 'default',
            tenant_id: 'tenant',
            config: { host: 'db.internal', port: 5432, name: 'postgres', username: 'postgres' },
          },
        ],
      }),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/v2/:ref/sources/:source_id/publications',
    response: () =>
      HttpResponse.json<components['schemas']['ReadPublicationsResponse_Output']>({
        publications: [{ name: 'analytics' }],
      }),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/v2/:ref/sources/:source_id/publications/:publication_name',
    response: () =>
      HttpResponse.json<components['schemas']['PublicationDetailsResponse_Output']>({
        name: 'analytics',
        config: {
          type: 'tables',
          tables: [],
          operations: ['insert'],
          publish_via_partition_root: false,
        },
        tables: [],
      }),
  })
})
const next = () => fireEvent.click(within(stepCard()).getByRole('button', { name: 'Continue' }))
const fillConnection = () => {
  const fields = [
    ['Pipeline name', 'Warehouse'],
    ['Project ID', 'my-project'],
    ['Dataset ID', 'dataset'],
    ['Service account key', '{}'],
  ] as const

  fields.forEach(([name, value]) => {
    fireEvent.change(screen.getByLabelText(name), { target: { value } })
  })
}
const stepStatus = () => screen.getByText(/^Step \d of 4/)
const isHtmlElement = (value: unknown): value is HTMLElement => value instanceof HTMLElement
const stepCard = () => {
  const card = stepStatus().nextElementSibling
  const isCard = isHtmlElement(card)

  if (!isCard) {
    throw new Error('step status is not followed by the step card')
  }

  return card
}
const waitForStep = (step: number) =>
  waitFor(() => expect(stepStatus()).toHaveTextContent(`Step ${step} of 4`))
const withinRegion = (name: string) => within(screen.getByRole('region', { name }))
const destinationType = () => within(screen.getByRole('radiogroup', { name: 'Destination type' }))
const continueToData = async () => {
  next()
  await waitForStep(3)
}
const selectPublication = async () => {
  fireEvent.click(screen.getByText('Select publication'))
  await waitFor(() => expect(screen.queryByText('analytics')).toBeInTheDocument())
  fireEvent.click(screen.getByText('analytics'))
}
const back = () => fireEvent.click(within(stepCard()).getByRole('button', { name: 'Back' }))

describe('PipelineCreationFlow', () => {
  it('keeps header navigation pending until dirty changes are discarded', async () => {
    const push = vi.spyOn(router, 'push')
    customRender(
      <PipelineCreationFlow availableDestinations={['BigQuery', 'Snowflake']} onClose={vi.fn()} />
    )
    fireEvent.click(destinationType().getByRole('radio', { name: /Snowflake/ }))
    fireEvent.click(screen.getByRole('link', { name: 'Supabase home' }))
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument()
    expect(push).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }))
    expect(push).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('link', { name: 'Supabase home' }))
    const discard = await screen.findByRole('button', { name: 'Discard changes' })
    fireEvent.click(discard)

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith(`${window.location.origin}/organizations`)
    )
    push.mockRestore()
  })

  it.each([
    ['BigQuery', 'bigquery#configure-bigquery-as-a-destination'],
    ['DuckLake', 'ducklake#choose-a-configuration-mode'],
    ['Snowflake', 'snowflake#prepare-snowflake-resources'],
    ['ClickHouse', 'clickhouse#configure-clickhouse-as-a-destination'],
  ] as const)('matches the connection subtitle and Docs to %s', (type, path) => {
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: () =>
        HttpResponse.json<components['schemas']['ProjectDetailResponse_Output']>({
          id: 1,
          ref: 'default',
          name: 'Test project',
          organization_id: 1,
          status: 'ACTIVE_HEALTHY',
          cloud_provider: 'AWS',
          region: 'us-east-1',
          db_host: 'db.default.supabase.co',
          restUrl: 'https://default.supabase.co/rest/v1/',
          connectionString: null,
          inserted_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
          subscription_id: 'subscription',
          is_branch_enabled: false,
          is_physical_backups_enabled: false,
          high_availability: false,
          integration_source: null,
        }),
    })
    customRender(
      <PipelineCreationFlow
        availableDestinations={['BigQuery', 'DuckLake', 'Snowflake', 'ClickHouse']}
        onClose={vi.fn()}
      />,
      { nuqs: { hasMemory: true } }
    )
    expect(screen.getByText('Where should this database be replicated?')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Docs' })).not.toBeInTheDocument()
    fireEvent.click(destinationType().getByRole('radio', { name: new RegExp(type) }))
    next()
    expect(
      screen.getByText(`Name this pipeline and enter credentials for ${type}.`)
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute(
      'href',
      `${DOCS_URL}/guides/database/replication/pipelines/${path}`
    )
    back()
    expect(screen.queryByRole('link', { name: 'Docs' })).not.toBeInTheDocument()
  })

  const reachReview = async (
    onClose = vi.fn(),
    onUrlUpdate = vi.fn(),
    queryClient?: QueryClient,
    shouldWaitForEstimate = true
  ) => {
    customRender(<PipelineCreationFlow availableDestinations={['BigQuery']} onClose={onClose} />, {
      nuqs: { hasMemory: true, rateLimitFactor: 1, onUrlUpdate },
      queryClient,
    })
    next()
    fillConnection()
    await continueToData()
    await selectPublication()
    next()
    await screen.findByText(/Step 4 of 4/)
    if (shouldWaitForEstimate)
      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Start pipeline' })).toBeEnabled()
      )
  }

  const mockCreation = ({ failCreate = false, failStart = false } = {}) => {
    const requests: unknown[] = []
    const starts = vi.fn()
    const destinationRequests: unknown[] = []
    const pipelineRequests: unknown[] = []
    addAPIMock({
      method: 'post',
      path: '/platform/replication/:ref/destinations/validate',
      response: async ({ request }) => {
        destinationRequests.push(await request.json())
        return HttpResponse.json<components['schemas']['ValidateDestinationResponse_Output']>({
          validation_failures: [],
        })
      },
    })
    addAPIMock({
      method: 'post',
      path: '/platform/replication/:ref/pipelines/validate',
      response: async ({ request }) => {
        pipelineRequests.push(await request.json())
        return HttpResponse.json<components['schemas']['ValidatePipelineResponse_Output']>({
          validation_failures: [],
        })
      },
    })
    addAPIMock({
      method: 'post',
      path: '/platform/replication/:ref/destinations-pipelines',
      response: async ({ request }) => {
        requests.push(await request.json())
        return failCreate && requests.length === 1
          ? HttpResponse.json<{ message: string }>(
              { message: 'Create unavailable' },
              { status: 503 }
            )
          : HttpResponse.json<components['schemas']['CreateDestinationPipelineResponse_Output']>({
              destination_id: 7,
              pipeline_id: 8,
            })
      },
    })
    addAPIMock({
      method: 'post',
      path: '/platform/replication/:ref/pipelines/:pipeline_id/start',
      response: () => {
        starts()
        return failStart
          ? HttpResponse.json<{ message: string }>(
              { message: 'Start unavailable' },
              { status: 503 }
            )
          : HttpResponse.json<Record<string, never>>({})
      },
    })
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/pipelines/:pipeline_id/status',
      response: () =>
        HttpResponse.json<components['schemas']['PipelineStatusResponse_Output']>({
          pipeline_id: 8,
          status: { name: 'stopped' },
        }),
    })
    return { requests, starts, destinationRequests, pipelineRequests }
  }

  it.each([
    [false, false],
    [true, false],
    [false, true],
    [true, true],
  ])(
    'places review failures and keeps the current position (connection: %s, warnings: %s)',
    async (hasConnectionFailure, hasWarnings) => {
      const { requests } = mockCreation()
      await reachReview()
      const validationStatus = screen.getByRole('status', { name: 'Pipeline validation status' })
      expect(validationStatus).toBeEmptyDOMElement()
      const scrollIntoView = vi.fn()
      vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(scrollIntoView)
      addAPIMock({
        method: 'post',
        path: '/platform/replication/:ref/destinations/validate',
        response: () =>
          HttpResponse.json<components['schemas']['ValidateDestinationResponse_Output']>({
            validation_failures: hasConnectionFailure
              ? [
                  {
                    name: 'Credentials',
                    reason: 'Check destination credentials.',
                    failure_type: 'critical',
                  },
                ]
              : [],
          }),
      })
      addAPIMock({
        method: 'post',
        path: '/platform/replication/:ref/pipelines/validate',
        response: () =>
          HttpResponse.json<components['schemas']['ValidatePipelineResponse_Output']>({
            validation_failures: [
              {
                name: 'Publication',
                reason: 'Check publication settings.',
                failure_type: 'critical',
              },
              ...(hasWarnings
                ? [
                    {
                      name: 'Retention',
                      reason: 'Review retention settings.',
                      failure_type: 'warning' as const,
                    },
                  ]
                : []),
            ],
          }),
      })
      fireEvent.click(screen.getByRole('button', { name: 'Start pipeline' }))
      await screen.findByText('Check publication settings.')
      expect(screen.getByRole('status', { name: 'Pipeline validation status' })).toBe(
        validationStatus
      )
      const connection = withinRegion('Connection review')
      const data = withinRegion('Data review')
      if (hasConnectionFailure)
        expect(connection.getByText('Check destination credentials.')).toBeInTheDocument()
      expect(connection.getByRole('button', { name: 'Edit connection' })).toBeInTheDocument()
      expect(connection.queryByText('Check publication settings.')).not.toBeInTheDocument()
      expect(data.getByText('Check publication settings.')).toBeInTheDocument()
      expect(data.getByRole('button', { name: 'Edit data' })).toBeInTheDocument()
      expect(
        screen.getByText(
          hasWarnings
            ? 'Fix the above issues and review warnings before starting the pipeline.'
            : 'Fix the above issues before starting the pipeline.'
        )
      ).toBeInTheDocument()
      expect(scrollIntoView).not.toHaveBeenCalled()
      expect(requests).toHaveLength(0)
    }
  )

  it.each([false, true])(
    'leaves after one committed creation, including start failure: %s',
    async (failStart) => {
      const { requests, starts, destinationRequests, pipelineRequests } = mockCreation({
        failStart,
      })
      const onClose = vi.fn()
      await reachReview(onClose)
      fireEvent.click(screen.getByRole('button', { name: 'Start pipeline' }))
      expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled()
      expect(screen.getByDisplayValue('Warehouse')).toBeDisabled()
      fireEvent.click(screen.getByRole('button', { name: 'Start pipeline' }))
      await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
      // Stay locked until the document leaves, even when starting failed.
      expect(screen.getByRole('button', { name: 'Start pipeline' })).toBeDisabled()
      fireEvent.click(screen.getByRole('button', { name: 'Start pipeline' }))
      expect(requests).toEqual([
        expect.objectContaining({
          source_id: 1,
          destination_name: 'Warehouse',
          destination_config: expect.objectContaining({
            big_query: expect.objectContaining({ project_id: 'my-project', dataset_id: 'dataset' }),
          }),
          pipeline_config: expect.objectContaining({ publication_name: 'analytics' }),
        }),
      ])
      expect(destinationRequests.at(-1)).toMatchObject({
        source_id: 1,
        pipeline_config: expect.objectContaining({ publication_name: 'analytics' }),
      })
      expect(pipelineRequests).toEqual([
        { source_id: 1, config: expect.objectContaining({ publication_name: 'analytics' }) },
      ])
      expect(starts).toHaveBeenCalledOnce()
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      const unload = new Event('beforeunload', { cancelable: true })
      window.dispatchEvent(unload)
      expect(unload.defaultPrevented).toBe(false)
    }
  )

  it('edits each section from Review without losing values', async () => {
    const onUrlUpdate = vi.fn()
    const waitForReview = () =>
      waitFor(() =>
        expect(onUrlUpdate).toHaveBeenLastCalledWith(
          expect.objectContaining({ queryString: '?step=review' })
        )
      )
    await reachReview(vi.fn(), onUrlUpdate)
    expect(screen.getByText('Check these details, then start the pipeline.')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Docs' })).not.toBeInTheDocument()
    await waitForReview()
    fireEvent.click(screen.getByRole('button', { name: 'Edit connection' }))
    await screen.findByText(/Step 2 of 4/)
    expect(screen.getByRole('textbox', { name: 'Pipeline name' })).toHaveValue('Warehouse')
    next()
    await screen.findByText(/Step 3 of 4/)
    expect(
      screen.getByText('Select a publication and which existing rows to copy during initial sync.')
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute(
      'href',
      `${DOCS_URL}/guides/database/replication/pipelines#choosing-which-tables-to-copy`
    )
    next()
    await waitForReview()
    fireEvent.click(screen.getByRole('button', { name: 'Edit data' }))
    await screen.findByText(/Step 3 of 4/)
    next()
    await waitForReview()
    fireEvent.click(screen.getByRole('button', { name: 'Edit destination' }))
    await screen.findByText(/Step 1 of 4/)
    next()
    await screen.findByText(/Step 2 of 4/)
    expect(screen.getByRole('textbox', { name: 'Pipeline name' })).toHaveValue('Warehouse')
  })

  it('preserves reviewed values when creation fails and retries safely', async () => {
    const { requests, starts } = mockCreation({ failCreate: true })
    const onClose = vi.fn()
    await reachReview(onClose)
    fireEvent.click(screen.getByRole('button', { name: 'Start pipeline' }))
    await waitFor(() => expect(requests).toHaveLength(1))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Start pipeline' })).toBeEnabled()
    )
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByDisplayValue('Warehouse')).toBeInTheDocument()
    expect(starts).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Start pipeline' }))
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
    expect(requests).toHaveLength(2)
    expect(requests[1]).toEqual(requests[0])
    expect(starts).toHaveBeenCalledOnce()
  })

  it('blocks critical final validation and requires confirmation for warnings', async () => {
    const { requests, destinationRequests } = mockCreation()
    const onClose = vi.fn()
    await reachReview(onClose)
    let validationRequests = 0
    let failure_type: 'critical' | 'warning' = 'critical'
    let reason = 'Check the publication.'
    addAPIMock({
      method: 'post',
      path: '/platform/replication/:ref/pipelines/validate',
      response: () => {
        validationRequests++
        return HttpResponse.json<components['schemas']['ValidatePipelineResponse_Output']>({
          validation_failures: [{ name: 'Publication issue', reason, failure_type }],
        })
      },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Start pipeline' }))
    expect(await screen.findByText('Check the publication.')).toBeInTheDocument()
    expect(requests).toHaveLength(0)
    expect(onClose).not.toHaveBeenCalled()
    failure_type = 'warning'
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Start pipeline' })).toBeEnabled()
    )
    fireEvent.click(screen.getByRole('button', { name: 'Start pipeline' }))
    await screen.findByRole('button', { name: 'Start pipeline anyway' })
    expect(
      screen.getByText('Review the warnings above before starting the pipeline.')
    ).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Start pipeline anyway' })).toBeEnabled()
    )
    expect(screen.getByText('Check the publication.')).toBeInTheDocument()
    expect(requests).toHaveLength(0)
    back()
    back()
    fireEvent.change(screen.getByRole('textbox', { name: 'Pipeline name' }), {
      target: { value: 'Updated warehouse' },
    })
    next()
    await screen.findByText(/Step 3 of 4/)
    next()
    await screen.findByText(/Step 4 of 4/)
    expect(screen.queryByText('Check the publication.')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Start pipeline' }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Start pipeline anyway' })).toBeEnabled()
    )
    const validatedDestinations = destinationRequests.length
    const validatedPipelines = validationRequests
    fireEvent.click(screen.getByRole('button', { name: 'Start pipeline anyway' }))
    expect(screen.getByText('Check the publication.')).toBeInTheDocument()
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
    expect(requests).toHaveLength(1)
    expect(destinationRequests).toHaveLength(validatedDestinations)
    expect(validationRequests).toBe(validatedPipelines)
  })

  it('retains Review and retries after a final validation request fails', async () => {
    const { requests } = mockCreation()
    const onClose = vi.fn()
    await reachReview(onClose)
    let shouldFail = true
    addAPIMock({
      method: 'post',
      path: '/platform/replication/:ref/pipelines/validate',
      response: () =>
        shouldFail
          ? HttpResponse.json<{ message: string }>(
              { message: 'Validation unavailable' },
              { status: 503 }
            )
          : HttpResponse.json<components['schemas']['ValidatePipelineResponse_Output']>({
              validation_failures: [],
            }),
    })
    fireEvent.click(screen.getByRole('button', { name: 'Start pipeline' }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Start pipeline' })).toBeDisabled()
    )
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Start pipeline' })).toBeEnabled()
    )
    expect(screen.getByText(/Step 4 of 4/)).toBeInTheDocument()
    expect(screen.getByDisplayValue('Warehouse')).toBeInTheDocument()
    expect(requests).toHaveLength(0)
    shouldFail = false
    fireEvent.click(screen.getByRole('button', { name: 'Start pipeline' }))
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
    expect(requests).toHaveLength(1)
  })

  it('returns to Data when a publication is removed after review', async () => {
    const { requests } = mockCreation()
    await reachReview()
    addAPIMock({
      method: 'get',
      path: '/platform/replication/v2/:ref/sources/:source_id/publications',
      response: () =>
        HttpResponse.json<components['schemas']['ReadPublicationsResponse_Output']>({
          publications: [],
        }),
    })
    fireEvent.click(screen.getByRole('button', { name: 'Start pipeline' }))
    await screen.findByText(/Step 3 of 4/)
    expect(requests).toHaveLength(0)
  })

  it('requires connection fields and reveals invalid advanced settings', async () => {
    customRender(<PipelineCreationFlow availableDestinations={['BigQuery']} onClose={vi.fn()} />, {
      nuqs: { hasMemory: true },
    })
    next()
    const connection = withinRegion('Destination connection')
    fireEvent.click(connection.getByRole('button', { name: /Advanced settings/ }))
    fireEvent.change(connection.getByRole('spinbutton', { name: 'Connection pool size' }), {
      target: { value: '-1' },
    })
    fireEvent.click(connection.getByRole('button', { name: /Advanced settings/ }))
    fireEvent.click(within(stepCard()).getByRole('button', { name: 'Continue' }))
    await waitFor(() =>
      expect(screen.queryAllByText(/Project ID is required\./).length).toBeGreaterThan(0)
    )
    expect(connection.getByRole('spinbutton', { name: 'Connection pool size' })).toBeVisible()
    fireEvent.click(connection.getByRole('button', { name: /Advanced settings/ }))
    expect(
      connection.queryByRole('spinbutton', { name: 'Connection pool size' })
    ).not.toBeInTheDocument()
    fireEvent.click(within(stepCard()).getByRole('button', { name: 'Continue' }))
    expect(connection.getByRole('spinbutton', { name: 'Connection pool size' })).toBeVisible()
    fireEvent.change(connection.getByRole('spinbutton', { name: 'Connection pool size' }), {
      target: { value: '5' },
    })
    expect(screen.queryByText('Check connection settings')).not.toBeInTheDocument()
  })

  it('recovers from request and critical failures and reviews warnings before continuing', async () => {
    let attempt = 0
    const requests: unknown[] = []
    addAPIMock({
      method: 'post',
      path: '/platform/replication/:ref/destinations/validate',
      response: async ({ request }) => {
        requests.push(await request.json())
        await delay(10)
        attempt++
        if (attempt === 1)
          return HttpResponse.json<{ message: string }>({ message: 'Try again' }, { status: 500 })
        return HttpResponse.json<components['schemas']['ValidateDestinationResponse_Output']>({
          validation_failures: [
            {
              name: 'Credentials',
              reason: 'Check credentials',
              failure_type: attempt === 2 ? 'critical' : 'warning',
            },
          ],
        })
      },
    })
    customRender(
      <PipelineCreationFlow availableDestinations={['BigQuery', 'Snowflake']} onClose={vi.fn()} />,
      {
        nuqs: { hasMemory: true },
      }
    )
    next()
    fillConnection()
    fireEvent.click(within(stepCard()).getByRole('button', { name: 'Continue' }))
    expect(within(stepCard()).getByRole('button', { name: 'Back' })).toBeDisabled()
    await waitFor(() => expect(screen.queryByText('Try again')).toBeInTheDocument())
    fireEvent.change(screen.getByLabelText('Project ID'), {
      target: { value: 'retry-project' },
    })
    expect(screen.getByText('Try again')).toBeInTheDocument()
    back()
    fireEvent.click(destinationType().getByRole('radio', { name: /Snowflake/ }))
    next()
    expect(screen.queryByText('Try again')).not.toBeInTheDocument()
    back()
    fireEvent.click(destinationType().getByRole('radio', { name: /BigQuery/ }))
    next()
    expect(screen.queryByText('Try again')).not.toBeInTheDocument()
    fireEvent.click(within(stepCard()).getByRole('button', { name: 'Continue' }))
    await waitFor(() => expect(screen.queryByText('Check credentials')).toBeInTheDocument())
    await waitFor(() =>
      expect(within(stepCard()).queryByRole('button', { name: 'Continue' })).not.toBeDisabled()
    )
    fireEvent.change(screen.getByLabelText('Project ID'), {
      target: { value: 'edited-project' },
    })
    expect(screen.getByText('Check credentials')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Project ID'), {
      target: { value: 'retry-project' },
    })
    expect(screen.getByText('Check credentials')).toBeInTheDocument()
    fireEvent.click(within(stepCard()).getByRole('button', { name: 'Continue' }))
    await waitFor(() => expect(screen.queryByText(/Replication can start/)).toBeInTheDocument())
    expect(screen.getByText(/Step 2 of 4/)).toBeInTheDocument()
    expect(requests[2]).not.toHaveProperty('pipeline_config')
    expect(requests[2]).not.toHaveProperty('source_id')
  })

  it('invalidates connection verification after edits and ignores stale responses', async () => {
    addAPIMock({
      method: 'post',
      path: '/platform/replication/:ref/destinations/validate',
      response: async () => {
        await delay(10)
        return HttpResponse.json<components['schemas']['ValidateDestinationResponse_Output']>({
          validation_failures: [
            { name: 'Credentials', reason: 'Check credentials', failure_type: 'warning' },
          ],
        })
      },
    })
    customRender(<PipelineCreationFlow availableDestinations={['BigQuery']} onClose={vi.fn()} />, {
      nuqs: { hasMemory: true },
    })
    next()
    fillConnection()
    next()
    await waitFor(() => expect(screen.queryByText(/Replication can start/)).toBeInTheDocument())
    fireEvent.change(screen.getByLabelText('Project ID'), {
      target: { value: 'changed' },
    })
    expect(within(stepCard()).getByRole('button', { name: 'Continue' })).toBeInTheDocument()
    expect(screen.queryByText('Check credentials')).not.toBeInTheDocument()
    fireEvent.click(within(stepCard()).getByRole('button', { name: 'Continue' }))
    fireEvent.change(screen.getByLabelText('Project ID'), {
      target: { value: 'changed-during-test' },
    })
    await waitFor(() =>
      expect(within(stepCard()).queryByRole('button', { name: 'Continue' })).not.toBeDisabled()
    )
    expect(screen.getByText(/Step 2 of 4/)).toBeInTheDocument()
    expect(screen.queryByText(/Replication can start/)).not.toBeInTheDocument()
  })

  it('uses browser Back and Forward to revisit steps without losing values', async () => {
    window.history.replaceState(null, '', '/project/default/database/pipelines/new')
    customRender(
      <NuqsAdapter>
        <PipelineCreationFlow availableDestinations={['BigQuery']} onClose={vi.fn()} />
      </NuqsAdapter>
    )
    next()
    await waitFor(() => expect(window.location.search).toBe('?step=connection'))
    fireEvent.change(screen.getByLabelText('Project ID'), {
      target: { value: 'history-project' },
    })
    fillConnection()
    await continueToData()
    await waitFor(() => expect(window.location.search).toBe('?step=data'))
    await act(async () => {
      await new Promise<void>((resolve) => {
        window.addEventListener('popstate', () => resolve(), { once: true })
        window.history.back()
      })
    })
    expect(screen.getByText(/Step 2 of 4/)).toBeInTheDocument()
    expect(screen.getByLabelText('Project ID')).toHaveValue('my-project')
    await act(async () => {
      await new Promise<void>((resolve) => {
        window.addEventListener('popstate', () => resolve(), { once: true })
        window.history.forward()
      })
    })
    expect(screen.getByText(/Step 3 of 4/)).toBeInTheDocument()
    await act(async () => {
      await new Promise<void>((resolve) => {
        window.addEventListener('popstate', () => resolve(), { once: true })
        window.history.back()
      })
    })
    await waitFor(() => expect(window.location.search).toBe('?step=connection'))
    expect(screen.getByLabelText('Project ID')).toHaveValue('my-project')
    fireEvent.change(screen.getByLabelText('Project ID'), {
      target: { value: 'changed-project' },
    })
    await act(async () => {
      await new Promise<void>((resolve) => {
        window.addEventListener('popstate', () => resolve(), { once: true })
        window.history.forward()
      })
    })
    await waitFor(() => expect(window.location.search).toBe('?step=connection'))
    expect(within(stepCard()).getByRole('button', { name: 'Continue' })).toBeInTheDocument()
  })

  it.each(['connection', 'data', 'review', 'invalid'])(
    'starts a fresh session at Destination for step=%s',
    async (step) => {
      window.history.replaceState(null, '', `/project/default/database/pipelines/new?step=${step}`)
      customRender(
        <NuqsAdapter>
          <PipelineCreationFlow availableDestinations={['BigQuery']} onClose={vi.fn()} />
        </NuqsAdapter>
      )
      await waitFor(() => expect(window.location.search).toBe(''))
      expect(screen.getByText(/Step 1 of 4/)).toBeInTheDocument()
    }
  )

  it('preserves connection and data values across destination changes', async () => {
    const onUrlUpdate = vi.fn()
    customRender(
      <PipelineCreationFlow availableDestinations={['BigQuery', 'Snowflake']} onClose={vi.fn()} />,
      { nuqs: { hasMemory: true, rateLimitFactor: 1, onUrlUpdate } }
    )
    expect(screen.getByText(/Step [1-4] of 4/)).toHaveTextContent('Step 1 of 4')
    next()
    fireEvent.change(screen.getByLabelText('Pipeline name'), {
      target: { value: 'Warehouse' },
    })
    fireEvent.change(screen.getByLabelText('Project ID'), {
      target: { value: 'my-project' },
    })
    fillConnection()
    await continueToData()
    expect(screen.getByText(/Step [1-4] of 4/)).toHaveTextContent('Step 3 of 4')
    const data = withinRegion('Data')
    fireEvent.click(data.getByRole('button', { name: /Advanced settings/ }))
    fireEvent.change(data.getByRole('spinbutton', { name: 'Batch wait time' }), {
      target: { value: '750' },
    })
    // Wait for the URL write, not just the optimistic step render, before going back.
    await waitFor(() =>
      expect(onUrlUpdate).toHaveBeenLastCalledWith(
        expect.objectContaining({ queryString: '?step=data' })
      )
    )
    back()
    await waitFor(() =>
      expect(onUrlUpdate).toHaveBeenLastCalledWith(
        expect.objectContaining({ queryString: '?step=connection' })
      )
    )
    expect(screen.getByLabelText('Project ID')).toHaveValue('my-project')
    back()
    await waitFor(() =>
      expect(onUrlUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ queryString: '' }))
    )
    fireEvent.click(destinationType().getByRole('radio', { name: /Snowflake/ }))
    next()
    await waitFor(() =>
      expect(onUrlUpdate).toHaveBeenLastCalledWith(
        expect.objectContaining({ queryString: '?step=connection' })
      )
    )
    expect(screen.getByLabelText('Pipeline name')).toHaveValue('Warehouse')
    back()
    await waitFor(() =>
      expect(onUrlUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ queryString: '' }))
    )
    fireEvent.click(destinationType().getByRole('radio', { name: /BigQuery/ }))
    next()
    await waitFor(() =>
      expect(onUrlUpdate).toHaveBeenLastCalledWith(
        expect.objectContaining({ queryString: '?step=connection' })
      )
    )
    expect(screen.getByLabelText('Project ID')).toHaveValue('my-project')
    await continueToData()
    const dataAfterReturn = withinRegion('Data')
    fireEvent.click(dataAfterReturn.getByRole('button', { name: /Advanced settings/ }))
    expect(dataAfterReturn.getByRole('spinbutton', { name: 'Batch wait time' })).toHaveValue(750)
  })

  it('preserves data values across steps and reaches Review', async () => {
    const onUrlUpdate = vi.fn()
    customRender(
      <PipelineCreationFlow availableDestinations={['BigQuery', 'Snowflake']} onClose={vi.fn()} />,
      { nuqs: { hasMemory: true, rateLimitFactor: 1, onUrlUpdate } }
    )
    next()
    fireEvent.change(screen.getByLabelText('Pipeline name'), {
      target: { value: 'Warehouse' },
    })
    fillConnection()
    await continueToData()
    const data = withinRegion('Data')
    fireEvent.click(data.getByRole('button', { name: /Advanced settings/ }))
    fireEvent.change(data.getByRole('spinbutton', { name: 'Batch wait time' }), {
      target: { value: '750' },
    })
    // Wait for the URL write, not just the optimistic step render, before going back.
    await waitFor(() =>
      expect(onUrlUpdate).toHaveBeenLastCalledWith(
        expect.objectContaining({ queryString: '?step=data' })
      )
    )
    back()
    await waitFor(() =>
      expect(onUrlUpdate).toHaveBeenLastCalledWith(
        expect.objectContaining({ queryString: '?step=connection' })
      )
    )
    await continueToData()
    const dataAfterReturn = withinRegion('Data')
    fireEvent.click(dataAfterReturn.getByRole('button', { name: /Advanced settings/ }))
    expect(dataAfterReturn.getByRole('spinbutton', { name: 'Batch wait time' })).toHaveValue(750)
    await selectPublication()
    next()
    await waitForStep(4)
    await waitFor(() =>
      expect(within(stepCard()).getByRole('button', { name: 'Start pipeline' })).toBeEnabled()
    )
    expect(screen.getByDisplayValue('Warehouse')).toBeInTheDocument()
  })

  it('shows one publication loading failure before Continue and clears it after a successful retry', async () => {
    let shouldFail = true
    addAPIMock({
      method: 'get',
      path: '/platform/replication/v2/:ref/sources/:source_id/publications/:publication_name',
      response: () =>
        shouldFail
          ? HttpResponse.json<{ message: string }>({ message: 'Unavailable' }, { status: 503 })
          : HttpResponse.json<components['schemas']['PublicationDetailsResponse_Output']>({
              name: 'analytics',
              config: {
                type: 'tables',
                tables: [],
                operations: ['insert'],
                publish_via_partition_root: false,
              },
              tables: [],
            }),
    })
    customRender(<PipelineCreationFlow availableDestinations={['BigQuery']} onClose={vi.fn()} />, {
      nuqs: { hasMemory: true },
    })
    next()
    fillConnection()
    await continueToData()
    await selectPublication()
    await screen.findByText('Publication tables could not be loaded')
    fireEvent.click(withinRegion('Data').getByRole('button', { name: /Advanced settings/ }))
    expect(screen.queryByText('Table settings could not be loaded')).not.toBeInTheDocument()
    expect(screen.queryByText(/Partition handling could not be loaded/)).not.toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getAllByText('Publication tables could not be loaded')).toHaveLength(1)
    )
    expect(screen.getByText('Click Continue to try again.')).toBeInTheDocument()
    expect(screen.queryByText(/Refresh the page before changing/)).not.toBeInTheDocument()
    next()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled())
    await waitFor(() =>
      expect(screen.getAllByText('Publication tables could not be loaded')).toHaveLength(1)
    )
    shouldFail = false
    next()
    await waitForStep(4)
    expect(screen.queryByText('Publication tables could not be loaded')).not.toBeInTheDocument()
  })

  it('asks for another publication when the selected publication was deleted', async () => {
    customRender(<PipelineCreationFlow availableDestinations={['BigQuery']} onClose={vi.fn()} />, {
      nuqs: { hasMemory: true },
    })
    next()
    fillConnection()
    await continueToData()
    await selectPublication()
    addAPIMock({
      method: 'get',
      path: '/platform/replication/v2/:ref/sources/:source_id/publications',
      response: () =>
        HttpResponse.json<components['schemas']['ReadPublicationsResponse_Output']>({
          publications: [],
        }),
    })
    addAPIMock({
      method: 'get',
      path: '/platform/replication/v2/:ref/sources/:source_id/publications/:publication_name',
      response: () =>
        HttpResponse.json<{ message: string }>({ message: 'Not found' }, { status: 404 }),
    })
    next()
    await screen.findByText('The publication analytics was not found.')
    await screen.findByText('Select an available publication.')
    expect(screen.queryByText('Publication tables could not be loaded')).not.toBeInTheDocument()
    expect(screen.queryByText('Click Continue to try again.')).not.toBeInTheDocument()
    expect(stepStatus()).toHaveTextContent('Step 3 of 4')
  })

  it('blocks incomplete data, retries metadata failures, and reveals invalid advanced settings', async () => {
    const onUrlUpdate = vi.fn()
    customRender(<PipelineCreationFlow availableDestinations={['BigQuery']} onClose={vi.fn()} />, {
      nuqs: { hasMemory: true, rateLimitFactor: 1, onUrlUpdate },
    })
    next()
    fillConnection()
    await continueToData()
    next()
    await waitFor(() =>
      expect(screen.queryByText('Select an available publication.')).toBeInTheDocument()
    )
    await selectPublication()
    await waitFor(() =>
      expect(screen.queryByText('Select an available publication.')).not.toBeInTheDocument()
    )
    const data = withinRegion('Data')
    fireEvent.click(data.getByRole('button', { name: /Advanced settings/ }))
    fireEvent.change(data.getByRole('spinbutton', { name: 'Batch wait time' }), {
      target: { value: '-1' },
    })
    fireEvent.click(data.getByRole('button', { name: /Advanced settings/ }))
    next()
    await waitFor(() =>
      expect(data.queryByRole('spinbutton', { name: 'Batch wait time' })).toBeVisible()
    )
    expect(screen.getByText('Check data settings')).toBeInTheDocument()
    fireEvent.change(data.getByRole('spinbutton', { name: 'Batch wait time' }), {
      target: { value: '750' },
    })
    expect(screen.queryByText('Check data settings')).not.toBeInTheDocument()
    let shouldFail = true
    addAPIMock({
      method: 'get',
      path: '/platform/replication/v2/:ref/sources/:source_id/publications',
      response: () =>
        shouldFail
          ? HttpResponse.json<{ message: string }>({ message: 'Unavailable' }, { status: 500 })
          : HttpResponse.json<components['schemas']['ReadPublicationsResponse_Output']>({
              publications: [{ name: 'analytics' }],
            }),
    })
    next()
    await waitFor(() =>
      expect(screen.queryByText('Click Continue to try again.')).toBeInTheDocument()
    )
    shouldFail = false
    next()
    await waitForStep(4)
    // Wait for the URL write, not just the optimistic step render, before going back.
    await waitFor(() =>
      expect(onUrlUpdate).toHaveBeenLastCalledWith(
        expect.objectContaining({ queryString: '?step=review' })
      )
    )
    await act(async () => back())
    const dataAfterReturn = withinRegion('Data')
    const advancedSettings = await waitFor(() => {
      const button = dataAfterReturn.queryByRole('button', { name: /Advanced settings/ })
      expect(button).toBeInTheDocument()

      if (!isHtmlElement(button)) {
        throw new Error('advanced settings button is missing')
      }

      return button
    })
    fireEvent.click(advancedSettings)
    expect(dataAfterReturn.getByRole('spinbutton', { name: 'Batch wait time' })).toHaveValue(750)
  })

  it('blocks browser Forward to Review after data changes', async () => {
    window.history.replaceState(null, '', '/project/default/database/pipelines/new')
    customRender(
      <NuqsAdapter>
        <PipelineCreationFlow availableDestinations={['BigQuery']} onClose={vi.fn()} />
      </NuqsAdapter>
    )
    next()
    await waitFor(() => expect(window.location.search).toBe('?step=connection'))
    fillConnection()
    await continueToData()
    await waitFor(() => expect(screen.queryByText('Select publication')).toBeInTheDocument())
    await selectPublication()
    next()
    await waitFor(() => expect(window.location.search).toBe('?step=review'))
    await act(async () => {
      await new Promise<void>((resolve) => {
        window.addEventListener('popstate', () => resolve(), { once: true })
        window.history.back()
      })
    })
    const data = withinRegion('Data')
    fireEvent.click(data.getByRole('button', { name: /Advanced settings/ }))
    fireEvent.change(data.getByRole('spinbutton', { name: 'Batch wait time' }), {
      target: { value: '-1' },
    })
    await act(async () => {
      await new Promise<void>((resolve) => {
        window.addEventListener('popstate', () => resolve(), { once: true })
        window.history.forward()
      })
    })
    await waitFor(() => expect(window.location.search).toBe('?step=data'))
    expect(withinRegion('Data').getByRole('spinbutton', { name: 'Batch wait time' })).toHaveValue(
      -1
    )
  })

  it('confirms destination-only changes and treats a reverted selection as pristine', async () => {
    const onClose = vi.fn()
    customRender(
      <PipelineCreationFlow availableDestinations={['BigQuery', 'Snowflake']} onClose={onClose} />
    )
    fireEvent.click(destinationType().getByRole('radio', { name: /Snowflake/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeInTheDocument())
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }))
    fireEvent.click(destinationType().getByRole('radio', { name: /BigQuery/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('confirms dirty dismissal and allows keeping the form', async () => {
    const onClose = vi.fn()
    customRender(<PipelineCreationFlow availableDestinations={['BigQuery']} onClose={onClose} />, {
      nuqs: { hasMemory: true },
    })
    next()
    fireEvent.change(screen.getByLabelText('Pipeline name'), {
      target: { value: 'Keep me' },
    })
    const unload = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(unload)
    expect(unload.defaultPrevented).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }))
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('link', { name: 'Supabase home' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeInTheDocument())
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }))
    expect(screen.getByLabelText('Pipeline name')).toHaveValue('Keep me')
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    const discardChanges = await waitFor(() => {
      const button = screen.queryByRole('button', { name: 'Discard changes' })
      expect(button).toBeInTheDocument()

      if (!isHtmlElement(button)) {
        throw new Error('discard changes button is missing')
      }

      return button
    })
    fireEvent.click(discardChanges)
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
    const confirmedUnload = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(confirmedUnload)
    expect(confirmedUnload.defaultPrevented).toBe(false)
  })

  it('closes a pristine form and blocks progression without destinations', () => {
    const onClose = vi.fn()
    customRender(<PipelineCreationFlow availableDestinations={[]} onClose={onClose} />)
    expect(within(stepCard()).getByRole('button', { name: 'Continue' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it.each(['success', 'error'] as const)(
    'waits for the initial cost estimate and permits starting after %s',
    async (result) => {
      const { requests } = mockCreation()
      let finishEstimate = () => {}
      const gate = new Promise<void>((resolve) => {
        finishEstimate = resolve
      })
      addAPIMock({
        method: 'get',
        path: '/platform/replication/:ref/sources/:source_id/publications/:publication_name/cost-estimate',
        response: async () => {
          await gate
          if (result === 'error')
            return HttpResponse.json<{ message: string }>(
              { message: 'Estimate unavailable' },
              { status: 503 }
            )
          return HttpResponse.json<ReplicationCostEstimateData>({
            currency: 'usd',
            pipeline: { hourly_cost: 0.05, monthly_cost: 36.5 },
            streaming: { rate_per_gb: 3 },
            table_copy: { rate_per_gb: 0.6, total_bytes: 0, total_cost: 0, tables: [] },
          })
        },
      })
      await reachReview(vi.fn(), vi.fn(), undefined, false)
      const start = screen.getByRole('button', { name: 'Start pipeline' })
      expect(start).toBeDisabled()
      fireEvent.click(start)
      expect(requests).toHaveLength(0)
      expect(screen.getByRole('button', { name: 'Back' })).toBeEnabled()
      finishEstimate()
      await waitFor(() => expect(start).toBeEnabled())
      if (result === 'error')
        expect(screen.getByText(/A cost estimate is unavailable/)).toBeInTheDocument()
      fireEvent.click(start)
      await waitFor(() => expect(requests).toHaveLength(1))
    }
  )

  it('keeps starting available during a background cost refresh with a cached estimate', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const key = replicationKeys.costEstimate('default', 1, 'analytics')
    queryClient.setQueryData<ReplicationCostEstimateData>(key, {
      currency: 'usd',
      pipeline: { hourly_cost: 0.05, monthly_cost: 36.5 },
      streaming: { rate_per_gb: 3 },
      table_copy: { rate_per_gb: 0.6, total_bytes: 0, total_cost: 0, tables: [] },
    })
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/sources/:source_id/publications/:publication_name/cost-estimate',
      response: async () => {
        await delay('infinite')
        return HttpResponse.json<ReplicationCostEstimateData>({
          currency: 'usd',
          pipeline: { hourly_cost: 0.05, monthly_cost: 36.5 },
          streaming: { rate_per_gb: 3 },
          table_copy: { rate_per_gb: 0.6, total_bytes: 0, total_cost: 0, tables: [] },
        })
      },
    })
    await reachReview(vi.fn(), vi.fn(), queryClient)
    await waitFor(() => expect(queryClient.getQueryState(key)?.fetchStatus).toBe('fetching'))
    expect(screen.getByRole('button', { name: 'Start pipeline' })).toBeEnabled()
    expect(screen.getByRole('heading', { name: 'Initial sync' })).toBeInTheDocument()
  })
})
