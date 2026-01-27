import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import type { Database } from 'data/read-replicas/replicas-query'
import { DOCS_URL } from 'lib/constants'
import { BookOpen } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  Button,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

export const QuickConnectConnectionString = () => {
  const { ref: projectRef } = useParams()

  const {
    data: databases,
    error,
    isPending: isLoading,
    isError,
  } = useReadReplicasQuery({ projectRef })

  const primaryDatabase = (databases ?? []).find((db) => db.identifier === projectRef)
  const [type, setType] = useState<'uri'>('uri')
  const [method, setMethod] = useState<'direct' | 'transaction' | 'session'>('direct')
  const [sourceId, setSourceId] = useState<string | undefined>(primaryDatabase?.identifier)

  const selectedDatabase = useMemo<Database | undefined>(() => {
    if (!databases || databases.length === 0) return undefined
    return databases.find((db) => db.identifier === sourceId) ?? primaryDatabase ?? databases[0]
  }, [databases, primaryDatabase, sourceId])

  const { host, port, dbName, user, connectionString } = useMemo(() => {
    const fallbackHost = 'db.<project>.supabase.co'
    const fallbackDb = 'postgres'
    const fallbackUser = 'postgres'
    const basePort = 5432

    const dbHost = selectedDatabase?.db_host || fallbackHost
    const dbPort =
      method === 'transaction'
        ? 6543
        : selectedDatabase?.db_port && selectedDatabase.db_port > 0
          ? selectedDatabase.db_port
          : basePort
    const dbDatabase = selectedDatabase?.db_name || fallbackDb
    const dbUser = selectedDatabase?.db_user || fallbackUser

    const conn =
      type === 'uri'
        ? `postgresql://${dbUser}:[YOUR-PASSWORD]@${dbHost}:${dbPort}/${dbDatabase}`
        : `postgres://${dbUser}:[YOUR-PASSWORD]@${dbHost}:${dbPort}/${dbDatabase}`

    return {
      host: dbHost,
      port: dbPort,
      dbName: dbDatabase,
      user: dbUser,
      connectionString: conn,
    }
  }, [selectedDatabase, type, method])

  if (isLoading) {
    return (
      <div className="p-4">
        <ShimmeringLoader className="h-8 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-4">
        <AlertError error={error} subject="Failed to retrieve database connection details" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <div className="flex flex-1">
              <span className="flex items-center rounded-l-md border border-border-strong px-3 text-xs text-foreground-lighter">
                Type
              </span>
              <Select_Shadcn_ value={type} onValueChange={(value: 'uri') => setType(value)}>
                <SelectTrigger_Shadcn_ className="flex-1 rounded-none rounded-r-md border-border-strong bg-muted px-3 text-xs">
                  <SelectValue_Shadcn_ />
                </SelectTrigger_Shadcn_>
                <SelectContent_Shadcn_>
                  <SelectItem_Shadcn_ value="uri">URI</SelectItem_Shadcn_>
                </SelectContent_Shadcn_>
              </Select_Shadcn_>
            </div>
            <div className="flex flex-1">
              <span className="flex items-center rounded-l-md border border-border-strong px-3 text-xs text-foreground-lighter">
                Source
              </span>
              <Select_Shadcn_
                value={selectedDatabase?.identifier ?? primaryDatabase?.identifier ?? ''}
                onValueChange={(value: string) => setSourceId(value)}
              >
                <SelectTrigger_Shadcn_ className="flex-1 rounded-none rounded-r-md border-border-strong bg-muted px-3 text-xs">
                  <SelectValue_Shadcn_ placeholder="Primary Database" />
                </SelectTrigger_Shadcn_>
                <SelectContent_Shadcn_>
                  {(databases ?? []).map((db) => (
                    <SelectItem_Shadcn_ key={db.identifier} value={db.identifier}>
                      {db.identifier === projectRef ? 'Primary Database' : db.name || db.identifier}
                    </SelectItem_Shadcn_>
                  ))}
                </SelectContent_Shadcn_>
              </Select_Shadcn_>
            </div>
            <div className="flex flex-1">
              <span className="flex items-center rounded-l-md border border-border-strong px-3 text-xs text-foreground-lighter">
                Method
              </span>
              <Select_Shadcn_
                value={method}
                onValueChange={(value: typeof method) => setMethod(value)}
              >
                <SelectTrigger_Shadcn_ className="flex-1 rounded-none rounded-r-md border-border-strong bg-muted px-3 text-xs">
                  <SelectValue_Shadcn_ />
                </SelectTrigger_Shadcn_>
                <SelectContent_Shadcn_>
                  <SelectItem_Shadcn_ value="direct">Direct Connection</SelectItem_Shadcn_>
                  <SelectItem_Shadcn_ value="transaction">Transaction Pooler</SelectItem_Shadcn_>
                  <SelectItem_Shadcn_ value="session">Session Pooler</SelectItem_Shadcn_>
                </SelectContent_Shadcn_>
              </Select_Shadcn_>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="inline-flex items-center gap-1.5 text-sm">
            <span className="text-foreground">Connection String</span>
          </div>
          <div className="relative">
            <div className="flex items-center rounded-md border-2 border-border-stronger bg-muted px-3 py-2 text-xs">
              <span className="truncate text-foreground">
                {connectionString ||
                  'postgresql://postgres:[YOUR-PASSWORD]@db.<project>.supabase.co:5432/postgres'}
              </span>
            </div>
            <Button
              type="default"
              size="tiny"
              className="absolute right-2 top-1.5 h-6 px-2 text-xs"
              onClick={() => {
                if (!connectionString) return
                navigator.clipboard.writeText(connectionString).catch(() => {})
              }}
            >
              Copy
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-1.5 text-sm">
          <span className="text-foreground">Parameters</span>
        </div>
        <div className="flex flex-col overflow-hidden rounded-md border border-border-default bg-surface-75 text-xs">
          <div className="flex gap-2 border-b border-border-default px-3 py-2">
            <span className="text-foreground-light">host:</span>
            <span className="font-mono text-foreground">{host || 'db.<project>.supabase.co'}</span>
          </div>
          <div className="flex gap-2 border-b border-border-default px-3 py-2">
            <span className="text-foreground-light">port:</span>
            <span className="font-mono text-foreground">{port}</span>
          </div>
          <div className="flex gap-2 border-b border-border-default px-3 py-2">
            <span className="text-foreground-light">database:</span>
            <span className="font-mono text-foreground">{dbName}</span>
          </div>
          <div className="flex gap-2 px-3 py-2">
            <span className="text-foreground-light">user:</span>
            <span className="font-mono text-foreground">{user}</span>
          </div>
        </div>
      </div>

      <Button asChild type="default" size="tiny" className="mt-1 h-7 justify-center px-3 text-xs">
        <Link href={`/project/${projectRef}/database/settings`}>View connection settings</Link>
      </Button>
    </div>
  )
}
