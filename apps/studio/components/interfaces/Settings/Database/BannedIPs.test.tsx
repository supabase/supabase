import { QueryClient } from '@tanstack/react-query'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { beforeEach, expect, test, vi } from 'vitest'

import { BannedIPs } from './BannedIPs'
import type { deleteBannedIPs } from '@/data/banned-ips/banned-ips-delete-mutations'
import type { IPData } from '@/data/banned-ips/banned-ips-query'
import type { ProjectDetail } from '@/data/projects/project-detail-query'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

mockAnimationsApi()

const routeParams = vi.hoisted(() => ({ ref: 'default' }))
beforeEach(() => {
  routeParams.ref = 'default'
})

vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  IS_PLATFORM: true,
  useParams: () => routeParams,
}))

vi.mock('@/lib/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/constants')>()),
  IS_PLATFORM: true,
}))

vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: () => ({ can: true }),
}))

vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => vi.fn() }))

test('shows a project-details error instead of leaving Network bans loading', async () => {
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: () =>
      HttpResponse.json<APIErrorBody>({ message: 'Project unavailable' }, { status: 500 }),
  })

  customRender(<BannedIPs />)

  expect(await screen.findByText('Failed to retrieve project details')).toBeVisible()
  expect(screen.getByText('Error: Project unavailable')).toBeVisible()
  expect(screen.getByRole('link', { name: /contact support/i })).toHaveAttribute(
    'href',
    expect.stringContaining('projectRef=default')
  )
  expect(screen.queryByRole('button', { name: 'Unban IP' })).not.toBeInTheDocument()
  expect(
    screen.queryByText('There are no banned IP addresses for your project')
  ).not.toBeInTheDocument()
})

const PROJECT: ProjectDetail = {
  cloud_provider: 'AWS',
  connectionString: 'postgresql://postgres:password@db.default.supabase.co:5432/postgres',
  db_host: 'db.default.supabase.co',
  dbVersion: 'supabase-postgres-15.1.0',
  high_availability: false,
  id: 1,
  infra_compute_size: 'micro',
  inserted_at: '2026-01-01T00:00:00.000Z',
  integration_source: null,
  is_branch_enabled: false,
  is_physical_backups_enabled: false,
  name: 'Test project',
  organization_id: 1,
  ref: 'default',
  region: 'us-east-1',
  restUrl: 'https://default.supabase.co',
  status: 'ACTIVE_HEALTHY',
  subscription_id: 'subscription-1',
  updated_at: '2026-01-01T00:00:00.000Z',
}

test.each([
  { name: 'v3', cloud_provider: 'AWS_K8S', high_availability: false },
  { name: 'HA', cloud_provider: 'AWS', high_availability: true },
])('clears an open unban confirmation when navigating to $name', async (unsupported) => {
  let bannedIPs: IPData = { banned_ipv4_addresses: ['203.0.113.10'] }
  const unbanRequests: unknown[] = []
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: ({ params }) =>
      HttpResponse.json<ProjectDetail>(
        params.ref === 'default' ? PROJECT : { ...PROJECT, ...unsupported, ref: String(params.ref) }
      ),
  })
  addAPIMock({
    method: 'post',
    path: '/v1/projects/:ref/network-bans/retrieve',
    response: () => HttpResponse.json<IPData>(bannedIPs),
  })
  addAPIMock({
    method: 'delete',
    path: '/v1/projects/:ref/network-bans',
    response: async ({ request }) => {
      unbanRequests.push(await request.json())
      bannedIPs = { banned_ipv4_addresses: [] }
      return HttpResponse.json<Awaited<ReturnType<typeof deleteBannedIPs>>>(null)
    },
  })
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const { rerender } = customRender(<BannedIPs />, { queryClient })

  fireEvent.click(await screen.findByRole('button', { name: 'Unban IP' }))
  expect(await screen.findByRole('dialog', { name: 'Confirm Unban IP' })).toBeVisible()

  routeParams.ref = 'unsupported'
  rerender(<BannedIPs />)

  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  expect(screen.queryByRole('button', { name: 'Unban IP' })).not.toBeInTheDocument()
  expect(unbanRequests).toEqual([])

  routeParams.ref = 'default'
  rerender(<BannedIPs />)

  const unbanButton = await screen.findByRole('button', { name: 'Unban IP' })
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(unbanRequests).toEqual([])

  fireEvent.click(unbanButton)
  fireEvent.click(await screen.findByRole('button', { name: 'Confirm Unban' }))
  expect(await screen.findByText('There are no banned IP addresses for your project')).toBeVisible()
  expect(unbanRequests).toEqual([{ ipv4_addresses: ['203.0.113.10'] }])
})
