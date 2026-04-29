import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

import { getSandboxCore, type SandboxCore } from './sandbox-core'
import { getErrorMessage } from '@/lib/get-error-message'

type SandboxStatus = 'idle' | 'booting' | 'ready' | 'error'

interface SandboxContextValue {
  status: SandboxStatus
  error?: string
  core: SandboxCore | null
}

const SandboxContext = createContext<SandboxContextValue>({ status: 'idle', core: null })

export function SandboxProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SandboxStatus>('idle')
  const [error, setError] = useState<string>()
  const [core, setCore] = useState<SandboxCore | null>(null)

  useEffect(() => {
    let cancelled = false
    setStatus('booting')

    getSandboxCore()
      .then((c) => {
        if (!cancelled) {
          setCore(c)
          setStatus('ready')
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getErrorMessage(err) ?? '')
          setStatus('error')
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <SandboxContext.Provider value={{ status, error, core }}>{children}</SandboxContext.Provider>
  )
}

export function useSandbox() {
  return useContext(SandboxContext)
}
