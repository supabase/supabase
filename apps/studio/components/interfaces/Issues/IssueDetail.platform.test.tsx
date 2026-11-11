import { QueryClient } from '@tanstack/react-query'
import { act, screen, waitFor } from '@testing-library/react'
import type { components } from 'api-types'
import { FeatureFlagContext } from 'common'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { IssueDetail } from './IssueDetail'
import { lintKeys } from '@/data/lint/keys'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'
import { mockProjectGrantContext } from '@/tests/lib/project-grant-mocks'

type HealthResponse = components['schemas']['V2ProjectAdvisorsResponse_Output']
type BansResponse = { banned_ipv4_addresses: string[] }

const healthResponse: HealthResponse = {
  data: { type: 'project_advisors', attributes: { lints: [] } },
}

describe.each(['bans', 'health'] as const)('IssueDetail with %s checks', (source) => {
  beforeEach(() => {
    mockProjectGrantContext({ ref: 'default' })
    addAPIMock({ method: 'get', path: '/platform/projects/:ref/run-lints', response: [] })
    addAPIMock({
      method: 'post',
      path: '/v1/projects/:ref/network-bans/retrieve',
      response: { banned_ipv4_addresses: [] },
    })
    addAPIMock({ method: 'post', path: '/v2/projects/:ref/advisors/run', response: healthResponse })
  })

  function renderDetail() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    customRender(
      <FeatureFlagContext.Provider
        value={{ configcat: { healthAdvisor: source === 'health' }, posthog: {} }}
      >
        <IssueDetail />
      </FeatureFlagContext.Provider>,
      { queryClient: client }
    )
    return client
  }

  it('waits for the secondary check before declaring an issue missing', async () => {
    let resolveCheck: () => void = () => {}
    const pendingCheck = new Promise<void>((resolve) => {
      resolveCheck = resolve
    })
    if (source === 'bans') {
      addAPIMock({
        method: 'post',
        path: '/v1/projects/:ref/network-bans/retrieve',
        response: async () => {
          await pendingCheck
          return HttpResponse.json<BansResponse>({ banned_ipv4_addresses: [] })
        },
      })
    } else {
      addAPIMock({
        method: 'post',
        path: '/v2/projects/:ref/advisors/run',
        response: async () => {
          await pendingCheck
          return HttpResponse.json<HealthResponse>(healthResponse)
        },
      })
    }
    const client = renderDetail()
    await waitFor(() => expect(client.getQueryData(lintKeys.lint('default'))).toEqual([]))
    expect(screen.getByRole('status', { name: 'Loading issue' })).toBeInTheDocument()
    expect(screen.queryByText('Issue not found')).not.toBeInTheDocument()
    await act(async () => resolveCheck())
    expect(await screen.findByText('Issue not found')).toBeInTheDocument()
    expect(screen.queryByRole('status', { name: 'Loading issue' })).not.toBeInTheDocument()
  })

  it('shows a failed secondary check instead of claiming the issue is missing', async () => {
    addAPIMock({
      method: 'post',
      path:
        source === 'bans'
          ? '/v1/projects/:ref/network-bans/retrieve'
          : '/v2/projects/:ref/advisors/run',
      response: () =>
        HttpResponse.json<APIErrorBody>({ message: 'Check unavailable' }, { status: 500 }),
    })
    renderDetail()
    expect(await screen.findByText('Failed to retrieve issue')).toBeInTheDocument()
    expect(screen.getByText(/Check unavailable/)).toBeInTheDocument()
    expect(screen.queryByText('Issue not found')).not.toBeInTheDocument()
  })
})
