import type { PostgresPublication } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useState } from 'react'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import NoSearchResults from 'components/to-be-cleaned/NoSearchResults'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import InformationBox from 'components/ui/InformationBox'
import { Loading } from 'components/ui/Loading'
import { useTablesQuery } from 'data/tables/tables-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { EXCLUDED_SCHEMAS } from 'lib/constants/schemas'
import { Button, Input } from 'ui'
import PublicationsTableItem from './PublicationsTableItem'
import { ChevronLeft, Search, AlertCircle } from 'lucide-react'

interface PublicationsTablesProps {
  selectedPublication: PostgresPublication
  onSelectBack: () => void
}

const PublicationsTables = ({ selectedPublication, onSelectBack }: PublicationsTablesProps) => {
  const { project } = useProjectContext()
  const [filterString, setFilterString] = useState<string>('')

  const canUpdatePublications = useCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'publications'
  )

  const {
    data: tables,
    isLoading,
    isSuccess,
    isError,
    error,
  } = useTablesQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    {
      select(tables) {
        return tables.filter((table) =>
          filterString.length === 0
            ? !EXCLUDED_SCHEMAS.includes(table.schema)
            : !EXCLUDED_SCHEMAS.includes(table.schema) && table.name.includes(filterString)
        )
      },
    }
  )

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
          {!canUpdatePublications && (
            <div className="w-[500px]">
              <InformationBox
                icon={<AlertCircle className="text-foreground-light" strokeWidth={2} />}
                title="You need additional permissions to update database replications"
              />
            </div>
          )}
        </div>
      </div>
      {isLoading && (
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
              body={tables.map((table: any, i: number) => (
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

export default PublicationsTables
