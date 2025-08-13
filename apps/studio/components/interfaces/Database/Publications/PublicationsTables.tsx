import type { PostgresPublication } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ChevronLeft, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import NoSearchResults from 'components/to-be-cleaned/NoSearchResults'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { Loading } from 'components/ui/Loading'
import { useTablesQuery } from 'data/tables/tables-query'
import { useAsyncCheckProjectPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useProtectedSchemas } from 'hooks/useProtectedSchemas'
import { Button, Input } from 'ui'
import { Admonition } from 'ui-patterns'
import PublicationsTableItem from './PublicationsTableItem'

interface PublicationsTablesProps {
  selectedPublication: PostgresPublication
  onSelectBack: () => void
}

export const PublicationsTables = ({
  selectedPublication,
  onSelectBack,
}: PublicationsTablesProps) => {
  const { data: project } = useSelectedProjectQuery()
  const [filterString, setFilterString] = useState<string>('')

  const { can: canUpdatePublications, isLoading: isLoadingPermissions } =
    useAsyncCheckProjectPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'publications')

  const { data: protectedSchemas } = useProtectedSchemas()

  const {
    data: tablesData,
    isLoading,
    isSuccess,
    isError,
    error,
  } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const tables = useMemo(() => {
    return (tablesData || []).filter((table) =>
      filterString.length === 0
        ? !protectedSchemas.find((s) => s.name === table.schema)
        : !protectedSchemas.find((s) => s.name === table.schema) &&
          table.name.includes(filterString)
    )
  }, [tablesData, protectedSchemas, filterString])

  return (
    <>
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              type="outline"
              onClick={() => onSelectBack()}
              icon={<ChevronLeft />}
              style={{ padding: '5px' }}
            />
            <div>
              <Input
                size="small"
                placeholder={'Filter'}
                value={filterString}
                onChange={(e) => setFilterString(e.target.value)}
                icon={<Search size="14" />}
              />
            </div>
          </div>
          {!isLoadingPermissions && !canUpdatePublications && (
            <Admonition
              type="note"
              className="w-[500px] m-0"
              title="You need additional permissions to update database replications"
            />
          )}
        </div>
      </div>

      {(isLoading || isLoadingPermissions) && (
        <div className="mt-8">
          <Loading />
        </div>
      )}

      {isError && <AlertError error={error} subject="Failed to retrieve tables" />}

      {isSuccess &&
        (tables.length === 0 ? (
          <NoSearchResults />
        ) : (
          <div>
            <Table
              head={[
                <Table.th key="header-name">Name</Table.th>,
                <Table.th key="header-schema">Schema</Table.th>,
                <Table.th key="header-desc" className="hidden text-left lg:table-cell">
                  Description
                </Table.th>,
                <Table.th key="header-all">
                  {/* Temporarily disable All tables toggle for publications. See https://github.com/supabase/supabase/pull/7233.
              <div className="flex flex-row space-x-3 items-center justify-end">
                <div className="text-xs leading-4 font-medium text-gray-400 text-right ">
                  All Tables
                </div>
                <Toggle
                  size="tiny"
                  align="right"
                  error=""
                  className="m-0 p-0 ml-2 mt-1 -mb-1"
                  checked={enabledForAllTables}
                  onChange={() => toggleReplicationForAllTables(publication, enabledForAllTables)}
                />
              </div> */}
                </Table.th>,
              ]}
              body={tables.map((table) => (
                <PublicationsTableItem
                  key={table.id}
                  table={table}
                  selectedPublication={selectedPublication}
                />
              ))}
            />
          </div>
        ))}
    </>
  )
}
