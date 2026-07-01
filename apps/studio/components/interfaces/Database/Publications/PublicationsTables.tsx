import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { Search } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { Input } from 'ui-patterns/DataInputs/Input'

import { PublicationTablesSkeleton } from './PublicationSkeleton'
import { PublicationsTableItem } from './PublicationsTableItem'
import { AlertError } from '@/components/ui/AlertError'
import { NoSearchResults } from '@/components/ui/NoSearchResults'
import { SchemaSelector } from '@/components/ui/SchemaSelector'
import { Shortcut } from '@/components/ui/Shortcut'
import { useDatabasePublicationsQuery } from '@/data/database-publications/database-publications-query'
import { useTablesQuery } from '@/data/tables/tables-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useQuerySchemaState } from '@/hooks/misc/useSchemaQueryState'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { onSearchInputEscape } from '@/lib/keyboard'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

export const PublicationsTables = () => {
  const { id } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { selectedSchema, setSelectedSchema } = useQuerySchemaState()

  const [filterString, setFilterString] = useState<string>('')
  const [schemaSelectorOpen, setSchemaSelectorOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const { can: canUpdatePublications, isLoading: isLoadingPermissions } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'publications'
  )

  useShortcut(
    SHORTCUT_IDS.LIST_PAGE_FOCUS_SEARCH,
    () => {
      searchInputRef.current?.focus()
      searchInputRef.current?.select()
    },
    { label: 'Search publications' }
  )

  const { data: publications = [] } = useDatabasePublicationsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const selectedPublication = publications.find((pub) => pub.id === Number(id))

  const {
    data: tablesData = [],
    isPending: isLoading,
    isSuccess,
    isError,
    error,
  } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: selectedSchema,
  })

  const tables = useMemo(() => {
    return tablesData.filter((table) =>
      filterString.length === 0 ? table : table.name.includes(filterString)
    )
  }, [tablesData, filterString])

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-center gap-2 flex-wrap mb-4">
        <Shortcut
          id={SHORTCUT_IDS.LIST_PAGE_FOCUS_SCHEMA}
          onTrigger={() => setSchemaSelectorOpen(true)}
          side="bottom"
          tooltipOpen={schemaSelectorOpen ? false : undefined}
        >
          <SchemaSelector
            className="w-full lg:w-[180px]"
            size="tiny"
            showError={false}
            selectedSchemaName={selectedSchema}
            onSelectSchema={setSelectedSchema}
            open={schemaSelectorOpen}
            onOpenChange={setSchemaSelectorOpen}
          />
        </Shortcut>
        <Input
          size="tiny"
          ref={searchInputRef}
          icon={<Search />}
          className="w-48"
          placeholder="Search for a table"
          value={filterString}
          onChange={(e) => setFilterString(e.target.value)}
          onKeyDown={onSearchInputEscape(filterString, setFilterString)}
        />
      </div>

      {!isLoadingPermissions && !canUpdatePublications && (
        <Admonition
          type="warning"
          className="mb-4 w-full"
          description="You need additional permissions to update database replications."
        />
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden lg:table-cell">Description</TableHead>
              {/*
                    We've disabled All tables toggle for publications.
                    See https://github.com/supabase/supabase/pull/7233.
                  */}
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(isLoading || isLoadingPermissions) &&
              Array.from({ length: 2 }).map((_, i) => (
                <PublicationTablesSkeleton key={i} index={i} />
              ))}

            {isError && (
              <TableRow>
                <TableCell colSpan={3}>
                  <AlertError error={error} subject="Failed to retrieve tables" />
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !isLoadingPermissions && tables.length === 0 && (
              <TableRow>
                <TableCell colSpan={3}>
                  <NoSearchResults
                    className="border-none !p-0"
                    searchString={filterString}
                    onResetFilter={() => setFilterString('')}
                  />
                </TableCell>
              </TableRow>
            )}

            {isSuccess ? (
              !!selectedPublication ? (
                tables.map((table) => (
                  <PublicationsTableItem
                    key={table.id}
                    table={table}
                    selectedPublication={selectedPublication}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3}>
                    <p>The selected publication with ID {id} cannot be found</p>
                    <p className="text-foreground-light">
                      Head back to the list of publications to select one from there
                    </p>
                  </TableCell>
                </TableRow>
              )
            ) : null}
          </TableBody>
        </Table>
      </Card>
    </>
  )
}
