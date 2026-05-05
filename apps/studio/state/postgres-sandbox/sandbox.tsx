import { createContext, PropsWithChildren, useEffect, useState } from 'react'

import { getSandboxCore, type SandboxCore } from './sandbox.core'
import { getErrorMessage } from '@/lib/get-error-message'

type SandboxStatus = 'idle' | 'loading' | 'ready' | 'error'

const SandboxContext = createContext<{
  status: SandboxStatus
  error?: string
  sandbox: SandboxCore | null
}>({ status: 'idle', error: undefined, sandbox: null })

export const PostgresSandboxProvider = ({ children }: PropsWithChildren) => {
  const [status, setStatus] = useState<SandboxStatus>('idle')
  const [error, setError] = useState<string>()
  const [sandbox, setSandbox] = useState<SandboxCore | null>(null)

  useEffect(() => {
    let cancelled = false
    setStatus('loading')

    getSandboxCore()
      .then((c) => {
        if (!cancelled) {
          setSandbox(c)
          setStatus('ready')
        }
      })
      .catch((error) => {
        setError(getErrorMessage(error) ?? '')
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <SandboxContext.Provider value={{ status, error, sandbox }}>{children}</SandboxContext.Provider>
  )
}
