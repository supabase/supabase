import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ComputeInstance } from './Compute.types'
import { ComputeList } from './ComputeList'
import { customRender } from '@/tests/lib/custom-render'
import { routerMock } from '@/tests/lib/route-mock'

const instance = (name: string, overrides: Partial<ComputeInstance> = {}): ComputeInstance => ({
  name,
  buildState: 'active',
  isDeleting: false,
  runtime: 'node',
  size: '2gb-1vcpu',
  access: 'public',
  declaredInstances: 1,
  ...overrides,
})

const renderList = (instances: ComputeInstance[], onRefresh = vi.fn()) =>
  customRender(
    <ComputeList
      projectRef="default"
      instances={instances}
      onDeploy={vi.fn()}
      onRefresh={onRefresh}
      isRefreshing={false}
    />
  )

const rowNames = () =>
  screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[0].textContent)

describe('ComputeList', () => {
  beforeEach(() => {
    routerMock.setCurrentUrl('/project/default/compute')
  })

  it('renders a row per instance, linking to its detail page', () => {
    renderList([instance('embed'), instance('resize', { buildState: 'building' })])

    expect(rowNames()).toEqual(['embed', 'resize'])
    expect(screen.getByRole('link', { name: 'embed' })).toHaveAttribute(
      'href',
      '/project/default/compute/embed'
    )
    expect(screen.getByText('Building')).toBeVisible()
  })

  it('narrows the rows as you search, and says so when nothing matches', async () => {
    renderList([instance('embed'), instance('resize-images')])

    await userEvent.type(screen.getByPlaceholderText('Search by name'), 'resize')
    expect(rowNames()).toEqual(['resize-images'])
    await userEvent.type(screen.getByPlaceholderText('Search by name'), '-nope')
    expect(screen.getByText('No instances match your filters')).toBeVisible()
  })

  it('refreshes the instances list on request', async () => {
    const onRefresh = vi.fn()
    renderList([instance('embed')], onRefresh)

    await userEvent.click(screen.getByRole('button', { name: 'Refresh' }))

    expect(onRefresh).toHaveBeenCalledOnce()
  })

  it('pages through the instances ten at a time', async () => {
    const instances = Array.from({ length: 12 }, (_, index) => instance(`instance-${index}`))
    renderList(instances)

    expect(rowNames()).toHaveLength(10)
    expect(screen.getByText('Page 1 of 2')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeAriaDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Next page' }))

    expect(rowNames()).toEqual(['instance-10', 'instance-11'])
    expect(screen.getByRole('button', { name: 'Next page' })).toBeAriaDisabled()
  })

  it('returns to the first page when a search shrinks the results', async () => {
    const instances = Array.from({ length: 12 }, (_, index) => instance(`instance-${index}`))
    renderList(instances)

    await userEvent.click(screen.getByRole('button', { name: 'Next page' }))
    expect(screen.getByText('Page 2 of 2')).toBeVisible()

    await userEvent.type(screen.getByPlaceholderText('Search by name'), 'instance-1')
    expect(screen.getByText('Page 1 of 1')).toBeVisible()
    expect(rowNames()).toEqual(['instance-1', 'instance-10', 'instance-11'])
  })
})
