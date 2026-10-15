import { fireEvent, screen, waitFor } from '@testing-library/react'
import type { components } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
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
const back = () => fireEvent.click(screen.getByRole('button', { name: 'Back' }))

describe('PipelineCreationFlow', () => {
  it('preserves connection and data values across steps and destination changes', () => {
    customRender(
      <PipelineCreationFlow availableDestinations={['BigQuery', 'Snowflake']} onClose={vi.fn()} />
    )
    expect(screen.getByText(/Step [1-4] of 4/)).toHaveTextContent('Step 1 of 4')
    next()
    fireEvent.change(screen.getByRole('textbox', { name: 'Pipeline name' }), {
      target: { value: 'Warehouse' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: 'Project ID' }), {
      target: { value: 'my-project' },
    })
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
    next()
    fireEvent.click(screen.getByRole('button', { name: /Advanced settings/ }))
    expect(screen.getByRole('spinbutton', { name: 'Batch wait time' })).toHaveValue(750)
    next()
    expect(screen.getByText(/Step [1-4] of 4/)).toHaveTextContent('Step 4 of 4')
    expect(screen.getByRole('button', { name: 'Start pipeline' })).toBeDisabled()
    expect(screen.getByDisplayValue('Warehouse')).toBeInTheDocument()
  })

  it('confirms dirty dismissal and allows keeping the form', async () => {
    const onClose = vi.fn()
    customRender(<PipelineCreationFlow availableDestinations={['BigQuery']} onClose={onClose} />)
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
