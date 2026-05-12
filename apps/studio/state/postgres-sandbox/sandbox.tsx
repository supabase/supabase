import { noop } from 'lodash'
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { AUTH_USERS_SEED_TABLE } from './sandbox.constants'
import { getSandboxCore, type SandboxCore } from './sandbox.core'
import { getDatabaseSchemaDDL } from '@/data/rls-tester/get-schema-ddl'
import { getProjectSeedData, TableSeedData } from '@/data/rls-tester/get-seed-data'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { getErrorMessage } from '@/lib/get-error-message'

type SandboxStatus = 'idle' | 'loading' | 'ready' | 'error'

const SandboxContext = createContext<{
  status: SandboxStatus
  error?: string
  sandbox: SandboxCore | null
  isSyncing: boolean
  startSandbox: () => void
  destroySandbox: () => Promise<void>
  syncSandbox: () => Promise<void>
}>({
  status: 'idle',
  error: undefined,
  sandbox: null,
  isSyncing: false,
  startSandbox: noop,
  destroySandbox: async () => {},
  syncSandbox: async () => {},
})

export const PostgresSandboxProvider = ({ children }: PropsWithChildren) => {
  const { data: project } = useSelectedProjectQuery()

  const [start, setStart] = useState<boolean>(false)
  const [error, setError] = useState<string>()
  const [sandbox, setSandbox] = useState<SandboxCore | null>(null)

  const [status, setStatus] = useState<SandboxStatus>('idle')
  const [isSyncing, setIsSyncing] = useState(false)

  const destroySandbox = async () => {
    if (isSyncing) return
    if (!sandbox) return console.error('Sandbox is not set up')

    await sandbox.destroy()
    setSandbox(null)
    setStatus('idle')
    setError(undefined)
    setStart(false)
  }

  // Internal — takes the target explicitly so the boot path can pass the
  // freshly booted core before React state has caught up. Callers outside
  // the provider use `syncSandbox()` which sources the target from state.
  const applyToCore = async (target: SandboxCore) => {
    setIsSyncing(true)

    try {
      const schemaDDL = await getDatabaseSchemaDDL({
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        schemas: ['public'],
      })

      const seedData: TableSeedData[] = await getProjectSeedData({
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        tables: [AUTH_USERS_SEED_TABLE, ...(schemaDDL.rlsStatuses ?? [])],
        rowLimit: 100,
      })

      await target.setSchema(schemaDDL)
      await target.setSeed(seedData)
    } catch (e) {
      const message = getErrorMessage(e) ?? String(e)
      if (sandbox) {
        // Refresh path — sandbox is still usable with the previous schema/data.
        toast.error(`Failed to refresh sandbox: ${message}`)
      } else {
        // Boot path — propagate so the outer .catch sets status='error' and
        // the SandboxManagement error branch renders.
        throw e
      }
    } finally {
      setIsSyncing(false)
    }
  }

  const syncSandbox = async () => {
    if (isSyncing) return
    if (!sandbox) return console.error('Sandbox has not been loaded')
    await applyToCore(sandbox)
  }

  useEffect(() => {
    if (!start) return

    let cancelled = false
    setStatus('loading')

    getSandboxCore()
      .then(async (core) => {
        if (cancelled) return

        await applyToCore(core)
        setSandbox(core)
        setStatus('ready')
      })
      .catch((error) => {
        if (cancelled) return

        setError(getErrorMessage(error) ?? '')
        setStatus('error')
        setStart(false)
      })

    return () => {
      cancelled = true
    }
    // applyToCore intentionally omitted: this effect should fire once when
    // `start` flips, not every time the helper identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start])

  return (
    <SandboxContext.Provider
      value={{
        status,
        error,
        sandbox,
        isSyncing,
        startSandbox: () => setStart(true),
        destroySandbox,
        syncSandbox,
      }}
    >
      {children}
    </SandboxContext.Provider>
  )
}

export const usePostgresSandbox = () => useContext(SandboxContext)
