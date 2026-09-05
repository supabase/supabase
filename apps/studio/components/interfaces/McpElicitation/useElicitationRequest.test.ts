import { act, waitFor } from '@testing-library/react'
import { delay, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import type { ElicitationParams } from './McpElicitation.params'
import { useElicitationRequest } from './useElicitationRequest'
import type { components } from '@/data/api'
import { customRenderHook } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

const REF_A = 'aaaaaaaaaaaaaaaaaaaa'
const NAME_A = 'OPENAI_API_KEY'
const NAME_B = 'RESEND_API_KEY'

const paramsFor = (ref: string, name: string): ElicitationParams => ({
  ref,
  name,
  dev: { state: undefined },
})

const WRITE_DELAY_MS = 120

const PROJECT: components['schemas']['ProjectDetailResponse'] = {
  cloud_provider: 'AWS',
  db_host: 'db.example.supabase.co',
  high_availability: false,
  id: 1,
  inserted_at: '2026-01-01T00:00:00Z',
  integration_source: null,
  is_branch_enabled: false,
  is_physical_backups_enabled: false,
  name: 'acme-production',
  organization_id: 1,
  ref: REF_A,
  region: 'us-east-1',
  restUrl: 'https://example.supabase.co/rest/v1/',
  status: 'ACTIVE_HEALTHY',
  subscription_id: 'sub_1',
  updated_at: '2026-01-01T00:00:00Z',
}

let writtenNames: string[] = []

beforeEach(() => {
  writtenNames = []

  addAPIMock({ method: 'get', path: '/platform/projects/:ref', response: PROJECT })
  addAPIMock({ method: 'get', path: '/v1/projects/:ref/secrets', response: [] })

  addAPIMock({
    method: 'post',
    path: '/v1/projects/:ref/secrets',
    response: async ({ request }) => {
      const body = (await request.json()) as { name: string }[]
      writtenNames.push(...body.map((secret) => secret.name))
      await delay(WRITE_DELAY_MS)
      return HttpResponse.json([])
    },
  })
})

describe('useElicitationRequest', () => {
  it('reports a stored outcome for the request that was actually written', async () => {
    const { result } = customRenderHook(() => useElicitationRequest(paramsFor(REF_A, NAME_A)))

    await waitFor(() => expect(result.current.state.status).toBe('form'))

    act(() => result.current.saveSecret('sk-value'))

    await waitFor(() => expect(result.current.state.status).toBe('stored'))
    expect(writtenNames).toEqual([NAME_A])
  })

  it('does not attribute request A’s settled write to request B', async () => {
    let params = paramsFor(REF_A, NAME_A)
    const { result, rerender } = customRenderHook(() => useElicitationRequest(params))

    await waitFor(() => expect(result.current.state.status).toBe('form'))

    act(() => result.current.saveSecret('sk-belongs-to-a'))
    params = paramsFor(REF_A, NAME_B)
    rerender()

    await waitFor(() => {
      const { state } = result.current
      expect(state.status === 'form' && state.request.keyName).toBe(NAME_B)
    })

    await new Promise((resolve) => setTimeout(resolve, WRITE_DELAY_MS * 3))

    expect(result.current.state.status).toBe('form')
    expect(writtenNames).toEqual([NAME_A])
  })

  it('does not carry a cancellation from request A onto request B', async () => {
    let params = paramsFor(REF_A, NAME_A)
    const { result, rerender } = customRenderHook(() => useElicitationRequest(params))

    await waitFor(() => expect(result.current.state.status).toBe('form'))

    act(() => result.current.cancelRequest())
    expect(result.current.state.status).toBe('cancelled')

    params = paramsFor(REF_A, NAME_B)
    rerender()

    await waitFor(() => expect(result.current.state.status).toBe('form'))
  })

  it('still shows A’s outcome if the user navigates back to A', async () => {
    let params = paramsFor(REF_A, NAME_A)
    const { result, rerender } = customRenderHook(() => useElicitationRequest(params))

    await waitFor(() => expect(result.current.state.status).toBe('form'))

    act(() => result.current.cancelRequest())
    params = paramsFor(REF_A, NAME_B)
    rerender()
    await waitFor(() => expect(result.current.state.status).toBe('form'))

    params = paramsFor(REF_A, NAME_A)
    rerender()

    await waitFor(() => expect(result.current.state.status).toBe('cancelled'))
  })
})
