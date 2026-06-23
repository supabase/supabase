import { useMemo, useState } from 'react'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { Policies } from '@/components/interfaces/Auth/Policies/Policies'
import { PoliciesDataProvider } from '@/components/interfaces/Auth/Policies/PoliciesDataContext'
import { PolicyEditorPanel } from '@/components/interfaces/Auth/Policies/PolicyEditorPanel'
import type { Policy } from '@/components/interfaces/Auth/Policies/PolicyTableRow/PolicyTableRow.utils'
import { getExposedSchemas } from '@/components/layouts/ProjectNeedsSecuring/ProjectNeedsSecuring.utils'
import AlertError from '@/components/ui/AlertError'
import { useProjectPostgrestConfigQuery } from '@/data/config/project-postgrest-config-query'
import { useDatabasePoliciesQuery } from '@/data/database-policies/database-policies-query'
import type { TableLike } from '@/data/table-editor/table-editor-types'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useIsProtectedSchema } from '@/hooks/useProtectedSchemas'

interface TableDetailPoliciesTabProps {
  table: TableLike
}

export function TableDetailPoliciesTab({ table }: TableDetailPoliciesTabProps) {
  const { data: project } = useSelectedProjectQuery()
  const isSchemaLocked = useIsProtectedSchema({ schema: table.schema }).isSchemaLocked

  const [showPolicyEditor, setShowPolicyEditor] = useState(false)
  const [selectedPolicyToEdit, setSelectedPolicyToEdit] = useState<Policy>()

  const { data: dbSchema } = useProjectPostgrestConfigQuery(
    { projectRef: project?.ref },
    { select: ({ db_schema }) => db_schema }
  )
  const exposedSchemas = useMemo(() => getExposedSchemas(dbSchema), [dbSchema])

  const {
    data: policies,
    isPending: isLoadingPolicies,
    isError: isPoliciesError,
    error: policiesError,
  } = useDatabasePoliciesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const visibleTableIds = useMemo(() => new Set([table.id]), [table.id])

  const policyTable = useMemo(
    () => ({
      id: table.id,
      schema: table.schema,
      name: table.name,
      rls_enabled: table.rls_enabled,
    }),
    [table]
  )

  if (isLoadingPolicies) {
    return <GenericSkeletonLoader />
  }

  if (isPoliciesError) {
    return <AlertError error={policiesError} subject="Failed to retrieve policies" />
  }

  return (
    <>
      <PoliciesDataProvider
        policies={policies ?? []}
        isPoliciesLoading={isLoadingPolicies}
        isPoliciesError={isPoliciesError}
        policiesError={policiesError ?? undefined}
        exposedSchemas={exposedSchemas}
      >
        <Policies
          schema={table.schema}
          tables={[policyTable]}
          hasTables
          isLocked={isSchemaLocked}
          visibleTableIds={visibleTableIds}
          onSelectCreatePolicy={() => {
            setSelectedPolicyToEdit(undefined)
            setShowPolicyEditor(true)
          }}
          onSelectEditPolicy={(policy) => {
            setSelectedPolicyToEdit(policy)
            setShowPolicyEditor(true)
          }}
        />
      </PoliciesDataProvider>

      <PolicyEditorPanel
        visible={showPolicyEditor}
        searchString={String(table.id)}
        schema={table.schema}
        selectedPolicy={selectedPolicyToEdit}
        onSelectCancel={() => setShowPolicyEditor(false)}
        authContext="database"
      />
    </>
  )
}
