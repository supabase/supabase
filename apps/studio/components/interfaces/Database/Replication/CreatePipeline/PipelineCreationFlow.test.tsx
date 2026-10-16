import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import type { components } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { delay, HttpResponse } from 'msw'
import { NuqsAdapter } from 'nuqs/adapters/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PipelineCreationFlow } from './PipelineCreationFlow'
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

mockAnimationsApi()
beforeEach(() => {
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
        publications: [],
      }),
  })
})
const next = () => fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
const fillConnection = () => {
  for (const [name, value] of [
    ['Pipeline name', 'Warehouse'],
    ['Project ID', 'my-project'],
    ['Dataset ID', 'dataset'],
    ['Service account key', '{}'],
  ]) {
    fireEvent.change(screen.getByRole('textbox', { name }), { target: { value } })
  }
}
const testConnection = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Test connection' }))
  await screen.findByRole('button', { name: 'Continue' })
}
const back = () => fireEvent.click(screen.getByRole('button', { name: 'Back' }))

describe('PipelineCreationFlow', () => {
  it('requires valid fields, recovers from request and critical failures, and reviews warnings before continuing', async () => {
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
    customRender(<PipelineCreationFlow availableDestinations={['BigQuery']} onClose={vi.fn()} />, {
      nuqs: { hasMemory: true },
    })
    next()
    fireEvent.click(screen.getByRole('button', { name: /Advanced settings/ }))
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Connection pool size' }), {
      target: { value: '-1' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Advanced settings/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Test connection' }))
    expect((await screen.findAllByText(/Project ID is required\./)).length).toBeGreaterThan(0)
    expect(requests).toHaveLength(0)
    expect(screen.getByRole('spinbutton', { name: 'Connection pool size' })).toBeVisible()
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Connection pool size' }), {
      target: { value: '5' },
    })
    expect(screen.queryByText('Check connection settings')).not.toBeInTheDocument()
    fillConnection()
    fireEvent.click(screen.getByRole('button', { name: 'Test connection' }))
    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled()
    expect(await screen.findByText('Try again')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('textbox', { name: 'Project ID' }), {
      target: { value: 'retry-project' },
    })
    expect(screen.getByText('Try again')).toBeInTheDocument()
    expect(screen.getByText('Settings changed. Test the connection again.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Test connection' }))
    expect(await screen.findByText('Check credentials')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Test connection' })).not.toBeDisabled()
    )
    fireEvent.click(screen.getByRole('button', { name: 'Test connection' }))
    await screen.findByRole('button', { name: 'Continue' })
    expect(screen.getByText(/Step 2 of 4/)).toBeInTheDocument()
    expect(requests[2]).not.toHaveProperty('pipeline_config')
    expect(requests[2]).not.toHaveProperty('source_id')
    next()
    back()
    fireEvent.change(screen.getByRole('textbox', { name: 'Project ID' }), {
      target: { value: 'changed' },
    })
    expect(screen.getByRole('button', { name: 'Test connection' })).toBeInTheDocument()
    expect(screen.getByText('Check credentials')).toBeInTheDocument()
    expect(screen.getByText('Settings changed. Test the connection again.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Test connection' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Project ID' }), {
      target: { value: 'changed-during-test' },
    })
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Test connection' })).not.toBeDisabled()
    )
    expect(screen.queryByRole('button', { name: 'Continue' })).not.toBeInTheDocument()
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
    fireEvent.change(screen.getByRole('textbox', { name: 'Project ID' }), {
      target: { value: 'history-project' },
    })
    fillConnection()
    await testConnection()
    next()
    await waitFor(() => expect(window.location.search).toBe('?step=data'))
    await act(async () => {
      await new Promise<void>((resolve) => {
        window.addEventListener('popstate', () => resolve(), { once: true })
        window.history.back()
      })
    })
    expect(screen.getByText(/Step 2 of 4/)).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Project ID' })).toHaveValue('my-project')
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
    expect(screen.getByRole('textbox', { name: 'Project ID' })).toHaveValue('my-project')
    fireEvent.change(screen.getByRole('textbox', { name: 'Project ID' }), {
      target: { value: 'changed-project' },
    })
    await act(async () => {
      await new Promise<void>((resolve) => {
        window.addEventListener('popstate', () => resolve(), { once: true })
        window.history.forward()
      })
    })
    await waitFor(() => expect(window.location.search).toBe('?step=connection'))
    expect(screen.getByRole('button', { name: 'Test connection' })).toBeInTheDocument()
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

  it('preserves connection and data values across steps and destination changes', async () => {
    customRender(
      <PipelineCreationFlow availableDestinations={['BigQuery', 'Snowflake']} onClose={vi.fn()} />,
      { nuqs: { hasMemory: true } }
    )
    expect(screen.getByText(/Step [1-4] of 4/)).toHaveTextContent('Step 1 of 4')
    next()
    fireEvent.change(screen.getByRole('textbox', { name: 'Pipeline name' }), {
      target: { value: 'Warehouse' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: 'Project ID' }), {
      target: { value: 'my-project' },
    })
    fillConnection()
    await testConnection()
    next()
    expect(screen.getByText(/Step [1-4] of 4/)).toHaveTextContent('Step 3 of 4')
    fireEvent.click(screen.getByRole('button', { name: /Advanced settings/ }))
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Batch wait time' }), {
      target: { value: '750' },
    })
    back()
    expect(screen.getByRole('textbox', { name: 'Project ID' })).toHaveValue('my-project')
    back()
    fireEvent.click(screen.getByRole('radio', { name: /Snowflake/ }))
    next()
    expect(screen.getByRole('textbox', { name: 'Pipeline name' })).toHaveValue('Warehouse')
    back()
    fireEvent.click(screen.getByRole('radio', { name: /BigQuery/ }))
    next()
    expect(screen.getByRole('textbox', { name: 'Project ID' })).toHaveValue('my-project')
    if (screen.queryByRole('button', { name: 'Test connection' })) await testConnection()
    next()
    fireEvent.click(screen.getByRole('button', { name: /Advanced settings/ }))
    expect(screen.getByRole('spinbutton', { name: 'Batch wait time' })).toHaveValue(750)
    next()
    expect(screen.getByText(/Step [1-4] of 4/)).toHaveTextContent('Step 4 of 4')
    expect(screen.getByRole('button', { name: 'Start pipeline' })).toBeDisabled()
    expect(screen.getByDisplayValue('Warehouse')).toBeInTheDocument()
  })

  it('confirms destination-only changes and treats a reverted selection as pristine', async () => {
    const onClose = vi.fn()
    customRender(
      <PipelineCreationFlow availableDestinations={['BigQuery', 'Snowflake']} onClose={onClose} />
    )
    fireEvent.click(screen.getByRole('radio', { name: /Snowflake/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }))
    fireEvent.click(screen.getByRole('radio', { name: /BigQuery/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('confirms dirty dismissal and allows keeping the form', async () => {
    const onClose = vi.fn()
    customRender(<PipelineCreationFlow availableDestinations={['BigQuery']} onClose={onClose} />, {
      nuqs: { hasMemory: true },
    })
    next()
    fireEvent.change(screen.getByRole('textbox', { name: 'Pipeline name' }), {
      target: { value: 'Keep me' },
    })
    const unload = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(unload)
    expect(unload.defaultPrevented).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }))
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('link', { name: 'Supabase home' }))
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }))
    expect(screen.getByRole('textbox', { name: 'Pipeline name' })).toHaveValue('Keep me')
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Discard changes' }))
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
    const confirmedUnload = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(confirmedUnload)
    expect(confirmedUnload.defaultPrevented).toBe(false)
  })

  it('closes a pristine form and blocks progression without destinations', () => {
    const onClose = vi.fn()
    customRender(<PipelineCreationFlow availableDestinations={[]} onClose={onClose} />)
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
