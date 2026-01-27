import { useParams } from 'common'
import {
  type ConnectionStringMethod,
  DATABASE_CONNECTION_TYPES,
  type DatabaseConnectionType,
  connectionStringMethodOptions,
} from 'components/interfaces/Connect/Connect.constants'
import AlertError from 'components/ui/AlertError'
import { DatabaseSelector } from 'components/ui/DatabaseSelector'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import type { Database } from 'data/read-replicas/replicas-query'
import { DOCS_URL } from 'lib/constants'
import { BookOpen, Plug } from 'lucide-react'
import { useRouter } from 'next/router'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

export const QuickConnectConnectionString = () => {
  const router = useRouter()
  const { ref: projectRef } = useParams()

  const [queryType, setQueryType] = useQueryState('type', parseAsString.withDefault('uri'))
  const [querySource, setQuerySource] = useQueryState('source', parseAsString)
  const [queryMethod, setQueryMethod] = useQueryState('method', parseAsString.withDefault('direct'))

  const {
    data: databases,
    error,
    isPending: isLoading,
    isError,
  } = useReadReplicasQuery({ projectRef })

  const primaryDatabase = (databases ?? []).find((db) => db.identifier === projectRef)
  const [type, setType] = useState<DatabaseConnectionType>('uri')
  const [method, setMethod] = useState<ConnectionStringMethod>('direct')
  const [sourceId, setSourceId] = useState<string | undefined>(primaryDatabase?.identifier)

  useEffect(() => {
    // Sync query params -> local state
    const validTypes = DATABASE_CONNECTION_TYPES.map((t) => t.id)
    if (queryType && validTypes.includes(queryType as DatabaseConnectionType)) {
      setType(queryType as DatabaseConnectionType)
    } else if (queryType && !validTypes.includes(queryType as DatabaseConnectionType)) {
      setQueryType('uri')
      setType('uri')
    }

    const validMethods: ConnectionStringMethod[] = ['direct', 'transaction', 'session']
    if (queryMethod && validMethods.includes(queryMethod as ConnectionStringMethod)) {
      setMethod(queryMethod as ConnectionStringMethod)
    } else if (queryMethod && !validMethods.includes(queryMethod as ConnectionStringMethod)) {
      setQueryMethod('direct')
      setMethod('direct')
    }

    if (querySource && querySource !== sourceId) {
      setSourceId(querySource)
    } else if (!querySource && sourceId !== primaryDatabase?.identifier) {
      setSourceId(primaryDatabase?.identifier)
    }
  }, [
    queryType,
    queryMethod,
    querySource,
    primaryDatabase?.identifier,
    setQueryMethod,
    setQueryType,
  ])

  const handleDatabaseChange = (databaseId: string) => {
    setSourceId(databaseId)
    if (databaseId === projectRef) {
      setQuerySource(null)
    } else {
      setQuerySource(databaseId)
    }
  }

  const handleOpenConnectDialog = () => {
    const { pathname, query } = router

    const nextQuery: Record<string, string> = {
      ...Object.fromEntries(Object.entries(query).map(([key, value]) => [key, String(value)])),
      showConnect: 'true',
      connectTab: 'direct',
    }

    // Ensure type, source, and method are set from current state
    if (type) nextQuery.type = type
    if (querySource) nextQuery.source = querySource
    if (method) nextQuery.method = method

    router.push({ pathname, query: nextQuery }, undefined, { shallow: true })
  }

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
          <div className="flex flex-wrap gap-1">
            <div className="flex">
              <span className="flex items-center rounded-l-md border border-r-0 border-border-strong px-2 text-xs text-foreground-lighter">
                Type
              </span>
              <Select_Shadcn_
                value={type}
                onValueChange={(value: DatabaseConnectionType) => {
                  setType(value)
                  setQueryType(value)
                }}
              >
                <SelectTrigger_Shadcn_ className="flex-1 !w-[120px] rounded-none rounded-r-md border-border-strong bg-muted px-3 text-xs">
                  <SelectValue_Shadcn_ />
                </SelectTrigger_Shadcn_>
                <SelectContent_Shadcn_>
                  {DATABASE_CONNECTION_TYPES.map((dbType) => (
                    <SelectItem_Shadcn_ key={dbType.id} value={dbType.id}>
                      {dbType.label}
                    </SelectItem_Shadcn_>
                  ))}
                </SelectContent_Shadcn_>
              </Select_Shadcn_>
            </div>
            <div className="flex">
              <DatabaseSelector
                align="start"
                buttonProps={{
                  size: 'small',
                  className:
                    'w-full justify-between text-xs pr-2.5 [&_svg]:h-4 rounded-none rounded-r-md',
                }}
                className="w-full md:w-auto [&>span]:w-1/2 [&>span]:md:w-auto"
                onSelectId={handleDatabaseChange}
              />
            </div>
            <div className="flex flex-grow">
              <span className="flex items-center rounded-l-md border border-r-0 border-border-strong px-2 text-xs text-foreground-lighter">
                Method
              </span>
              <Select_Shadcn_
                value={method}
                onValueChange={(value: ConnectionStringMethod) => {
                  setMethod(value)
                  setQueryMethod(value)
                }}
              >
                <SelectTrigger_Shadcn_ className="flex-1 rounded-none rounded-r-md border-border-strong bg-muted px-3 text-xs">
                  <SelectValue_Shadcn_>
                    {connectionStringMethodOptions[method].label}
                  </SelectValue_Shadcn_>
                </SelectTrigger_Shadcn_>
                <SelectContent_Shadcn_>
                  {(Object.keys(connectionStringMethodOptions) as ConnectionStringMethod[]).map(
                    (key) => (
                      <SelectItem_Shadcn_ key={key} value={key}>
                        {connectionStringMethodOptions[key].label}
                      </SelectItem_Shadcn_>
                    )
                  )}
                </SelectContent_Shadcn_>
              </Select_Shadcn_>
            </div>
          </div>
        </div>

        <FormItemLayout isReactForm={false} layout="vertical" label="Connection String">
          <Input
            readOnly
            copy
            className="input-mono"
            value={
              connectionString ||
              'postgresql://postgres:[YOUR-PASSWORD]@db.<project>.supabase.co:5432/postgres'
            }
          />
        </FormItemLayout>
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

      <Button
        type="default"
        size="tiny"
        icon={<Plug className="rotate-90" />}
        className="mt-1 h-7 justify-center px-3 text-xs"
        onClick={handleOpenConnectDialog}
      >
        View connection settings
      </Button>
    </div>
  )
}
