import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from 'data/auth/auth-config-update-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { AddHookDropdown } from './AddHookDropdown'
import { CreateHookSheet } from './CreateHookSheet'
import { HookCard } from './HookCard'
import { HOOKS_DEFINITIONS, HOOK_DEFINITION_TITLE, Hook } from './hooks.constants'
import { extractMethod, getRevokePermissionStatements, isValidHook } from './hooks.utils'
import { executeSql } from 'data/sql/execute-sql-query'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import CodeEditor from 'components/ui/CodeEditor/CodeEditor'
import { cn } from 'ui'

export const HooksListing = () => {
  const { ref: projectRef } = useParams()
  const { project } = useProjectContext()
  const { data: authConfig, error: authConfigError, isError } = useAuthConfigQuery({ projectRef })

  const [selectedHook, setSelectedHook] = useState<HOOK_DEFINITION_TITLE | null>(null)
  const [selectedHookForDeletion, setSelectedHookForDeletion] = useState<Hook | null>(null)

  const { mutateAsync: updateAuthConfig } = useAuthConfigUpdateMutation()
  const canUpdateConfig = useCheckPermissions(PermissionAction.UPDATE, 'custom_config_gotrue')

  const hooks: Hook[] = HOOKS_DEFINITIONS.map((definition) => {
    return {
      ...definition,
      enabled: authConfig?.[definition.enabledKey] || false,
      method: extractMethod(
        authConfig?.[definition.uriKey] || '',
        authConfig?.[definition.secretsKey] || ''
      ),
    }
  })

  if (isError) {
    return (
      <AlertError
        error={authConfigError}
        subject="Failed to retrieve auth configuration for hooks"
      />
    )
  }

  return (
    <div className="pb-4">
      <FormHeader
        title="Auth Hooks"
        description="Use Postgres functions or HTTP endpoints to customize the behavior of Supabase Auth to meet your needs."
        actions={<AddHookDropdown onSelectHook={setSelectedHook} />}
      />

      {hooks.filter((h) => isValidHook(h)).length === 0 && (
        <div
          className={[
            'border rounded border-default px-20 py-16',
            'flex flex-col items-center justify-center space-y-4',
          ].join(' ')}
        >
          <p className="text-sm text-foreground-light">No hooks configured yet</p>
          <AddHookDropdown buttonText="Add a new hook" onSelectHook={setSelectedHook} />
        </div>
      )}

      <div className="-space-y-px">
        {hooks
          .filter((h) => isValidHook(h))
          .map((hook) => {
            return (
              <HookCard
                key={hook.enabledKey}
                hook={hook}
                canUpdateConfig={canUpdateConfig}
                onToggle={(enabled) =>
                  updateAuthConfig({
                    projectRef: projectRef!,
                    config: { [hook.enabledKey]: enabled },
                  })
                }
                onSelect={() => {
                  setSelectedHook(hook.title)
                }}
              />
            )
          })}
      </div>

      <CreateHookSheet
        title={selectedHook}
        visible={!!selectedHook}
        onDelete={() => {
          const hook = hooks.find((h) => h.title === selectedHook)
          if (hook) {
            setSelectedHookForDeletion(hook)
          }
        }}
        onClose={() => setSelectedHook(null)}
        authConfig={authConfig!}
      />

      <ConfirmationModal
        visible={!!selectedHookForDeletion}
        size="large"
        variant="destructive"
        title="Confirm to delete"
        confirmLabel="Delete"
        confirmLabelLoading="Deleting"
        onCancel={() => setSelectedHookForDeletion(null)}
        onConfirm={async () => {
          if (!selectedHookForDeletion) {
            return
          }

          await updateAuthConfig({
            projectRef: projectRef!,
            config: {
              [selectedHookForDeletion.enabledKey]: false,
              [selectedHookForDeletion.uriKey]: null,
              [selectedHookForDeletion.secretsKey]: null,
            },
          })

          const { method } = selectedHookForDeletion

          if (method.type === 'postgres') {
            const revokeStatements = getRevokePermissionStatements(
              method.schema,
              method.functionName
            )
            await executeSql({
              projectRef,
              connectionString: project!.connectionString,
              sql: revokeStatements.join('\n'),
            })
          }
          toast.success(`${selectedHookForDeletion.title} has been deleted.`)
          setSelectedHookForDeletion(null)
          setSelectedHook(null)
        }}
      >
        <div>
          <p className="py-4 text-sm text-foreground-light">
            {`Are you sure you want to delete the ${selectedHookForDeletion?.title}?`}
          </p>
          {selectedHookForDeletion?.method.type === 'postgres' && (
            <>
              <p className="py-4 text-sm text-foreground-light">
                {`The following statements will be executed on the ${selectedHookForDeletion?.method.schema}.${selectedHookForDeletion?.method.functionName} function:`}
              </p>
              <div className={cn('h-72')}>
                <CodeEditor
                  id="deletion-hook-editor"
                  isReadOnly={true}
                  language="pgsql"
                  value={getRevokePermissionStatements(
                    selectedHookForDeletion?.method.schema,
                    selectedHookForDeletion?.method.functionName
                  ).join('\n\n')}
                />
              </div>
            </>
          )}
        </div>
      </ConfirmationModal>
    </div>
  )
}
