import { QueryClient } from '@tanstack/react-query'
import { act, waitFor } from '@testing-library/react'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { useEffect, useState } from 'react'
import { useCommandMenuOpen, useSetCommandMenuOpen } from 'ui-patterns/CommandMenu'
import { describe, expect, it, vi } from 'vitest'

import { useQueryTableCommands } from './SqlEditor.Commands'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type ProjectDetailResponse = components['schemas']['ProjectDetailResponse_Output']

const PROJECT: ProjectDetailResponse = {
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

const TABLES_QUERY_KEY = ['projects', 'default', 'tables', { includeColumns: true }]

function mockProjectDetail(response: () => Promise<Response> | Response) {
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response,
  })
}

function QueryTableCommands() {
  useQueryTableCommands()
  return null
}

// The lazy menu mounts on the open that initiates it, so the first render is already open.
function MountWhileOpen() {
  const setOpen = useSetCommandMenuOpen()
  const isOpen = useCommandMenuOpen()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setOpen(true)
    setIsReady(true)
  }, [setOpen])

  if (!isReady || !isOpen) return null

  return <QueryTableCommands />
}

function renderOpenMenu() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const prefetchQuery = vi.spyOn(queryClient, 'prefetchQuery').mockResolvedValue(undefined)

  customRender(<MountWhileOpen />, { queryClient })

  return prefetchQuery
}

describe('useQueryTableCommands', () => {
  it('prefetches tables when the menu mounts already open', async () => {
    mockProjectDetail(() => HttpResponse.json<ProjectDetailResponse>(PROJECT))
    const prefetchQuery = renderOpenMenu()

    await waitFor(() => {
      expect(prefetchQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: TABLES_QUERY_KEY })
      )
    })
  })

  it('prefetches tables when the project resolves after the menu opens', async () => {
    let releaseProject = () => {}
    const projectGate = new Promise<void>((resolve) => {
      releaseProject = resolve
    })
    let didRequestProject = false

    mockProjectDetail(async () => {
      didRequestProject = true
      await projectGate
      return HttpResponse.json<ProjectDetailResponse>(PROJECT)
    })

    const prefetchQuery = renderOpenMenu()

    await waitFor(() => {
      expect(didRequestProject).toBe(true)
    })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    expect(prefetchQuery).not.toHaveBeenCalled()

    releaseProject()

    await waitFor(() => {
      expect(prefetchQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: TABLES_QUERY_KEY })
      )
    })
  })
})
