import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Worker } from './Workers.types'
import { WorkersList } from './WorkersList'
import { customRender } from '@/tests/lib/custom-render'
import { routerMock } from '@/tests/lib/route-mock'

const worker = (name: string, overrides: Partial<Worker> = {}): Worker => ({
  name,
  buildState: 'active',
  isDeleting: false,
  runtime: 'node',
  size: '2gb-1vcpu',
  access: 'public',
  declaredInstances: 1,
  ...overrides,
})

const renderList = (workers: Worker[]) =>
  customRender(<WorkersList projectRef="default" workers={workers} onDeploy={vi.fn()} />)

const rowNames = () =>
  screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[0].textContent)

describe('WorkersList', () => {
  beforeEach(() => {
    routerMock.setCurrentUrl('/project/default/workers')
  })

  it('renders a row per worker, linking to its detail page', () => {
    renderList([worker('embed'), worker('resize', { buildState: 'building' })])

    expect(rowNames()).toEqual(['embed', 'resize'])
    expect(screen.getByRole('link', { name: 'embed' })).toHaveAttribute(
      'href',
      '/project/default/workers/embed'
    )
    expect(screen.getByText('Building')).toBeVisible()
  })

  it('narrows the rows as you search, and says so when nothing matches', async () => {
    renderList([worker('embed'), worker('resize-images')])

    await userEvent.type(screen.getByPlaceholderText('Search by name'), 'resize')
    expect(rowNames()).toEqual(['resize-images'])
    expect(screen.getByText('1 worker')).toBeVisible()

    await userEvent.type(screen.getByPlaceholderText('Search by name'), '-nope')
    expect(screen.getByText('No workers match your filters')).toBeVisible()
  })

  it('pages through the workers ten at a time', async () => {
    const workers = Array.from({ length: 12 }, (_, index) => worker(`worker-${index}`))
    renderList(workers)

    expect(rowNames()).toHaveLength(10)
    expect(screen.getByText('Page 1 of 2')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Next page' }))

    expect(rowNames()).toEqual(['worker-10', 'worker-11'])
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled()
  })

  it('returns to the first page when a search shrinks the results', async () => {
    const workers = Array.from({ length: 12 }, (_, index) => worker(`worker-${index}`))
    renderList(workers)

    await userEvent.click(screen.getByRole('button', { name: 'Next page' }))
    expect(screen.getByText('Page 2 of 2')).toBeVisible()

    await userEvent.type(screen.getByPlaceholderText('Search by name'), 'worker-1')
    expect(screen.getByText('Page 1 of 1')).toBeVisible()
    expect(rowNames()).toEqual(['worker-1', 'worker-10', 'worker-11'])
  })
})
