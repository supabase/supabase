import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import mockRouter from 'next-router-mock'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { TableEditorMenu } from './TableEditorMenu'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

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
    // @ts-expect-error partial project response
    response: {
      cloud_provider: 'localhost',
      id: 1,
      inserted_at: '2021-08-02T06:40:40.646Z',
      name: 'Default Project',
      organization_id: 1,
      ref: 'default',
      region: 'local',
      status: 'ACTIVE_HEALTHY',
      high_availability: false,
    },
  })

  addAPIMock({
    method: 'post',
    path: '/platform/pg-meta/:ref/query',
    response: ({ request }) => {
      const key = new URL(request.url).searchParams.get('key') ?? ''

      if (key === 'schemas') {
        return HttpResponse.json([
          { id: 1, name: 'public' },
          { id: 2, name: 'auth' },
          { id: 3, name: 'extensions' },
        ])
      }

      if (key.startsWith('entity-types')) {
        return HttpResponse.json([{ data: { entities: [], count: 0 } }])
      }

      return HttpResponse.json([])
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
    mockRouter.setCurrentUrl('/project/default/editor/25837?schema=public')
    vi.spyOn(mockRouter, 'replace').mockClear()
    vi.spyOn(mockRouter, 'push').mockClear()
  })

  test('replaces the open table with the schema list', async () => {
    mockMenuApis()
    const replace = vi.spyOn(mockRouter, 'replace')
    const push = vi.spyOn(mockRouter, 'push')

    customRender(<TableEditorMenu />, { nuqs: { searchParams: '?schema=public' } })
    await openSchemaList()
    await userEvent.click(screen.getByRole('option', { name: 'auth' }))

    expect(replace).toHaveBeenCalledWith('/project/default/editor?schema=auth')
    expect(push).not.toHaveBeenCalled()
  })

  test('keeps a sidebar param when leaving the open table', async () => {
    mockMenuApis()
    mockRouter.setCurrentUrl('/project/default/editor/25837?schema=public&sidebar=ai-assistant')
    const replace = vi.spyOn(mockRouter, 'replace')

    customRender(<TableEditorMenu />, {
      nuqs: { searchParams: '?schema=public&sidebar=ai-assistant' },
    })
    await openSchemaList()
    await userEvent.click(screen.getByRole('option', { name: 'extensions' }))

    expect(replace).toHaveBeenCalledWith(
      '/project/default/editor?schema=extensions&sidebar=ai-assistant'
    )
  })

  test('does not navigate when no table is open', async () => {
    params.id = undefined
    mockMenuApis()
    mockRouter.setCurrentUrl('/project/default/editor?schema=public')
    const replace = vi.spyOn(mockRouter, 'replace')
    const onUrlUpdate = vi.fn()

    customRender(<TableEditorMenu />, {
      nuqs: { hasMemory: true, searchParams: '?schema=public', onUrlUpdate },
    })
    await openSchemaList()
    await userEvent.click(screen.getByRole('option', { name: 'auth' }))

    expect(replace).not.toHaveBeenCalled()
    expect(onUrlUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ queryString: '?schema=auth' })
    )
  })
})
