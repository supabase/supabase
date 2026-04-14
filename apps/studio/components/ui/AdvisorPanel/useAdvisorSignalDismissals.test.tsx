import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'

import { useAdvisorSignalDismissals } from './useAdvisorSignalDismissals'

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

describe('useAdvisorSignalDismissals', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('stores dismissals per project', async () => {
    const wrapper = createWrapper()
    const { result, rerender } = renderHook(
      ({ projectRef }) => useAdvisorSignalDismissals(projectRef),
      {
        initialProps: { projectRef: 'project-a' },
        wrapper,
      }
    )

    act(() => {
      result.current.dismissSignal('signal:banned-ip:203.0.113.10:v1')
    })

    await waitFor(() => {
      expect(result.current.dismissedFingerprints).toEqual(['signal:banned-ip:203.0.113.10:v1'])
    })

    rerender({ projectRef: 'project-b' })

    await waitFor(() => {
      expect(result.current.dismissedFingerprints).toEqual([])
    })
  })

  it('keeps dismissed signals hidden after a remount', async () => {
    const wrapper = createWrapper()
    const { result, unmount } = renderHook(() => useAdvisorSignalDismissals('project-a'), {
      wrapper,
    })

    act(() => {
      result.current.dismissSignal('signal:banned-ip:203.0.113.10:v1')
    })

    unmount()

    const remounted = renderHook(() => useAdvisorSignalDismissals('project-a'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(remounted.result.current.dismissedFingerprints).toEqual([
        'signal:banned-ip:203.0.113.10:v1',
      ])
    })
  })

  it('prunes dismissed signals that are no longer active', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useAdvisorSignalDismissals('project-a'), {
      wrapper,
    })

    act(() => {
      result.current.dismissSignal('signal:banned-ip:203.0.113.10:v1')
    })

    await waitFor(() => {
      expect(result.current.dismissedFingerprints).toEqual(['signal:banned-ip:203.0.113.10:v1'])
    })

    act(() => {
      result.current.dismissSignal('signal:banned-ip:203.0.113.11:v1')
    })

    await waitFor(() => {
      expect(result.current.dismissedFingerprints).toEqual([
        'signal:banned-ip:203.0.113.10:v1',
        'signal:banned-ip:203.0.113.11:v1',
      ])
    })

    act(() => {
      result.current.pruneDismissedSignals(['signal:banned-ip:203.0.113.11:v1'])
    })

    await waitFor(() => {
      expect(result.current.dismissedFingerprints).toEqual(['signal:banned-ip:203.0.113.11:v1'])
    })
  })
})
