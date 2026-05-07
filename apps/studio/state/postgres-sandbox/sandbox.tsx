import { noop } from 'lodash'
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react'

import { getSandboxCore, type SandboxCore } from './sandbox.core'
import { getDatabaseSchemaDDL } from '@/data/database/schema-ddl-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { getErrorMessage } from '@/lib/get-error-message'

type SandboxStatus = 'idle' | 'loading' | 'ready' | 'error'

const DDL_SCHEMAS = ['public']

const SandboxContext = createContext<{
  status: SandboxStatus
  error?: string
  sandbox: SandboxCore | null
  startSandbox: () => void
}>({ status: 'idle', error: undefined, sandbox: null, startSandbox: noop })

export const PostgresSandboxProvider = ({ children }: PropsWithChildren) => {
  const { data: project } = useSelectedProjectQuery()

  const [start, setStart] = useState<boolean>(false)
  const [error, setError] = useState<string>()
  const [status, setStatus] = useState<SandboxStatus>('idle')
  const [sandbox, setSandbox] = useState<SandboxCore | null>(null)

  useEffect(() => {
    if (!start) return

    let cancelled = false
    setStatus('loading')

    getSandboxCore()
      .then(async (core) => {
        if (!cancelled) {
          try {
            const data = await getDatabaseSchemaDDL({
              projectRef: project?.ref,
              connectionString: project?.connectionString,
              schemas: DDL_SCHEMAS,
            })
            await core.setSchema(data)

            setSandbox(core)
            setStatus('ready')
          } catch (error) {
            throw error
          }
        }
      })
      .catch((error) => {
        setError(getErrorMessage(error) ?? '')
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [start])

  return (
    <SandboxContext.Provider value={{ status, error, sandbox, startSandbox: () => setStart(true) }}>
      {children}
    </SandboxContext.Provider>
  )
}

export const usePostgresSandbox = () => useContext(SandboxContext)
