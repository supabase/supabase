import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useViewDefinitionQuery } from 'data/database/view-definition-query'
import { lintKeys } from 'data/lint/keys'
import { useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { Entity, isViewLike } from 'data/table-editor/table-editor-types'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { ScrollArea, SimpleCodeBlock } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

interface MaterializedViewEntityAutofixSecurityModalProps {
  table: Entity
  isAutofixMaterializedViewSecurityModalOpen: boolean
  setIsAutofixMaterializedViewSecurityModalOpen: (isIsAutofixMaterializedViewSecurityModalOpen: boolean) => void
}

export default function MaterializedViewEntityAutofixSecurityModal({
  table,
  isAutofixMaterializedViewSecurityModalOpen,
  setIsAutofixMaterializedViewSecurityModalOpen,
}: MaterializedViewEntityAutofixSecurityModalProps) {
  const { data: project } = useSelectedProjectQuery()
  const queryClient = useQueryClient()
  const { isSuccess, isLoading, data } = useViewDefinitionQuery(
    {
      id: table?.id,
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    {
      enabled: isAutofixMaterializedViewSecurityModalOpen && isViewLike(table),
    }
  )

  const { mutate: execute } = useExecuteSqlMutation({
    onSuccess: async () => {
      toast.success('Materialized view security changed successfully')
      setIsAutofixMaterializedViewSecurityModalOpen(false)
      await queryClient.invalidateQueries({ queryKey: lintKeys.lint(project?.ref) })
    },
    onError: (error) => {
      toast.error(`Failed to autofix materialized view security: ${error.message}`)
    },
  })

  const sql = `
    REVOKE SELECT on "${table.schema}"."${table.name}" FROM public, anon, authenticated;
  `

  function handleConfirm() {
    execute({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      sql,
    })
  }

  if (!isViewLike(table)) {
    return null
  }

  return (
    <ConfirmationModal
      visible={isAutofixMaterializedViewSecurityModalOpen}
      size="xlarge"
      title="Confirm autofixing view security"
      confirmLabel="Confirm"
      onCancel={() => setIsAutofixMaterializedViewSecurityModalOpen(false)}
      onConfirm={() => handleConfirm()}
    >
      <p className="text-sm text-foreground-light">
        Revoking <code>select</code> access from API
        roles <code>anon</code> and <code>authenticated</code> mitigates the risk of exposing
        sensitive data to all users.
      </p>
      
      <div className="border rounded-md mt-8">
        <ScrollArea className="h-[225px] px-4 py-2">
          {isLoading && <GenericSkeletonLoader />}
          {isSuccess && <SimpleCodeBlock>{sql}</SimpleCodeBlock>}
        </ScrollArea>
      </div>
    </ConfirmationModal>
  )
}
