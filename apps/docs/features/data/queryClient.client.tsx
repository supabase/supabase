'use client'

import { QueryClientProvider as QueryClientProviderPrimitive } from '@tanstack/react-query'
import { type PropsWithChildren } from 'react'
import { useRootQueryClient } from '~/lib/fetch/queryClient'

const QueryClientProvider = ({ children }: PropsWithChildren) => {
  const queryClient = useRootQueryClient()

  return (
    <QueryClientProviderPrimitive client={queryClient}>{children}</QueryClientProviderPrimitive>
  )
}

export { QueryClientProvider }
