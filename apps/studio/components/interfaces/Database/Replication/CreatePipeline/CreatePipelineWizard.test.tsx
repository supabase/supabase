import { fireEvent, screen, waitFor } from '@testing-library/react'
import type { components } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { http, HttpResponse } from 'msw'
import { beforeEach, expect, test, vi } from 'vitest'

import { CreatePipelineWizard } from './CreatePipelineWizard'
import { PipelineRequestStatusProvider } from '@/state/replication-pipeline-request-status'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, mswServer, type APIErrorBody } from '@/tests/lib/msw'

mockAnimationsApi()

vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  useParams: () => ({ ref: 'default' }),
  useIsLoggedIn: () => false,
  useFeatureFlags: () => ({ configcat: { etlEnable: true } }),
}))

vi.mock('../useIsETLPrivateAlpha', () => ({
  useIsETLPrivateAlpha: () => true,
  useIsETLBigQueryPrivateAlpha: () => true,
  useIsETLClickHousePrivateAlpha: () => true,
  useIsETLDucklakePrivateAlpha: () => false,
  useIsETLSnowflakePrivateAlpha: () => false,
  useIsETLIcebergPrivateAlpha: () => true,
}))

beforeEach(() => {
  mswServer.use(
    http.get('http://localhost:3000/api/enabled-features-overrides', () =>
      HttpResponse.json<{ disabled_features: string[] }>({ disabled_features: [] })
    )
  )
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/destinations',
    response: () =>
      HttpResponse.json<components['schemas']['DestinationsResponse_Output']>({ destinations: [] }),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: () => HttpResponse.json<APIErrorBody>({ message: 'Unavailable' }, { status: 404 }),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref/settings',
    response: () => HttpResponse.json<APIErrorBody>({ message: 'Unavailable' }, { status: 404 }),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/sources',
    response: () =>
      HttpResponse.json<components['schemas']['SourcesResponse_Output']>({
        sources: [
          {
            id: 42,
            name: 'default',
            tenant_id: 'tenant',
            config: { host: 'localhost', port: 5432, name: 'postgres', username: 'postgres' },
          },
        ],
      }),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/pipelines',
    response: () =>
      HttpResponse.json<components['schemas']['PipelinesResponse_Output']>({ pipelines: [] }),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/v2/:ref/sources/:source_id/publications',
    response: () =>
      HttpResponse.json<components['schemas']['ReadPublicationsResponse_Output']>({
        publications: [],
      }),
  })
})

