import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { platformComponents as components } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import mockRouter from 'next-router-mock'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { TableEditorMenu } from './TableEditorMenu'
import { type Entity } from '@/data/entity-types/entity-types-infinite-query'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type ProjectDetailResponse = components['schemas']['ProjectDetailResponse_Output']
type SchemaListRow = { id: number; name: string }
type EntityTypesPage = { data: { entities: Entity[]; count: number } }

const PROJECT: ProjectDetailResponse = {
  cloud_provider: 'localhost',
  connectionString: null,
  db_host: 'localhost',
  high_availability: false,
  id: 1,
  inserted_at: '2021-08-02T06:40:40.646Z',
  integration_source: null,
  is_branch_enabled: false,
  is_physical_backups_enabled: false,
  name: 'Default Project',
  organization_id: 1,
  ref: 'default',
  region: 'local',
  restUrl: 'http://localhost:8000',
  status: 'ACTIVE_HEALTHY',
  subscription_id: 'subscription-1',
  updated_at: '2021-08-02T06:40:40.646Z',
}

mockAnimationsApi()

const params = vi.hoisted(() => ({
  ref: 'default' as string | undefined,
  id: '25837' as string | undefined,
}))

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return {
    ...actual,
    useParams: () => params,
  }
})

const mockMenuApis = () => {
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: PROJECT,
  })

  addAPIMock({
    method: 'post',
    path: '/platform/pg-meta/:ref/query',
    response: ({ request }) => {
      const key = new URL(request.url).searchParams.get('key') ?? ''

      if (key === 'schemas') {
        return HttpResponse.json<SchemaListRow[]>([
          { id: 1, name: 'public' },
          { id: 2, name: 'auth' },
          { id: 3, name: 'extensions' },
        ])
      }

      if (key.startsWith('entity-types')) {
        return HttpResponse.json<EntityTypesPage[]>([{ data: { entities: [], count: 0 } }])
      }

      return HttpResponse.json<unknown[]>([])
    },
  })
}

const openSchemaList = async () => {
  await userEvent.click(await screen.findByRole('combobox', { name: 'Schema public' }))
  await screen.findByRole('option', { name: 'auth' })
}

describe('TableEditorMenu schema switch', () => {
  beforeEach(() => {
    params.ref = 'default'
    params.id = '25837'
    localStorage.clear()
    mockMenuApis()
    mockRouter.setCurrentUrl('/project/default/editor/25837?schema=public')
    vi.spyOn(mockRouter, 'replace').mockClear()
    vi.spyOn(mockRouter, 'push').mockClear()
  })

  test('replaces a schema change without leaving the open table', async () => {
    const onUrlUpdate = vi.fn()

    customRender(<TableEditorMenu />, {
      nuqs: { hasMemory: true, searchParams: '?schema=public', onUrlUpdate },
    })
    await openSchemaList()
    await userEvent.click(screen.getByRole('option', { name: 'auth' }))

    expect(mockRouter.replace).not.toHaveBeenCalled()
    expect(mockRouter.push).not.toHaveBeenCalled()
    expect(mockRouter.asPath).toBe('/project/default/editor/25837?schema=public')
    await waitFor(() => {
      expect(onUrlUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          queryString: '?schema=auth',
          options: expect.objectContaining({ history: 'replace' }),
        })
      )
    })
  })

  test('keeps a sidebar param when switching schema', async () => {
    mockRouter.setCurrentUrl('/project/default/editor/25837?schema=public&sidebar=ai-assistant')
    const onUrlUpdate = vi.fn()

    customRender(<TableEditorMenu />, {
      nuqs: { hasMemory: true, searchParams: '?schema=public&sidebar=ai-assistant', onUrlUpdate },
    })
    await openSchemaList()
    await userEvent.click(screen.getByRole('option', { name: 'extensions' }))

    expect(mockRouter.replace).not.toHaveBeenCalled()
    expect(mockRouter.push).not.toHaveBeenCalled()
    await waitFor(() => {
      expect(onUrlUpdate).toHaveBeenCalled()
    })
    const update = onUrlUpdate.mock.calls.at(-1)?.[0] as {
      searchParams: URLSearchParams
      options: { history: string }
    }
    expect(update.searchParams.get('schema')).toBe('extensions')
    expect(update.searchParams.get('sidebar')).toBe('ai-assistant')
    expect(update.options.history).toBe('replace')
  })
})
