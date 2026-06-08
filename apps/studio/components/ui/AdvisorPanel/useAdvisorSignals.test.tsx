import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAdvisorSignals } from './useAdvisorSignals'

const { mockUseBannedIPsQuery } = vi.hoisted(() => ({
  mockUseBannedIPsQuery: vi.fn(),
}))

vi.mock('@/data/banned-ips/banned-ips-query', () => ({
  useBannedIPsQuery: mockUseBannedIPsQuery,
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useAdvisorSignals', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.clearAllMocks()
  })

  it('resurfaces a dismissed banned-IP signal after the IP disappears and is banned again', async () => {
    let bannedIPs = ['203.0.113.10']

    mockUseBannedIPsQuery.mockImplementation(() => ({
      data: {
        banned_ipv4_addresses: bannedIPs,
      },
      isPending: false,
      isError: false,
    }))

    const { result, rerender } = renderHook(
      () => useAdvisorSignals({ projectRef: 'project-ref' }),
      {
        wrapper: createWrapper(),
      }
    )

    expect(result.current.data).toHaveLength(1)

    act(() => {
      result.current.dismissSignal('signal:banned-ip:203.0.113.10:v1')
    })

    await waitFor(() => {
      expect(result.current.data).toEqual([])
    })

    bannedIPs = []
    rerender()

    await waitFor(() => {
      expect(window.localStorage.getItem('advisor-signal-dismissals:project-ref')).toBe('[]')
    })

    bannedIPs = ['203.0.113.10']
    rerender()

    await waitFor(() => {
      expect(result.current.data).toHaveLength(1)
      expect(result.current.data[0].sourceData.ip).toBe('203.0.113.10')
    })
  })
})
