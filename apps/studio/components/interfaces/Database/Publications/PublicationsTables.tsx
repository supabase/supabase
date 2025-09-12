import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ChevronLeft, Search } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import { useParams } from 'common'
import NoSearchResults from 'components/to-be-cleaned/NoSearchResults'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { Loading } from 'components/ui/Loading'
import { useDatabasePublicationsQuery } from 'data/database-publications/database-publications-query'
import { useTablesQuery } from 'data/tables/tables-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'
import { Admonition } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'
import { PublicationsTableItem } from './PublicationsTableItem'

export const PublicationsTables = () => {
  const { ref, id } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const [filterString, setFilterString] = useState<string>('')

  const { can: canUpdatePublications, isLoading: isLoadingPermissions } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'publications'
  )

  const { data: publications = [] } = useDatabasePublicationsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const selectedPublication = publications.find((pub) => pub.id === Number(id))

  const {
    data: tablesData = [],
    isLoading,
    isSuccess,
    isError,
    error,
  } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const tables = useMemo(() => {
    return tablesData.filter((table) =>
      filterString.length === 0 ? table : table.name.includes(filterString)
    )
  }, [tablesData, filterString])

  return (
    <>
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ButtonTooltip
              asChild
              type="outline"
              icon={<ChevronLeft />}
              style={{ padding: '5px' }}
              tooltip={{ content: { side: 'bottom', text: 'Go back to publications list' } }}
            >
              <Link href={`/project/${ref}/database/publications`} />
            </ButtonTooltip>
            <div>
              <Input
                size="tiny"
                placeholder="Search for a table"
                value={filterString}
                onChange={(e) => setFilterString(e.target.value)}
                icon={<Search size={12} />}
                className="w-48 pl-8"
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
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Schema</TableHead>
                  <TableHead>Description</TableHead>
                  {/* 
                      We've disabled All tables toggle for publications. 
                      See https://github.com/supabase/supabase/pull/7233. 
                    */}
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {!!selectedPublication ? (
                  tables.map((table) => (
                    <PublicationsTableItem
                      key={table.id}
                      table={table}
                      selectedPublication={selectedPublication}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <p>The selected publication with ID {id} cannot be found</p>
                      <p className="text-foreground-light">
                        Head back to the list of publications to select one from there
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        ))}
    </>
  )
}
