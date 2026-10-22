import { QueryClient } from '@tanstack/react-query'
import { waitFor } from '@testing-library/react'
import { useEffect, useState } from 'react'
import { useCommandMenuOpen, useSetCommandMenuOpen } from 'ui-patterns/CommandMenu'
import { describe, expect, it, vi } from 'vitest'

import { useQueryTableCommands } from './SqlEditor.Commands'
import { customRender } from '@/tests/lib/custom-render'

vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: () => ({
    data: { ref: 'default', connectionString: null },
  }),
}))

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

describe('useQueryTableCommands', () => {
  it('prefetches tables when the menu mounts already open', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const prefetchQuery = vi.spyOn(queryClient, 'prefetchQuery').mockResolvedValue(undefined)

    customRender(<MountWhileOpen />, { queryClient })

    await waitFor(() => {
      expect(prefetchQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['projects', 'default', 'tables', { includeColumns: true }],
        })
      )
    })
  })
})
