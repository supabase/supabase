'use client'

import dynamic from 'next/dynamic'
import { notFound } from 'next/navigation'
import { type ComponentProps } from 'react'
import { IS_DEV } from '~/lib/constants'

const LazyGraphiQL = dynamic(
  async () => {
    const { GraphiQL: GraphiQLPrimitive } = await import('graphiql')
    const { createGraphiQLFetcher } = await import('@graphiql/toolkit')
    await import('graphiql/style.css')

    return function GraphiQL(props: Omit<ComponentProps<typeof GraphiQLPrimitive>, 'fetcher'>) {
      const fetcher = createGraphiQLFetcher({
        url: 'http://localhost:3001/docs/api/graphql',
      })
      return <GraphiQLPrimitive fetcher={fetcher} {...props} />
    }
  },
  {
    loading: () => <div className="p-6">Loading GraphiQL...</div>,
    ssr: false,
  }
)

export default function GraphiQLPage() {
  if (!IS_DEV) {
    notFound()
  }

  return <LazyGraphiQL className="!h-[calc(100vh-var(--header-height))]" />
}
