'use client'

import dynamic from 'next/dynamic.js'
import { ErrorBoundary, FallbackProps } from 'react-error-boundary'

import { Admonition } from '../admonition'
import { SqlToRestProps } from './sql-to-rest'

function FallbackComponent({ error }: FallbackProps) {
  if (error instanceof Error && error.message === 'WebAssembly is not defined') {
    return (
      <Admonition type="danger" title="WebAssembly is not supported in this browser">
        <p>
          The translator requires WebAssembly to run. Your browser might be outdated or it might
          have a policy that disables WebAssembly.
        </p>
      </Admonition>
    )
  }

  return (
    <Admonition type="danger" title="Something went wrong">
      <pre>{error instanceof Error ? error.message : JSON.stringify(error)}</pre>
    </Admonition>
  )
}

// Lazy load client side to prevent hydration issues when browser produces an error
const SqlToRest = dynamic(() => import('./sql-to-rest'), { ssr: false })

export default function SqlToRestWithFallback(props: SqlToRestProps) {
  return (
    <ErrorBoundary FallbackComponent={FallbackComponent}>
      <SqlToRest {...props} />
    </ErrorBoundary>
  )
}
