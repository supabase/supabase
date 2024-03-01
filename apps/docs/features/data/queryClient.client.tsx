'use client'

import { QueryClientProvider as QueryClientProviderPrimitive } from '@tanstack/react-query'
import { type PropsWithChildren } from 'react'

// TODO: Move the fetch files into this directory as well
import { useRootQueryClient } from '~/lib/fetch/queryClient'

const QueryClientProvider = ({ children }: PropsWithChildren) => {
  const queryClient = useRootQueryClient()

  return (
    <QueryClientProviderPrimitive client={queryClient}>{children}</QueryClientProviderPrimitive>
  )
}

export { QueryClientProvider }
