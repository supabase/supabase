import { QueryClient } from '@tanstack/react-query'
import { waitFor } from '@testing-library/react'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { useEffect, useState } from 'react'
import { useCommandMenuOpen, useSetCommandMenuOpen } from 'ui-patterns/CommandMenu'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useQueryTableCommands } from './SqlEditor.Commands'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

const routeParams = vi.hoisted(() => {
  const current: { ref: string } = { ref: 'default' }
  return { current }
})

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return {
    ...actual,
    useParams: () => routeParams.current,
  }
})

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

const OTHER_REF = 'other-project'

function tablesQueryKey(ref: string) {
  return ['projects', ref, 'tables', { includeColumns: true }]
}

const TABLES_QUERY_KEY = tablesQueryKey('default')

function projectWithRef(ref: string): ProjectDetailResponse {
  return { ...PROJECT, ref }
}

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

// the lazy menu mounts on the open that initiates it, so the first render is already open.
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

// stays mounted across open and close, unlike MountWhileOpen, which unmounts when the menu closes.
function MenuToggle({ open }: { open: boolean }) {
  const setOpen = useSetCommandMenuOpen()

  useEffect(() => {
    setOpen(open)
  }, [open, setOpen])

  return <QueryTableCommands />
}

function renderMountedMenu() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const prefetchQuery = vi.spyOn(queryClient, 'prefetchQuery').mockResolvedValue(undefined)
  const view = customRender(<MenuToggle open={false} />, { queryClient })

  return { prefetchQuery, ...view }
}

describe('useQueryTableCommands', () => {
  let releaseProject = () => {}

  afterEach(() => {
    releaseProject()
    releaseProject = () => {}
    routeParams.current = { ref: 'default' }
  })

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

    try {
      await waitFor(() => {
        expect(didRequestProject).toBe(true)
      })
      expect(prefetchQuery).not.toHaveBeenCalled()

      releaseProject()

      await waitFor(() => {
        expect(prefetchQuery).toHaveBeenCalledWith(
          expect.objectContaining({ queryKey: TABLES_QUERY_KEY })
        )
      })
    } finally {
      releaseProject()
    }
  })

  it('does not prefetch on close, and prefetches again when the menu reopens', async () => {
    mockProjectDetail(() => HttpResponse.json<ProjectDetailResponse>(PROJECT))
    const { prefetchQuery, rerender } = renderMountedMenu()

    rerender(<MenuToggle open />)

    await waitFor(() => {
      expect(prefetchQuery).toHaveBeenCalledTimes(1)
    })

    rerender(<MenuToggle open={false} />)
    expect(prefetchQuery).toHaveBeenCalledTimes(1)

    rerender(<MenuToggle open />)

    await waitFor(() => {
      expect(prefetchQuery).toHaveBeenCalledTimes(2)
    })
    expect(prefetchQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ queryKey: TABLES_QUERY_KEY })
    )
  })

  it('prefetches tables when the project changes while the menu is open', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: ({ params }) =>
        HttpResponse.json<ProjectDetailResponse>(projectWithRef(String(params.ref))),
    })
    const { prefetchQuery, rerender } = renderMountedMenu()

    rerender(<MenuToggle open />)

    await waitFor(() => {
      expect(prefetchQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: tablesQueryKey('default') })
      )
    })

    routeParams.current = { ref: OTHER_REF }
    rerender(<MenuToggle open />)

    await waitFor(() => {
      expect(prefetchQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: tablesQueryKey(OTHER_REF) })
      )
    })
  })
})
