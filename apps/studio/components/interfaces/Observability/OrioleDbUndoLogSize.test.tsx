import { QueryClient } from '@tanstack/react-query'
import { screen, waitFor } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { describe, expect, test } from 'vitest'
import { z } from 'zod'

import { OrioleDbUndoLogSize } from './OrioleDbUndoLogSize'
import { databaseKeys } from '@/data/database/keys'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

describe('OrioleDbUndoLogSize', () => {
  test.each([
    { size: 0, formattedSize: '0 bytes' },
    { size: 1048576, formattedSize: '1 MB' },
  ])('displays $size bytes as current usage', async ({ size, formattedSize }) => {
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: async ({ request }) => {
        const { query } = z.object({ query: z.string() }).parse(await request.json())
        const rows = query.includes('pg_catalog.pg_proc')
          ? [{ schema: 'extensions' }]
          : [{ undo_size: size }]
        return HttpResponse.json<Record<string, unknown>[]>(rows)
      },
    })

    customRender(<OrioleDbUndoLogSize projectRef="default" />)

    expect(await screen.findByText(formattedSize)).toBeInTheDocument()
    expect(screen.getByText('Current')).toBeInTheDocument()
  })

  test('hides the metric when the function is unavailable', async () => {
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: () => HttpResponse.json<Record<string, unknown>[]>([]),
    })
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    customRender(<OrioleDbUndoLogSize projectRef="default" />, { queryClient })

    await waitFor(() => {
      expect(queryClient.getQueryState(databaseKeys.orioleDbUndoSize('default'))?.status).toBe(
        'success'
      )
    })
    expect(screen.queryByText('Undo log size')).not.toBeInTheDocument()
  })
})
