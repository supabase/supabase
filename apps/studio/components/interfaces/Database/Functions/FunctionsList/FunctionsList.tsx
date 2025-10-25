import type { PostgresFunction } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { noop } from 'lodash'
import { Search } from 'lucide-react'
import { useRouter } from 'next/router'
import { parseAsJson, useQueryState } from 'nuqs'

import { useParams } from 'common'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import SchemaSelector from 'components/ui/SchemaSelector'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { useDatabaseFunctionsQuery } from 'data/database-functions/database-functions-query'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useIsProtectedSchema } from 'hooks/useProtectedSchemas'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import {
  AiIconAnimation,
  Card,
  Input,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import {
  ReportsSelectFilter,
  selectFilterSchema,
} from 'components/interfaces/Reports/v2/ReportsSelectFilter'
import { ProtectedSchemaWarning } from '../../ProtectedSchemaWarning'
import FunctionList from './FunctionList'

interface FunctionsListProps {
  createFunction: () => void
  duplicateFunction: (fn: PostgresFunction) => void
  editFunction: (fn: PostgresFunction) => void
  deleteFunction: (fn: PostgresFunction) => void
}

const FunctionsList = ({
  createFunction = noop,
  editFunction = noop,
  deleteFunction = noop,
  duplicateFunction = noop,
}: FunctionsListProps) => {
  const router = useRouter()
  const { search } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const aiSnap = useAiAssistantStateSnapshot()
  const { openSidebar } = useSidebarManagerSnapshot()
  const { selectedSchema, setSelectedSchema } = useQuerySchemaState()

  const filterString = search ?? ''

  // Filters
  const [returnTypeFilter, setReturnTypeFilter] = useQueryState(
    'return_type',
    parseAsJson(selectFilterSchema.parse)
  )
  const [securityFilter, setSecurityFilter] = useQueryState(
    'security',
    parseAsJson(selectFilterSchema.parse)
  )

  const setFilterString = (str: string) => {
    const url = new URL(document.URL)
    if (str === '') {
      url.searchParams.delete('search')
    } else {
      url.searchParams.set('search', str)
    }
    router.push(url)
  }

  const { can: canCreateFunctions } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'functions'
  )

  const { isSchemaLocked } = useIsProtectedSchema({ schema: selectedSchema })

  // [Joshen] This is to preload the data for the Schema Selector
  useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const {
    data: functions,
    error,
    isLoading,
    isError,
  } = useDatabaseFunctionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  // Get unique return types from functions in the selected schema
  const schemaFunctions = (functions ?? []).filter((fn) => fn.schema === selectedSchema)
  const uniqueReturnTypes = Array.from(new Set(schemaFunctions.map((fn) => fn.return_type))).sort()

  // Get security options based on what exists in the selected schema
  const hasDefiner = schemaFunctions.some((fn) => fn.security_definer)
  const hasInvoker = schemaFunctions.some((fn) => !fn.security_definer)
  const securityOptions = [
    ...(hasDefiner ? [{ label: 'Definer', value: 'definer' }] : []),
    ...(hasInvoker ? [{ label: 'Invoker', value: 'invoker' }] : []),
  ]

  if (isLoading) return <GenericSkeletonLoader />
  if (isError) return <AlertError error={error} subject="Failed to retrieve database functions" />

  return (
    <>
      {(functions ?? []).length == 0 ? (
        <div className="flex h-full w-full items-center justify-center">
          <ProductEmptyState
            title="Functions"
            ctaButtonLabel="Create a new function"
            onClickCta={() => createFunction()}
            disabled={!canCreateFunctions}
            disabledMessage="You need additional permissions to create functions"
          >
            <p className="text-sm text-foreground-light">
              PostgreSQL functions, also known as stored procedures, is a set of SQL and procedural
              commands such as declarations, assignments, loops, flow-of-control, etc.
            </p>
            <p className="text-sm text-foreground-light">
              It's stored on the database server and can be invoked using the SQL interface.
            </p>
          </ProductEmptyState>
        </div>
      ) : (
        <div className="w-full space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 flex-wrap">
            <div className="flex flex-col lg:flex-row lg:items-center gap-2">
              <SchemaSelector
                className="w-full lg:w-[180px]"
                size="tiny"
                showError={false}
                selectedSchemaName={selectedSchema}
                onSelectSchema={(schema) => {
                  setFilterString('')
                  // Wait for the filter to be cleared from the URL
                  setTimeout(() => {
                    setSelectedSchema(schema)
                  }, 50)
                }}
              />
              <Input
                placeholder="Search for a function"
                size="tiny"
                icon={<Search size={14} />}
                value={filterString}
                className="w-full lg:w-52"
                onChange={(e) => setFilterString(e.target.value)}
              />
              <ReportsSelectFilter
                label="Return Type"
                options={uniqueReturnTypes.map((type) => ({
                  label: type,
                  value: type,
                }))}
                value={returnTypeFilter ?? []}
                onChange={setReturnTypeFilter}
                showSearch
              />
              <ReportsSelectFilter
                label="Security"
                options={securityOptions}
                value={securityFilter ?? []}
                onChange={setSecurityFilter}
              />
            </div>

            <div className="flex items-center gap-x-2">
              {!isSchemaLocked && (
                <>
                  <ButtonTooltip
                    disabled={!canCreateFunctions}
                    onClick={() => createFunction()}
                    className="flex-grow"
                    tooltip={{
                      content: {
                        side: 'bottom',
                        text: !canCreateFunctions
                          ? 'You need additional permissions to create functions'
                          : undefined,
                      },
                    }}
                  >
                    Create a new function
                  </ButtonTooltip>
                  <ButtonTooltip
                    type="default"
                    disabled={!canCreateFunctions}
                    className="px-1 pointer-events-auto"
                    icon={<AiIconAnimation size={16} />}
                    onClick={() => {
                      openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
                      aiSnap.newChat({
                        name: 'Create new function',
                        initialInput: `Create a new function for the schema ${selectedSchema} that does ...`,
                      })
                    }}
                    tooltip={{
                      content: {
                        side: 'bottom',
                        text: !canCreateFunctions
                          ? 'You need additional permissions to create functions'
                          : 'Create with Supabase Assistant',
                      },
                    }}
                  />
                </>
              )}
            </div>
          </div>

          {isSchemaLocked && <ProtectedSchemaWarning schema={selectedSchema} entity="functions" />}
          <Card>
            <Table className="table-fixed overflow-x-auto">
              <TableHeader>
                <TableRow>
                  <TableHead key="name">Name</TableHead>
                  <TableHead key="arguments" className="table-cell">
                    Arguments
                  </TableHead>
                  <TableHead key="return_type" className="table-cell">
                    Return type
                  </TableHead>
                  <TableHead key="security" className="table-cell w-[100px]">
                    Security
                  </TableHead>
                  <TableHead key="buttons" className="w-1/6"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <FunctionList
                  schema={selectedSchema}
                  filterString={filterString}
                  isLocked={isSchemaLocked}
                  returnTypeFilter={returnTypeFilter ?? []}
                  securityFilter={securityFilter ?? []}
                  duplicateFunction={duplicateFunction}
                  editFunction={editFunction}
                  deleteFunction={deleteFunction}
                />
              </TableBody>
            </Table>
          </Card>
        </div>
      )}
    </>
  )
}

export default FunctionsList
