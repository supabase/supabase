import { QueryClient, useQuery } from '@tanstack/react-query'
import { screen, waitFor } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { describe, expect, test } from 'vitest'

import { useAPIKeyDeleteMutation } from './api-key-delete-mutation'
import { apiKeysQueryOptions, type APIKeysGrant } from './api-keys-query'
import { apiKeysKeys } from './keys'
import type { components } from '@/data/api'
import { customRender, customRenderHook } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { testGrant } from '@/tests/lib/test-grant'

type APIKeyResponse = components['schemas']['ApiKeyResponse_Output']

const PROJECT_REF = 'default'
const grant: APIKeysGrant = testGrant('GET /v1/projects/{ref}/api-keys', {
  projectRef: PROJECT_REF,
})

const KEYS = [
  {
    api_key: 'anon-key',
    id: 'anon-id',
    name: 'anon',
    type: 'legacy' as const,
  },
]

function KeysReader({ label, grant }: { label: string; grant?: APIKeysGrant }) {
  const { status } = useQuery(apiKeysQueryOptions({ projectRef: PROJECT_REF, grant }))
  return <div data-testid={label}>{status}</div>
}

describe('apiKeysQueryOptions', () => {
  test('invalidation still refetches when a grant-less observer rendered last', async () => {
    let getCount = 0
    addAPIMock({
      method: 'get',
      path: '/v1/projects/:ref/api-keys',
      response: () => {
        getCount += 1
        return HttpResponse.json<APIKeyResponse[]>(KEYS)
      },
    })
    addAPIMock({
      method: 'delete',
      path: '/v1/projects/:ref/api-keys/:id',
      response: () => HttpResponse.json<APIKeyResponse>(KEYS[0]),
    })

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })

    // Component A holds a grant and fetches.
    const { rerender } = customRender(<KeysReader label="a" grant={grant} />, { queryClient })
    await waitFor(() => expect(screen.getByTestId('a')).toHaveTextContent('success'))
    expect(getCount).toBe(1)

    // Component B has no grant and renders last, so it is the last writer of the query's options.
    rerender(
      <>
        <KeysReader label="a" grant={grant} />
        <KeysReader label="b" />
      </>
    )
    await waitFor(() => expect(screen.getByTestId('b')).toBeInTheDocument())

    // Invalidate through the delete mutation.
    const { result } = customRenderHook(() => useAPIKeyDeleteMutation(), { queryClient })
    await result.current.mutateAsync({ projectRef: PROJECT_REF, id: 'anon-id' })

    await waitFor(() => expect(getCount).toBe(2))
    await waitFor(() => {
      expect(queryClient.getQueryState(apiKeysKeys.list(PROJECT_REF, false))?.status).toBe(
        'success'
      )
    })
    expect(screen.getByTestId('a')).toHaveTextContent('success')
  })
})