test('keeps the pipeline name when switching destination', async () => {
  customRender(
    <PipelineRequestStatusProvider>
      <CreatePipelineWizard />
    </PipelineRequestStatusProvider>,
    {
      nuqs: { searchParams: '?destinationType=BigQuery', hasMemory: true },
    }
  )
  fireEvent.click(await screen.findByRole('button', { name: 'Continue' }))
  const name = await screen.findByRole('textbox', { name: 'Pipeline name' })
  fireEvent.change(name, { target: { value: 'My analytics' } })
  fireEvent.click(screen.getByRole('button', { name: 'Back' }))
  fireEvent.click(await screen.findByRole('radio', { name: /ClickHouse/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
  await waitFor(() =>
    expect(screen.getByRole('textbox', { name: 'Pipeline name' })).toHaveValue('My analytics')
  )
  expect(screen.getByRole('button', { name: 'Test connection' })).toBeInTheDocument()
  expect(screen.queryByText('Ready to continue')).not.toBeInTheDocument()
})

test('requires retesting after changing a verified ClickHouse password', async () => {
  const testedConfigs: unknown[] = []
  addAPIMock({
    method: 'post',
    path: '/platform/replication/:ref/destinations/validate',
    response: async ({ request }) => {
      testedConfigs.push(await request.json())
      return HttpResponse.json<components['schemas']['ValidateDestinationResponse_Output']>({
        validation_failures: [],
      })
    },
  })
  customRender(
    <PipelineRequestStatusProvider>
      <CreatePipelineWizard />
    </PipelineRequestStatusProvider>,
    {
      nuqs: { searchParams: '?destinationType=ClickHouse&step=connection', hasMemory: true },
    }
  )
  fireEvent.change(await screen.findByRole('textbox', { name: 'Pipeline name' }), {
    target: { value: 'Live analytics' },
  })
  fireEvent.change(screen.getByRole('textbox', { name: 'HTTPS endpoint' }), {
    target: { value: 'https://example.clickhouse.cloud:8443' },
  })
  fireEvent.change(screen.getByRole('textbox', { name: 'User' }), { target: { value: 'default' } })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'first-password' } })
  fireEvent.change(screen.getByRole('textbox', { name: 'Database' }), {
    target: { value: 'analytics' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Test connection' }))
  expect(await screen.findByText('Ready to continue')).toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'second-password' } })
  expect(screen.queryByText('Ready to continue')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Test connection' }))
  expect(await screen.findByText('Ready to continue')).toBeInTheDocument()
  expect(testedConfigs).toEqual([
    {
      config: {
        clickhouse: {
          url: 'https://example.clickhouse.cloud:8443',
          user: 'default',
          password: 'first-password',
          database: 'analytics',
          engine: 'replacing_merge_tree',
        },
      },
    },
    {
      config: {
        clickhouse: {
          url: 'https://example.clickhouse.cloud:8443',
          user: 'default',
          password: 'second-password',
          database: 'analytics',
          engine: 'replacing_merge_tree',
        },
      },
    },
  ])
})

test('a disabled destination in the URL cannot bypass selection', async () => {
  customRender(
    <PipelineRequestStatusProvider>
      <CreatePipelineWizard />
    </PipelineRequestStatusProvider>,
    {
      nuqs: { searchParams: '?destinationType=Snowflake&step=review', hasMemory: true },
    }
  )
  expect(await screen.findByRole('heading', { name: 'Choose a destination' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled()
  expect(screen.queryByRole('radio', { name: /Analytics Bucket/ })).not.toBeInTheDocument()
})

test.each(['data', 'connection'] as const)(
  'keeps final %s validation failures on Review with an edit path',
  async (failureStep) => {
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
            type: 'all_tables',
            operations: ['insert', 'update', 'delete', 'truncate'],
            publish_via_partition_root: false,
          },
          tables: [],
        }),
    })
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/sources/:source_id/publications/:publication_name/cost-estimate',
      response: () => HttpResponse.json<APIErrorBody>({ message: 'Unavailable' }, { status: 503 }),
    })
    addAPIMock({
      method: 'post',
      path: '/platform/replication/:ref/destinations/validate',
      response: async ({ request }) => {
        const body = await request.json()
        const isFinalValidation = typeof body === 'object' && body !== null && 'source_id' in body
        return HttpResponse.json<components['schemas']['ValidateDestinationResponse_Output']>({
          validation_failures:
            failureStep === 'connection' && isFinalValidation
              ? [
                  {
                    name: 'Access revoked',
                    reason: 'Restore destination access.',
                    failure_type: 'critical',
                  },
                ]
              : [],
        })
      },
    })
    addAPIMock({
      method: 'post',
      path: '/platform/replication/:ref/pipelines/validate',
      response: () =>
        HttpResponse.json<components['schemas']['ValidatePipelineResponse_Output']>({
          validation_failures:
            failureStep === 'data'
              ? [
                  {
                    name: 'Invalid publication',
                    reason: 'Choose a different publication.',
                    failure_type: 'critical',
                  },
                ]
              : [],
        }),
    })
    customRender(
      <PipelineRequestStatusProvider>
        <CreatePipelineWizard />
      </PipelineRequestStatusProvider>,
      { nuqs: { searchParams: '?destinationType=ClickHouse&step=connection', hasMemory: true } }
    )
    fireEvent.change(await screen.findByRole('textbox', { name: 'Pipeline name' }), {
      target: { value: 'Analytics' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: 'HTTPS endpoint' }), {
      target: { value: 'https://example.clickhouse.cloud:8443' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: 'User' }), {
      target: { value: 'default' },
    })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Database' }), {
      target: { value: 'analytics' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Test connection' }))
    await screen.findByText('Ready to continue')
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    await screen.findByRole('heading', { name: 'Choose what to replicate' })
    fireEvent.click(screen.getAllByRole('combobox')[0])
    fireEvent.click(await screen.findByRole('option', { name: 'analytics' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    await screen.findByRole('heading', { name: 'Review and create' })
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Start pipeline' })).toBeEnabled()
    )
    fireEvent.click(screen.getByRole('button', { name: 'Start pipeline' }))
    await screen.findByText(failureStep === 'data' ? 'Invalid publication' : 'Access revoked')
    expect(screen.getByRole('heading', { name: 'Review and create' })).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByRole('button', { name: `Edit ${failureStep}` })).toBeEnabled()
    )
    fireEvent.click(screen.getByRole('button', { name: `Edit ${failureStep}` }))
    await screen.findByRole('heading', {
      name: failureStep === 'data' ? 'Choose what to replicate' : 'Authorize the destination',
    })
    if (failureStep === 'data') {
      await waitFor(() => expect(screen.getByRole('button', { name: 'Back' })).toBeEnabled())
      fireEvent.click(screen.getByRole('button', { name: 'Back' }))
      expect(await screen.findByText('Ready to continue')).toBeInTheDocument()
    }
  }
)
